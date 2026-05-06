import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { UserCategory } from "../services/posts/types";
import { fetchUserCategories } from "../services/posts";

interface UseUserCategoriesOptions {
  enabled: boolean;
  userId: string;
  path?: string;
}

interface UseUserCategoriesResult {
  categories: UserCategory[];
  isLoading: boolean;
  error: string | null;
}

export function normalizeCategoryPath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, "");
}

export function isPlaceholderCategoryPath(path: string): boolean {
  const normalized = normalizeCategoryPath(path).toLowerCase();
  if (!normalized) {
    return true;
  }

  return normalized === "placeholder" || normalized.includes("/placeholder/")
    || normalized.startsWith("placeholder/")
    || normalized.endsWith("/placeholder");
}

export function useUserCategories({
  enabled,
  userId,
  path,
}: UseUserCategoriesOptions): UseUserCategoriesResult {
  const query = useQuery({
    queryKey: queryKeys.posts.userCategories({
      userId,
      path,
    }),
    enabled: Boolean(enabled && userId),
    queryFn: () => fetchUserCategories(userId, path),
  });

  const categories = useMemo<UserCategory[]>(
    () =>
      (query.data ?? []).filter((category) => !isPlaceholderCategoryPath(category.path)),
    [query.data],
  );

  return {
    categories,
    isLoading: query.isPending,
    error: query.error ? "카테고리를 가져오지 못했습니다." : null,
  };
}
