"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserFollowings,
  followUser,
  isFollowApiError,
  unfollowUser,
} from "../services/users/follow";
import { queryKeys } from "../lib/queryKeys";

type FollowAction = "followed" | "unfollowed";

export interface ToggleFollowParams {
  actorUserId: string | null;
  targetUserId: string;
  isCurrentlyFollowing: boolean;
  targetUserName?: string;
  fallbackName?: string;
}

type ToggleFollowSuccess = {
  ok: true;
  action: FollowAction;
  name: string;
};

type ToggleFollowError = {
  ok: false;
  reason: "unauthorized" | "self" | "api" | "unknown";
  message?: string;
  code?: string;
};

export type ToggleFollowResult = ToggleFollowSuccess | ToggleFollowError;

export function useFollowActions() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: { targetUserId: string; shouldFollow: boolean }) => {
      if (params.shouldFollow) {
        await followUser(params.targetUserId);
        return;
      }

      await unfollowUser(params.targetUserId);
    },
  });

  const toggleFollow = async (params: ToggleFollowParams): Promise<ToggleFollowResult> => {
    const {
      actorUserId,
      targetUserId,
      isCurrentlyFollowing,
      targetUserName,
      fallbackName = "",
    } = params;

    if (!actorUserId) {
      return { ok: false, reason: "unauthorized" };
    }

    if (actorUserId === targetUserId) {
      return { ok: false, reason: "self" };
    }

    const shouldFollow = !isCurrentlyFollowing;

    try {
      await mutation.mutateAsync({ targetUserId, shouldFollow });

      queryClient.setQueryData(
        queryKeys.user.followings(actorUserId),
        (current: Awaited<ReturnType<typeof fetchUserFollowings>> | undefined) => {
          if (!current) {
            return current;
          }

          if (shouldFollow) {
            if (current.data.some((item) => item.userId === targetUserId)) {
              return current;
            }

            return {
              ...current,
              data: [
                {
                  userId: targetUserId,
                  name: targetUserName ?? fallbackName,
                },
                ...current.data,
              ],
            };
          }

          return {
            ...current,
            data: current.data.filter((item) => item.userId !== targetUserId),
          };
        },
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.user.followings(actorUserId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.followCounts(actorUserId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.followCounts(targetUserId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.followers(targetUserId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.followings(targetUserId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.me() }),
      ]);

      return {
        ok: true,
        action: shouldFollow ? "followed" : "unfollowed",
        name: targetUserName ?? fallbackName,
      };
    } catch (error: unknown) {
      if (isFollowApiError(error)) {
        if (error.code === "UNAUTHORIZED") {
          return { ok: false, reason: "unauthorized", code: error.code };
        }

        return {
          ok: false,
          reason: "api",
          message: error.message,
          code: error.code,
        };
      }

      return { ok: false, reason: "unknown" };
    }
  };

  return {
    toggleFollow,
    isPending: mutation.isPending,
  };
}
