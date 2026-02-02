'use client';

import { useEffect, useState } from 'react';
import { Tag } from '../types';
import { httpClient } from '../utils/httpClient';

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

export function useTags(initialTags: Tag[] = []): UseTagsResult {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
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
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tags'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return { tags, isLoading, error, refetch: fetchTags };
}
