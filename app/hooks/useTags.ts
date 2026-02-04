'use client';

import { useEffect, useState } from 'react';
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
  const raw = localStorage.getItem(TAGS_CACHE_KEY);
  if (!raw) return null;
  return parseTagCache(raw);
};

const writeCache = (tags: Tag[]) => {
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
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isLoading, setIsLoading] = useState(initialTags.length === 0);
  const [error, setError] = useState<Error | null>(null);

  const fetchTags = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await httpClient(TAGS_ENDPOINT, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }

      const result: TagListResponse = await response.json();
      const nextTags = mapTags(result);

      setTags(nextTags);
      writeCache(nextTags);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tags'));
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const cached = readCache();

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
