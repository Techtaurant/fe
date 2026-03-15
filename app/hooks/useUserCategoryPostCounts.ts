import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../lib/queryKeys";
import { PostListItem, UserCategory, UserPostListResponse } from "../services/posts/types";
import { fetchUserPosts } from "../services/posts/client";
import { isPlaceholderCategoryPath, normalizeCategoryPath } from "./useUserCategories";

interface UseUserCategoryPostCountsOptions {
  enabled: boolean;
  userId: string;
  categories: UserCategory[];
  includePrivatePosts?: boolean;
}

interface UseUserCategoryPostCountsResult {
  countsByCategoryId: Record<string, number>;
  isLoading: boolean;
  error: string | null;
}

const PAGE_SIZE = 20;
const MAX_PAGES = 200;

export const UNCATEGORIZED_CATEGORY_ID = "__uncategorized__";
export const UNCATEGORIZED_CATEGORY_PATH = "__uncategorized__";

function isCategoryPathMatch(postPath: string, categoryPath: string): boolean {
  if (!postPath || !categoryPath) {
    return false;
  }

  if (postPath === categoryPath) {
    return true;
  }

  return postPath.startsWith(`${categoryPath}/`);
}

async function fetchAllUserPosts(userId: string): Promise<PostListItem[]> {
  const posts: PostListItem[] = [];

  let cursor: string | undefined;
  let page = 0;

  while (page < MAX_PAGES) {
    page += 1;
    const response: UserPostListResponse = await fetchUserPosts({
      userId,
      period: "ALL",
      sort: "LATEST",
      size: PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    });

    posts.push(...response.data.content);

    const hasNext =
      typeof response.data.hasNext === "boolean"
        ? response.data.hasNext
        : Boolean(response.data.nextCursor);

    if (!hasNext) {
      break;
    }

    if (!response.data.nextCursor) {
      break;
    }

    cursor = response.data.nextCursor;
  }

  return posts;
}

function buildCategoryCounts(params: {
  categories: UserCategory[];
  posts: PostListItem[];
}): Record<string, number> {
  const validCategories = params.categories
    .filter((category) => !isPlaceholderCategoryPath(category.path))
    .map((category) => ({
      id: category.id,
      normalizedPath: normalizeCategoryPath(category.path).toLowerCase(),
    }));
  const categoryPathById = new Map<string, string>(
    validCategories.map((category) => [category.id, category.normalizedPath]),
  );

  const counts = Object.fromEntries([
    ...validCategories.map((category) => [category.id, 0] as const),
    [UNCATEGORIZED_CATEGORY_ID, 0] as const,
  ]);

  for (const post of params.posts) {
    const rawCategoryPath =
      post.categoryPath ??
      (post.category?.id ? categoryPathById.get(post.category.id) : undefined);

    const postCategoryId = post.category?.id;

    if (!rawCategoryPath) {
      if (postCategoryId && counts[postCategoryId] !== undefined) {
        counts[postCategoryId] += 1;
      } else if (!postCategoryId) {
        counts[UNCATEGORIZED_CATEGORY_ID] += 1;
      }
      continue;
    }

    const normalizedPostPath = normalizeCategoryPath(rawCategoryPath).toLowerCase();
    if (!normalizedPostPath || isPlaceholderCategoryPath(rawCategoryPath)) {
      if (postCategoryId && counts[postCategoryId] !== undefined) {
        counts[postCategoryId] += 1;
      } else if (!postCategoryId) {
        counts[UNCATEGORIZED_CATEGORY_ID] += 1;
      }
      continue;
    }

    let isMatched = false;

    if (postCategoryId && counts[postCategoryId] !== undefined) {
      counts[postCategoryId] += 1;
      isMatched = true;
    }

    for (const category of validCategories) {
      if (postCategoryId && category.id === postCategoryId) {
        continue;
      }

      if (isCategoryPathMatch(normalizedPostPath, category.normalizedPath)) {
        counts[category.id] += 1;
        isMatched = true;
      }
    }

    if (!isMatched && !postCategoryId) {
      counts[UNCATEGORIZED_CATEGORY_ID] += 1;
    }
  }

  return counts;
}

export function useUserCategoryPostCounts({
  enabled,
  userId,
  categories,
  includePrivatePosts = false,
}: UseUserCategoryPostCountsOptions): UseUserCategoryPostCountsResult {
  const query = useQuery({
    queryKey: queryKeys.posts.userCategoryPostCounts({
      userId,
      includePrivatePosts,
    }),
    enabled: enabled && Boolean(userId),
    queryFn: () => fetchAllUserPosts(userId),
  });

  const countsByCategoryId = useMemo(
    () => {
      const posts = includePrivatePosts
        ? query.data ?? []
        : (query.data ?? []).filter((post) => post.status !== "PRIVATE");
      return buildCategoryCounts({ categories, posts });
    },
    [categories, includePrivatePosts, query.data],
  );

  return {
    countsByCategoryId,
    isLoading: query.isPending,
    error: query.error ? "카테고리 글 개수를 가져오지 못했습니다." : null,
  };
}
