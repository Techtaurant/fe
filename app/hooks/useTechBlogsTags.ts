"use client";

import { useCallback, useEffect, useState } from "react";
import { TechBlog } from "../types";
import {
  parseTechBlogCache,
  TechBlogCachePayload,
} from "../schemas/techBlogTagCache";
import {
  TECH_BLOGS_CACHE_KEY,
  TECH_BLOGS_TTL_MS,
} from "../constants/techBlogsTags";

interface UseTechBlogsResult {
  techBlogs: TechBlog[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const readCache = (): TechBlogCachePayload | null => {
  const raw = localStorage.getItem(TECH_BLOGS_CACHE_KEY);
  if (!raw) return null;
  return parseTechBlogCache(raw);
};

const writeCache = (techBlogs: TechBlog[]) => {
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
  const [techBlogs, setTechBlogs] = useState<TechBlog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTechBlogs = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const nextTechBlogs = initialTechBlogs;
        setTechBlogs(nextTechBlogs);
        writeCache(nextTechBlogs);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load tech blogs"),
        );
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [initialTechBlogs],
  );

  useEffect(() => {
    const cached = readCache();

    if (cached && cached.techBlogs.length > 0) {
      setTechBlogs(cached.techBlogs);
      setIsLoading(false);
      const isStale = Date.now() - cached.cachedAt > TECH_BLOGS_TTL_MS;
      if (isStale) {
        fetchTechBlogs({ silent: true });
      }
      return;
    }

    void fetchTechBlogs();
  }, [fetchTechBlogs]);

  return { techBlogs, isLoading, error, refetch: fetchTechBlogs };
}
