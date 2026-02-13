"use client";

import { useEffect, useState } from "react";
import { useUser } from "./useUser";
import { FEED_MODES } from "../constants/feed";
import { fetchPostDetailWithMeta, updatePostLike } from "../services/posts";
import { FeedMode, Post } from "../types";

type ReactionState = "like" | "dislike" | "none";

export function usePostDetail(postId: string) {
  const { user } = useUser();
  const [post, setPost] = useState<Post | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentMode] = useState<FeedMode>(FEED_MODES.USER);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reactionState, setReactionState] = useState<ReactionState>("none");

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

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchPostDetailWithMeta(postId);

        if (isMounted) {
          setPost(result.post);
          const stored = getStoredReaction(postId);
          const nextReaction = stored ?? (result.isLiked ? "like" : "none");
          setIsLiked(nextReaction === "like");
          setReactionState(nextReaction);
        }
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "UNKNOWN";
        if (message === "NOT_FOUND") {
          setErrorMessage("게시물을 찾을 수 없습니다.");
        } else {
          setErrorMessage("게시물을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleReaction = async (target: "like" | "dislike") => {
    if (!user) {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
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
      await updatePostLike(postId, likeStatus);
      setIsLiked(nextReaction === "like");
      setReactionState(nextReaction);
      setStoredReaction(postId, nextReaction);
      try {
        const refreshed = await fetchPostDetailWithMeta(postId);
        setPost(refreshed.post);
      } catch {
        // keep current UI if refresh fails
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (message === "UNAUTHORIZED") {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
        window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
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
