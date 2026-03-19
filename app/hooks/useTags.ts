'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { Tag } from '../types';
import { httpClient } from '../utils/httpClient';
import { parseTagCache, TagCachePayload } from '../schemas/tagCache';
import {
  TAGS_CACHE_KEY,
  TAGS_TTL_MS,
  TAGS_ENDPOINT,
  TAGS_PAGE_SIZE,
} from '../constants/tags';

interface TagListResponse {
  status: number;
  data?: {
    content?: Array<{
      id: string;
      name: string;
    }>;
    nextCursor?: string | null;
    hasNext?: boolean;
  };
  message?: string;
}

interface UseTagsResult {
  tags: Tag[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseTagsOptions {
  fetchAll?: boolean;
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

export function useTags(
  initialTags: Tag[] = [],
  options?: UseTagsOptions,
): UseTagsResult {
  const fetchAll = options?.fetchAll ?? false;
  const queryClient = useQueryClient();
  const queryScope = fetchAll ? 'all' : 'page';
  const queryKey = queryKeys.tags.list(queryScope);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!fetchAll) {
        const searchParams = new URLSearchParams();
        searchParams.set('size', String(TAGS_PAGE_SIZE));
        const response = await httpClient(
          `${TAGS_ENDPOINT}?${searchParams.toString()}`,
          { method: 'GET' },
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.status}`);
        }

        const result: TagListResponse = await response.json();
        const nextTags = mapTags(result);
        writeCache(nextTags);
        return nextTags;
      }

      const aggregatedTags: Tag[] = [];
      const seenTagIds = new Set<string>();
      const visitedCursors = new Set<string>();
      let cursor: string | undefined;

      while (true) {
        const searchParams = new URLSearchParams();
        searchParams.set('size', String(TAGS_PAGE_SIZE));
        if (cursor) {
          searchParams.set('cursor', cursor);
        }

        const response = await httpClient(
          `${TAGS_ENDPOINT}?${searchParams.toString()}`,
          { method: 'GET' },
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.status}`);
        }

        const result: TagListResponse = await response.json();
        const pageTags = mapTags(result);

        pageTags.forEach((tag) => {
          if (seenTagIds.has(tag.id)) {
            return;
          }

          seenTagIds.add(tag.id);
          aggregatedTags.push(tag);
        });

        const hasNext = Boolean(result?.data?.hasNext);
        const nextCursor = result?.data?.nextCursor ?? undefined;
        if (!hasNext || !nextCursor || visitedCursors.has(nextCursor)) {
          break;
        }

        visitedCursors.add(nextCursor);
        cursor = nextCursor;
      }

      const nextTags = aggregatedTags;
      writeCache(nextTags);
      return nextTags;
    },
    staleTime: TAGS_TTL_MS,
    initialData: initialTags.length ? initialTags : undefined,
  });
  const { refetch } = query;

  useEffect(() => {
    const cached = readCache();
    if (!cached || cached.tags.length === 0) return;

    const current = queryClient.getQueryData<Tag[]>(queryKey);
    if (!current || current.length === 0) {
      queryClient.setQueryData(queryKey, cached.tags);
    }

    const isStale = Date.now() - cached.cachedAt > TAGS_TTL_MS;
    if (isStale) {
      void refetch();
    }
  }, [queryClient, queryKey, refetch]);

  return {
    tags: query.data ?? [],
    isLoading: query.isPending,
    error: query.error as Error | null,
    refetch: () => {
      void refetch();
    },
  };
}
