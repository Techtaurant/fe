"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Post } from "../types";
import { queryKeys } from "../lib/queryKeys";
import { fetchUserPostList } from "../services/posts";
import { isPlaceholderCategoryPath, normalizeCategoryPath } from "./useUserCategories";
import { PostListPeriod, PostListSort } from "../services/posts/types";
import { UNCATEGORIZED_CATEGORY_ID } from "@/app/constants/category";

interface UseUserCommunityFeedOptions {
  enabled: boolean;
  userId: string;
  period: PostListPeriod;
  sort: PostListSort;
  categoryIds?: string[];
  size?: number;
  includePrivatePosts?: boolean;
}

interface UseUserCommunityFeedResult {
  posts: Post[];
  error: string | null;
  hasNext: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
}

const MAX_PAGES = 200;

function filterPrivatePosts(posts: Post[], includePrivatePosts: boolean): Post[] {
  if (includePrivatePosts) {
    return posts;
  }

  return posts.filter((post) => post.status !== "PRIVATE");
}

function sortPosts(posts: Post[], sort: PostListSort): Post[] {
  const copy = [...posts];
  const parsePublishedAt = (value: string): number => {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  copy.sort((left, right) => {
    if (sort === "LATEST") {
      return parsePublishedAt(right.publishedAt) - parsePublishedAt(left.publishedAt);
    }
    if (sort === "VIEW") {
      return (right.viewCount ?? 0) - (left.viewCount ?? 0);
    }
    if (sort === "LIKE") {
      return (right.likeCount ?? 0) - (left.likeCount ?? 0);
    }
    return (right.commentCount ?? 0) - (left.commentCount ?? 0);
  });

  return copy;
}

function dedupePosts(posts: Post[]): Post[] {
  const mappedById = new Map<string, Post>(posts.map((post) => [post.id, post]));
  return Array.from(mappedById.values());
}

function isUncategorizedPost(post: Post): boolean {
  const rawCategoryPath = post.categoryPath;
  const hasCategoryId = Boolean(post.categoryId);

  if (!rawCategoryPath) {
    return !hasCategoryId;
  }

  const normalizedPath = normalizeCategoryPath(rawCategoryPath).toLowerCase();
  if (!normalizedPath || isPlaceholderCategoryPath(rawCategoryPath)) {
    return !hasCategoryId;
  }

  return false;
}

async function fetchAllUserPosts(params: {
  userId: string;
  categoryId?: string;
  period: PostListPeriod;
  sort: PostListSort;
  size: number;
}): Promise<Post[]> {
  const aggregated: Post[] = [];
  let cursor: string | undefined;
  let page = 0;

  while (page < MAX_PAGES) {
    page += 1;
    const response = await fetchUserPostList({
      userId: params.userId,
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      period: params.period,
      sort: params.sort,
      size: params.size,
      ...(cursor ? { cursor } : {}),
    });

    aggregated.push(...response.posts);

    if (!response.hasNext || !response.nextCursor) {
      break;
    }

    cursor = response.nextCursor;
  }

  return aggregated;
}

export function useUserCommunityFeed({
  enabled,
  userId,
  period,
  sort,
  categoryIds,
  size = 20,
  includePrivatePosts = false,
}: UseUserCommunityFeedOptions): UseUserCommunityFeedResult {
  const t = useTranslations("CommunityFeed");
  const normalizedCategoryIds = useMemo(() => {
    return [...new Set((categoryIds ?? []).filter((id) => Boolean(id)))];
  }, [categoryIds]);

  const hasCategoryFilter = normalizedCategoryIds.length > 0;
  const hasUncategorizedFilter = normalizedCategoryIds.includes(UNCATEGORIZED_CATEGORY_ID);
  const categoryFilterIds = useMemo(
    () => normalizedCategoryIds.filter((id) => id !== UNCATEGORIZED_CATEGORY_ID),
    [normalizedCategoryIds],
  );

  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.posts.userCommunityList({
      userId,
      period,
      sort,
      size,
      includePrivatePosts,
    }),
    enabled: enabled && Boolean(userId) && !hasCategoryFilter,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return fetchUserPostList({
        userId,
        cursor: pageParam,
        period,
        sort,
        size,
      });
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });

  const filteredQuery = useQuery({
    queryKey: queryKeys.posts.userCommunityListByCategoryIds({
      userId,
      period,
      sort,
      size,
      categoryIds: normalizedCategoryIds,
      includePrivatePosts,
    }),
    enabled: enabled && Boolean(userId) && hasCategoryFilter,
    queryFn: async () => {
      const fetchPromises: Promise<Post[]>[] = [];

      if (categoryFilterIds.length > 0) {
        fetchPromises.push(
          Promise.all(
            categoryFilterIds.map((categoryId) =>
              fetchAllUserPosts({
                userId,
                categoryId,
                period,
                sort,
                size,
              }),
            ),
          ).then((postGroups) => postGroups.flat()),
        );
      }

      if (hasUncategorizedFilter) {
        fetchPromises.push(
          fetchAllUserPosts({
            userId,
            period,
            sort,
            size,
          }).then((posts) => posts.filter(isUncategorizedPost)),
        );
      }

      const merged = (await Promise.all(fetchPromises)).flat();

      const visiblePosts = filterPrivatePosts(merged, includePrivatePosts);

      return {
        posts: sortPosts(dedupePosts(visiblePosts), sort),
        hasNext: false,
      };
    },
  });

  const posts = useMemo(() => {
    if (hasCategoryFilter) {
      return filteredQuery.data?.posts ?? [];
    }

    const merged = (listQuery.data?.pages ?? []).flatMap((page) => page.posts);
    const visiblePosts = filterPrivatePosts(merged, includePrivatePosts);
    return sortPosts(dedupePosts(visiblePosts), sort);
  }, [
    hasCategoryFilter,
    filteredQuery.data?.posts,
    listQuery.data?.pages,
    sort,
    includePrivatePosts,
  ]);

  const error = (hasCategoryFilter ? filteredQuery.error : listQuery.error) ? t("loadFailed") : null;
  const isLoading = hasCategoryFilter ? filteredQuery.isPending : listQuery.isPending;
  const isLoadingMore = hasCategoryFilter ? false : listQuery.isFetchingNextPage;
  const hasNext = hasCategoryFilter ? Boolean(filteredQuery.data?.hasNext) : Boolean(listQuery.hasNextPage);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = listQuery;

  const loadMore = useCallback(async () => {
    if (!hasCategoryFilter && hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasCategoryFilter, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    posts,
    error,
    hasNext,
    isLoading,
    isLoadingMore,
    loadMore,
  };
}
