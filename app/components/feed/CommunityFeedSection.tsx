"use client";

import { useEffect, useRef } from "react";
import { Post } from "../../types";
import PostList from "../PostList";
import FeedSkeleton from "../skeleton/FeedSkeleton";

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
  const showInitialSkeleton =
    (isLoading || isLoadingMore) && posts.length === 0;
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
        <FeedSkeleton variant="community" count={5} />
      ) : (
        <>
          <PostList
            posts={posts}
            onReadStatusChange={onReadStatusChange}
            hideEmptyState={isLoading || isLoadingMore}
          />
          <div ref={loadMoreTriggerRef} className="h-2 w-full" />
          {showLoadMoreSkeleton && (
            <FeedSkeleton variant="company" count={2} loadMore />
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
