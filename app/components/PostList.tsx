"use client";

import { Post } from "../types";
import PostCard from "./PostCard";

interface PostListProps {
  posts: Post[];
  onReadStatusChange: (postId: string, isRead: boolean) => void;
  emptyMessage?: string;
  hideEmptyState?: boolean;
}

export default function PostList({
  posts,
  onReadStatusChange,
  emptyMessage = "조건에 맞는 게시물이 없습니다.",
  hideEmptyState = false,
}: PostListProps) {
  if (posts.length === 0) {
    if (hideEmptyState) return null;
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onReadStatusChange={onReadStatusChange}
        />
      ))}
    </div>
  );
}
