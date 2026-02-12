"use client";

import { useCallback, useEffect, useState } from "react";
import { Post } from "../types";
import { fetchCommunityPostList } from "../services/posts";
import { PostListPeriod, PostListSort } from "../services/posts/types";

interface UseCommunityFeedOptions {
  enabled: boolean;
  period: PostListPeriod;
  sort: PostListSort;
  size?: number;
}

export function useCommunityFeed({
  enabled,
  period,
  sort,
  size = 20,
}: UseCommunityFeedOptions) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    setPosts([]);
    setNextCursor(null);
    setHasNext(true);
    setError(null);
    setIsLoading(true);

    const loadInitialPosts = async () => {
      try {
        const result = await fetchCommunityPostList({
          size,
          period,
          sort,
        });

        if (!isMounted) return;
        setPosts(result.posts);
        setNextCursor(result.nextCursor ?? null);
        setHasNext(Boolean(result.nextCursor));
      } catch {
        if (!isMounted) return;
        setPosts([]);
        setError("커뮤니티 게시물을 불러오지 못했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadInitialPosts();
    return () => {
      isMounted = false;
    };
  }, [enabled, period, size, sort]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoading || isLoadingMore || !hasNext) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const result = await fetchCommunityPostList({
        cursor: nextCursor,
        size,
        period,
        sort,
      });
      setPosts((prev) => {
        const merged = [...prev, ...result.posts];
        const deduped = new Map(merged.map((post) => [post.id, post]));
        return Array.from(deduped.values());
      });
      setNextCursor(result.nextCursor ?? null);
      setHasNext(Boolean(result.nextCursor));
      setError(null);
    } catch {
      setError("커뮤니티 게시물을 불러오지 못했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasNext, isLoading, isLoadingMore, nextCursor, period, size, sort]);

  return {
    posts,
    setPosts,
    error,
    hasNext,
    isLoading,
    isLoadingMore,
    loadMore,
  };
}
