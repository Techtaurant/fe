"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchMyBans, isBanApiError, unbanUser } from "../services/users/ban";

export function useUserBans(enabled: boolean) {
  const queryClient = useQueryClient();

  const bansQuery = useQuery({
    queryKey: queryKeys.user.bans(),
    queryFn: fetchMyBans,
    enabled,
  });

  const unbanMutation = useMutation({
    mutationFn: (targetUserId: string) => unbanUser(targetUserId),
    onMutate: async (targetUserId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.bans() });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchMyBans>>>(
        queryKeys.user.bans(),
      );

      queryClient.setQueryData<Awaited<ReturnType<typeof fetchMyBans>>>(
        queryKeys.user.bans(),
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.filter((item) => item.userId !== targetUserId),
          };
        },
      );

      return { previous };
    },
    onError: (_error, _targetUserId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.user.bans(), context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.bans() });
    },
  });

  const bans = useMemo(() => bansQuery.data?.data ?? [], [bansQuery.data?.data]);

  const unbanByUserId = async (targetUserId: string) => {
    try {
      await unbanMutation.mutateAsync(targetUserId);
      return { ok: true as const, errorCode: null };
    } catch (error: unknown) {
      if (isBanApiError(error)) {
        return { ok: false as const, errorCode: error.code };
      }
      return { ok: false as const, errorCode: "UNKNOWN" as const };
    }
  };

  return {
    bans,
    isLoading: bansQuery.isPending,
    isFetching: bansQuery.isFetching,
    isError: bansQuery.isError,
    unbanningUserId: unbanMutation.variables ?? null,
    unbanByUserId,
  };
}
