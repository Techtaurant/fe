"use client";

// 현재는 mock data 사용 중
import { useEffect, useState } from "react";
import { DUMMY_COMPANY_POSTS } from "../data/dummyData";
import { Post } from "../types";

interface UseCompanyFeedOptions {
  enabled: boolean;
}

const COMPANY_FEED_LOADING_MS = 350;

export function useCompanyFeed({ enabled }: UseCompanyFeedOptions) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const loadCompanyPosts = async () => {
      setIsLoading(true);
      setPosts([]);

      timer = setTimeout(() => {
        if (!isMounted) return;
        setPosts(DUMMY_COMPANY_POSTS);
        setIsLoading(false);
      }, COMPANY_FEED_LOADING_MS);
    };

    void loadCompanyPosts();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  return {
    posts,
    setPosts,
    isLoading,
  };
}
