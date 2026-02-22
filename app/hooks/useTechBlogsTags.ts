"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const initialSignature = useMemo(
    () => initialTechBlogs.map((blog) => blog.id).join(","),
    [initialTechBlogs],
  );

  const cached = readCache();

  const query = useQuery({
    queryKey: queryKeys.techBlogs.list(initialSignature),
    queryFn: async () => {
      const nextTechBlogs = initialTechBlogs;
      writeCache(nextTechBlogs);
      return nextTechBlogs;
    },
    staleTime: TECH_BLOGS_TTL_MS,
    initialData:
      cached?.techBlogs.length
        ? cached.techBlogs
        : initialTechBlogs.length
          ? initialTechBlogs
          : undefined,
    initialDataUpdatedAt: cached?.cachedAt,
  });

  return {
    techBlogs: query.data ?? [],
    isLoading: query.isPending,
    error: query.error as Error | null,
    refetch: () => {
      void query.refetch();
    },
  };
}
