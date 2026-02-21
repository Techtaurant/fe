"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchCommunityPostList } from "../services/posts";
import { PostListPeriod, PostListSort } from "../services/posts/types";
import { queryKeys } from "../lib/queryKeys";

interface UseCommunityFeedOptions {
  enabled: boolean;
  period: PostListPeriod;
  sort: PostListSort;
  size?: number;
}

export function useCommunityFeed({
  enabled,
  period,
  sort,
  size = 20,
}: UseCommunityFeedOptions) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.posts.communityList({
      period,
      sort,
      size,
    }),
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchCommunityPostList({
        cursor: pageParam,
        size,
        period,
        sort,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const posts = useMemo(() => {
    const merged = (query.data?.pages ?? []).flatMap((page) => page.posts);
    const deduped = new Map(merged.map((post) => [post.id, post]));
    return Array.from(deduped.values());
  }, [query.data?.pages]);

  const error = query.error ? "커뮤니티 게시물을 불러오지 못했습니다." : null;
  const isLoading = query.isPending;
  const isLoadingMore = query.isFetchingNextPage;
  const hasNext = Boolean(query.hasNextPage);

  const loadMore = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return;
    }
    await query.fetchNextPage();
  }, [query]);

  return {
    posts,
    error,
    hasNext,
    isLoading,
    isLoadingMore,
    loadMore,
  };
}
