import { type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export async function invalidateUserBlockRelatedQueries(
  queryClient: QueryClient,
  targetUserId: string,
  currentUserId?: string | null,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.user.bans() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.user.followCounts(targetUserId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.user.followers(targetUserId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.user.followings(targetUserId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.user.me() }),
    ...(currentUserId
      ? [queryClient.invalidateQueries({ queryKey: queryKeys.user.followings(currentUserId) })]
      : []),
    queryClient.invalidateQueries({ queryKey: [...queryKeys.posts.all, "user-community"] as const }),
    queryClient.invalidateQueries({ queryKey: [...queryKeys.posts.all, "user-community-category"] as const }),
    queryClient.invalidateQueries({ queryKey: [...queryKeys.posts.all, "user-categories"] as const }),
  ]);
}
