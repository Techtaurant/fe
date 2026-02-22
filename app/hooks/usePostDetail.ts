"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "./useUser";
import { FEED_MODES } from "../constants/feed";
import { fetchPostDetailWithMeta, updatePostLike } from "../services/posts";
import { FeedMode, Post } from "../types";
import { queryKeys } from "../lib/queryKeys";

type ReactionState = "like" | "dislike" | "none";

export function usePostDetail(postId: string) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const currentMode: FeedMode = FEED_MODES.USER;
  const [reactionOverride, setReactionOverride] = useState<{
    postId: string;
    value: ReactionState;
  } | null>(null);

  const detailQueryKey = queryKeys.posts.detail(postId);

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => fetchPostDetailWithMeta(postId),
  });

  const likeMutation = useMutation({
    mutationFn: (likeStatus: "NONE" | "LIKE" | "DISLIKE") =>
      updatePostLike(postId, likeStatus),
  });

  const getStoredReaction = (id: string) => {
    if (typeof window === "undefined") return null;
    try {
      const value = window.localStorage.getItem(`post:${id}:reaction`);
      if (value === "like" || value === "dislike" || value === "none") {
        return value;
      }
      return null;
    } catch {
      return null;
    }
  };

  const setStoredReaction = (id: string, value: ReactionState) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`post:${id}:reaction`, value);
    } catch {
      // ignore storage errors
    }
  };

  const handleReaction = async (target: "like" | "dislike") => {
    if (!user) {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      window.location.href = `${apiBaseUrl}/oauth2/authorization/google?origin=${encodeURIComponent(window.location.origin)}`;
      return;
    }

    const nextReaction: ReactionState = reactionState === target ? "none" : target;
    const likeStatus =
      nextReaction === "none"
        ? "NONE"
        : nextReaction === "like"
          ? "LIKE"
          : "DISLIKE";

    try {
      await likeMutation.mutateAsync(likeStatus);
      setReactionOverride({ postId, value: nextReaction });
      setStoredReaction(postId, nextReaction);
      await queryClient.invalidateQueries({ queryKey: detailQueryKey });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (message === "UNAUTHORIZED") {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
        window.location.href = `${apiBaseUrl}/oauth2/authorization/google?origin=${encodeURIComponent(window.location.origin)}`;
        return;
      }
      if (message === "NOT_FOUND") {
        alert("게시물을 찾을 수 없습니다.");
        return;
      }
      alert("반응 처리에 실패했습니다.");
    }
  };

  const handleLike = () => {
    void handleReaction("like");
  };

  const handleDislike = () => {
    void handleReaction("dislike");
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
  };

  const setPost = (updater: (current: Post | null) => Post | null) => {
    queryClient.setQueryData<{
      post: Post;
      isLiked: boolean;
    } | null>(detailQueryKey, (current) => {
      if (!current) return current;
      const nextPost = updater(current.post);
      if (!nextPost) return null;
      return {
        ...current,
        post: nextPost,
      };
    });
  };

  const serverReaction: ReactionState = detailQuery.data?.isLiked ? "like" : "none";
  const storedReaction = getStoredReaction(postId);
  const overriddenReaction =
    reactionOverride?.postId === postId ? reactionOverride.value : null;
  const reactionState = overriddenReaction ?? storedReaction ?? serverReaction;
  const isLiked = reactionState === "like";
  const post = detailQuery.data?.post ?? null;
  const isLoading = detailQuery.isPending;
  const errorMessage = (() => {
    if (!detailQuery.error) return null;
    const message =
      detailQuery.error instanceof Error ? detailQuery.error.message : "UNKNOWN";
    if (message === "NOT_FOUND") {
      return "게시물을 찾을 수 없습니다.";
    }
    return "게시물을 불러오지 못했습니다.";
  })();

  return {
    post,
    setPost,
    isLiked,
    isBookmarked,
    reactionState,
    currentMode,
    isLoading,
    errorMessage,
    handleLike,
    handleDislike,
    handleBookmark,
    handleShare,
  };
}
