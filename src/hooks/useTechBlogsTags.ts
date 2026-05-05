"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TechBlog } from "../types";
import {
  parseTechBlogCache,
  TechBlogCachePayload,
} from "../schemas/techBlogTagCache";
import {
  TECH_BLOGS_CACHE_KEY,
  TECH_BLOGS_TTL_MS,
} from "../constants/techBlogsTags";
import { queryKeys } from "../lib/queryKeys";

interface UseTechBlogsResult {
  techBlogs: TechBlog[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const readCache = (): TechBlogCachePayload | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TECH_BLOGS_CACHE_KEY);
  if (!raw) return null;
  return parseTechBlogCache(raw);
};

const writeCache = (techBlogs: TechBlog[]) => {
  if (typeof window === "undefined") return;
  try {
    const payload: TechBlogCachePayload = {
      techBlogs,
      cachedAt: Date.now(),
    };
    localStorage.setItem(TECH_BLOGS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore cache write errors
  }
};

export function useTechBlogsTags(
  initialTechBlogs: TechBlog[] = [],
): UseTechBlogsResult {
  const queryClient = useQueryClient();
  const initialSignature = useMemo(
    () => initialTechBlogs.map((blog) => blog.id).join(","),
    [initialTechBlogs],
  );
  const queryKey = queryKeys.techBlogs.list(initialSignature);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const nextTechBlogs = initialTechBlogs;
      writeCache(nextTechBlogs);
      return nextTechBlogs;
    },
    staleTime: TECH_BLOGS_TTL_MS,
    initialData: initialTechBlogs.length ? initialTechBlogs : undefined,
  });
  const { refetch } = query;

  useEffect(() => {
    const cached = readCache();
    if (!cached || cached.techBlogs.length === 0) return;

    const current = queryClient.getQueryData<TechBlog[]>(queryKey);
    if (!current || current.length === 0) {
      queryClient.setQueryData(queryKey, cached.techBlogs);
    }

    const isStale = Date.now() - cached.cachedAt > TECH_BLOGS_TTL_MS;
    if (isStale) {
      void refetch();
    }
  }, [queryClient, queryKey, refetch]);

  return {
    techBlogs: query.data ?? [],
    isLoading: query.isPending,
    error: query.error as Error | null,
    refetch: () => {
      void refetch();
    },
  };
}
