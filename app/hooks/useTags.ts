'use client';

import { useEffect, useState } from 'react';
import { Tag } from '../types';
import { httpClient } from '../utils/httpClient';
import { tagCacheSchema, TagCachePayload } from '../schemas/tagCache';

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

const TAGS_CACHE_KEY = 'tags_cache';
const TAGS_TTL_MS = 30 * 60 * 1000;

export function useTags(initialTags: Tag[] = []): UseTagsResult {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isLoading, setIsLoading] = useState(initialTags.length === 0);
  const [error, setError] = useState<Error | null>(null);

  const fetchTags = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);

      const response = await httpClient('/open-api/tags?size=20', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }

      const result: TagListResponse = await response.json();
      const content = Array.isArray(result?.data?.content) ? result.data.content : [];
      const nextTags = content.map((tag) => ({
        id: tag.id,
        name: tag.name,
      }));

      setTags(nextTags);
      try {
        const payload: TagCachePayload = {
          tags: nextTags,
          cachedAt: Date.now(),
        };
        localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify(payload));
      } catch {
        // ignore cache write errors
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tags'));
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const cached = (() => {
      try {
        const raw = localStorage.getItem(TAGS_CACHE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        const result = tagCacheSchema.safeParse(parsed);
        if (!result.success) return null;
        return result.data;
      } catch {
        return null;
      }
    })();

    if (cached && cached.tags.length > 0) {
      setTags(cached.tags);
      setIsLoading(false);
      const isStale = Date.now() - cached.cachedAt > TAGS_TTL_MS;
      if (isStale) {
        fetchTags({ silent: true });
      }
      return;
    }

    fetchTags();
  }, []);

  return { tags, isLoading, error, refetch: fetchTags };
}
