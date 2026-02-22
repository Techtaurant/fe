'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { Tag } from '../types';
import { httpClient } from '../utils/httpClient';
import { parseTagCache, TagCachePayload } from '../schemas/tagCache';
import { TAGS_CACHE_KEY, TAGS_TTL_MS, TAGS_ENDPOINT } from '../constants/tags';

interface TagListResponse {
  status: number;
  data?: {
    content?: Array<{
      id: string;
      name: string;
    }>;
  };
  message?: string;
}

interface UseTagsResult {
  tags: Tag[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const readCache = (): TagCachePayload | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TAGS_CACHE_KEY);
  if (!raw) return null;
  return parseTagCache(raw);
};

const writeCache = (tags: Tag[]) => {
  if (typeof window === "undefined") return;
  try {
    const payload: TagCachePayload = {
      tags,
      cachedAt: Date.now(),
    };
    localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore cache write errors
  }
};

const mapTags = (result: TagListResponse): Tag[] => {
  const content = Array.isArray(result?.data?.content) ? result.data.content : [];
  return content.map((tag) => ({
    id: tag.id,
    name: tag.name,
  }));
};

export function useTags(initialTags: Tag[] = []): UseTagsResult {
  const cached = readCache();

  const query = useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: async () => {
      const response = await httpClient(TAGS_ENDPOINT, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }
      const result: TagListResponse = await response.json();
      const nextTags = mapTags(result);
      writeCache(nextTags);
      return nextTags;
    },
    staleTime: TAGS_TTL_MS,
    initialData:
      cached?.tags.length
        ? cached.tags
        : initialTags.length
          ? initialTags
          : undefined,
    initialDataUpdatedAt: cached?.cachedAt,
  });

  return {
    tags: query.data ?? [],
    isLoading: query.isPending,
    error: query.error as Error | null,
    refetch: () => {
      void query.refetch();
    },
  };
}
