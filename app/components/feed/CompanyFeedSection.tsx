"use client";

import { Post } from "../../types";
import PostList from "../PostList";
import FeedSkeleton from "../skeleton/FeedSkeleton";

interface CompanyFeedSectionProps {
  posts: Post[];
  isLoading: boolean;
  onReadStatusChange: (postId: string, isRead: boolean) => void;
}

export default function CompanyFeedSection({
  posts,
  isLoading,
  onReadStatusChange,
}: CompanyFeedSectionProps) {
  const showInitialSkeleton = isLoading && posts.length === 0;

  if (showInitialSkeleton) {
    return <FeedSkeleton variant="company" count={5} />;
  }

  return (
    <PostList
      posts={posts}
      onReadStatusChange={onReadStatusChange}
      hideEmptyState={isLoading}
    />
  );
}
