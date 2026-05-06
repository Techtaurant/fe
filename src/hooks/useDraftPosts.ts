"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { fetchDraftPostList } from "../services/posts";
import { queryKeys } from "../lib/queryKeys";

interface UseDraftPostsOptions {
  enabled: boolean;
  size?: number;
}

export function useDraftPosts({ enabled, size = 20 }: UseDraftPostsOptions) {
  const t = useTranslations("DraftsPage");
  const query = useInfiniteQuery({
    queryKey: queryKeys.posts.draftsList({ size }),
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchDraftPostList({
        cursor: pageParam,
        size,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const drafts = useMemo(() => {
    const merged = (query.data?.pages ?? []).flatMap((page) => page.drafts);
    const deduped = new Map(merged.map((draft) => [draft.id, draft]));
    return Array.from(deduped.values());
  }, [query.data?.pages]);

  const isLoading = query.isPending;
  const isLoadingMore = query.isFetchingNextPage;
  const hasNext = Boolean(query.hasNextPage);

  const errorMessage = (() => {
    if (!query.error) return null;
    const message = query.error instanceof Error ? query.error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") {
      return t("signInRequired");
    }
    return t("loadFailed");
  })();

  const loadMore = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return;
    }
    await query.fetchNextPage();
  }, [query]);

  return {
    drafts,
    errorMessage,
    isLoading,
    isLoadingMore,
    hasNext,
    loadMore,
  };
}
