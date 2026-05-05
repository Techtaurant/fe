"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { banUser, isBanApiError, unbanUser } from "../services/users/ban";
import { invalidateUserBlockRelatedQueries } from "../lib/userBlockQueryInvalidation";

type BlockResult = "blocked" | "alreadyBlocked";

export function useUserBlockActions(currentUserId?: string | null) {
  const queryClient = useQueryClient();

  const blockMutation = useMutation({
    mutationFn: async (targetUserId: string): Promise<BlockResult> => {
      try {
        await banUser(targetUserId);
        return "blocked";
      } catch (error: unknown) {
        if (isBanApiError(error) && error.code === "CONFLICT") {
          return "alreadyBlocked";
        }

        throw error;
      }
    },
    onSuccess: (result, targetUserId) => {
      if (result === "blocked" || result === "alreadyBlocked") {
        void invalidateUserBlockRelatedQueries(queryClient, targetUserId, currentUserId);
      }
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await unbanUser(targetUserId);
    },
    onSuccess: (_data, targetUserId) => {
      void invalidateUserBlockRelatedQueries(queryClient, targetUserId, currentUserId);
    },
  });

  return {
    blockUser: blockMutation.mutateAsync,
    unblockUser: unblockMutation.mutateAsync,
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
  };
}
