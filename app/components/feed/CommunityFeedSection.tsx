"use client";

import { useEffect, useRef } from "react";
import { Post } from "../../types";
import PostList from "./PostList";

interface CommunityFeedSectionProps {
  posts: Post[];
  error: string | null;
  hasNext: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void>;
  onReadStatusChange: (postId: string, isRead: boolean) => void;
}

export default function CommunityFeedSection({
  posts,
  error,
  hasNext,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onReadStatusChange,
}: CommunityFeedSectionProps) {
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const showInitialSkeleton = (isLoading || isLoadingMore) && posts.length === 0;
  const showLoadMoreSkeleton = isLoadingMore && posts.length > 0;

  useEffect(() => {
    const target = loadMoreTriggerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        void onLoadMore();
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [onLoadMore]);

  return (
    <>
      {error && (
        <div className="mb-6 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
          {error}
        </div>
      )}

      {showInitialSkeleton ? (
        <div className="flex flex-col gap-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <article key={idx} className="py-4 md:py-6 border-b border-border animate-pulse">
              <div className="h-4 w-24 rounded skeleton-bg mb-3" />
              <div className="h-6 w-4/5 rounded skeleton-bg mb-3" />
              <div className="h-4 w-2/3 rounded skeleton-bg mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-14 rounded-full skeleton-bg" />
                <div className="h-6 w-16 rounded-full skeleton-bg" />
                <div className="h-6 w-12 rounded-full skeleton-bg" />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <PostList
            posts={posts}
            onReadStatusChange={onReadStatusChange}
            hideEmptyState={isLoading || isLoadingMore}
          />
          <div ref={loadMoreTriggerRef} className="h-2 w-full" />
          {showLoadMoreSkeleton && (
            <div className="flex flex-col gap-6 pt-2">
              {Array.from({ length: 2 }).map((_, idx) => (
                <article key={idx} className="py-4 md:py-6 border-b border-border animate-pulse">
                  <div className="h-4 w-20 rounded skeleton-bg mb-3" />
                  <div className="h-5 w-3/4 rounded skeleton-bg mb-3" />
                  <div className="h-4 w-1/2 rounded skeleton-bg" />
                </article>
              ))}
            </div>
          )}
          {!hasNext && !isLoading && !isLoadingMore && posts.length > 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              마지막 게시물까지 모두 불러왔습니다 🎉
            </div>
          )}
        </>
      )}
    </>
  );
}
