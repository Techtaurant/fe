"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { fetchCommunityPostList } from "../services/posts";
import { PostListPeriod, PostListSort } from "../services/posts/types";
import { queryKeys } from "../lib/queryKeys";

interface UseCommunityFeedOptions {
  enabled: boolean;
  period: PostListPeriod;
  sort: PostListSort;
  authorId?: string;
  categoryPath?: string;
  size?: number;
}

export function useCommunityFeed({
  enabled,
  period,
  sort,
  authorId,
  categoryPath,
  size = 20,
}: UseCommunityFeedOptions) {
  const t = useTranslations("CommunityFeed");
  const query = useInfiniteQuery({
    queryKey: queryKeys.posts.communityList({
      period,
      sort,
      size,
      authorId,
      categoryPath,
    }),
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchCommunityPostList({
        cursor: pageParam,
        size,
        period,
        sort,
        authorId,
        categoryPath,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const posts = useMemo(() => {
    const parsePublishedAt = (value: string): number => {
      const timestamp = new Date(value).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const merged = (query.data?.pages ?? []).flatMap((page) => page.posts);
    const deduped = new Map(merged.map((post) => [post.id, post]));
    const dedupedPosts = Array.from(deduped.values());

    if (sort === "LATEST") {
      return dedupedPosts.sort(
        (left, right) => parsePublishedAt(right.publishedAt) - parsePublishedAt(left.publishedAt),
      );
    }

    return dedupedPosts;
  }, [query.data?.pages, sort]);

  const error = query.error ? t("loadFailed") : null;
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
