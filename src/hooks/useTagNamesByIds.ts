"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { Tag } from "../types";
import { httpClient } from "../utils/httpClient";
import { TAGS_ENDPOINT, TAGS_PAGE_SIZE } from "../constants/tags";

interface TagListResponse {
  data?: {
    content?: Array<{
      id: string;
      name: string;
    }>;
    nextCursor?: string | null;
    hasNext?: boolean;
  };
}

export function useTagNamesByIds(tagIds: string[]) {
  const queryClient = useQueryClient();
  const normalizedTagIds = useMemo(
    () => Array.from(new Set(tagIds.map((tagId) => tagId.toLowerCase()))),
    [tagIds],
  );

  const query = useQuery({
    queryKey: queryKeys.tags.byIds(normalizedTagIds),
    enabled: normalizedTagIds.length > 0,
    queryFn: async () => {
      const resultMap = new Map<string, string>();
      const unresolvedIds = new Set(normalizedTagIds);
      const cachedPageTags = queryClient.getQueryData<Tag[]>(queryKeys.tags.list("page")) ?? [];
      const cachedAllTags = queryClient.getQueryData<Tag[]>(queryKeys.tags.list("all")) ?? [];
      const cachedTags = [...cachedPageTags, ...cachedAllTags];

      cachedTags.forEach((tag) => {
        const normalizedId = tag.id.toLowerCase();
        if (!unresolvedIds.has(normalizedId)) return;

        resultMap.set(normalizedId, tag.name);
        unresolvedIds.delete(normalizedId);
      });

      if (unresolvedIds.size === 0) {
        return Object.fromEntries(resultMap);
      }

      const visitedCursors = new Set<string>();
      let cursor: string | undefined;

      while (unresolvedIds.size > 0) {
        const searchParams = new URLSearchParams();
        searchParams.set("size", String(TAGS_PAGE_SIZE));
        if (cursor) {
          searchParams.set("cursor", cursor);
        }

        const response = await httpClient(
          `${TAGS_ENDPOINT}?${searchParams.toString()}`,
          { method: "GET" },
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.status}`);
        }

        const body = (await response.json()) as TagListResponse;
        const pageTags = Array.isArray(body.data?.content) ? body.data.content : [];

        pageTags.forEach((tag) => {
          const normalizedId = tag.id.toLowerCase();
          if (!unresolvedIds.has(normalizedId)) return;

          resultMap.set(normalizedId, tag.name);
          unresolvedIds.delete(normalizedId);
        });

        if (unresolvedIds.size === 0) {
          break;
        }

        const hasNext = Boolean(body.data?.hasNext);
        const nextCursor = body.data?.nextCursor ?? undefined;
        if (!hasNext || !nextCursor || visitedCursors.has(nextCursor)) {
          break;
        }

        visitedCursors.add(nextCursor);
        cursor = nextCursor;
      }

      return Object.fromEntries(resultMap);
    },
    staleTime: 30 * 60 * 1000,
  });

  return {
    tagNameMap: query.data ?? {},
    isLoading: query.isPending,
  };
}
