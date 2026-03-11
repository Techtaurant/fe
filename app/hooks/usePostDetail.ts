"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useUser } from "./useUser";
import { redirectToOAuthLogin } from "../lib/authRedirect";
import { FEED_MODES } from "../constants/feed";
import {
  deletePost,
  fetchPostDetailWithMeta,
  updatePost,
  updatePostLike,
} from "../services/posts";
import { FeedMode, Post } from "../types";
import { queryKeys } from "../lib/queryKeys";

type ReactionState = "like" | "dislike" | "none";

export function usePostDetail(postId: string) {
  const t = useTranslations("PostDetailPage");
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
  const storedReactionQuery = useQuery({
    queryKey: ["post-reaction", postId],
    queryFn: async (): Promise<ReactionState | null> => getStoredReaction(postId),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const likeMutation = useMutation({
    mutationFn: (likeStatus: "NONE" | "LIKE" | "DISLIKE") =>
      updatePostLike(postId, likeStatus),
  });
  const visibilityMutation = useMutation({
    mutationFn: (status: "PUBLISHED" | "PRIVATE") => updatePost(postId, { status }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deletePost(postId),
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
      redirectToOAuthLogin();
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
        redirectToOAuthLogin();
        return;
      }
      if (message === "NOT_FOUND") {
        alert(t("notFound"));
        return;
      }
      alert(t("reactionFailed"));
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
      alert(t("linkCopied"));
    } catch {
      alert(t("copyFailed"));
    }
  };

  const redirectToSignIn = () => {
    redirectToOAuthLogin();
  };

  const handleToggleVisibility = async () => {
    if (!user) {
      redirectToSignIn();
      return;
    }

    const currentPost = detailQuery.data?.post;
    if (!currentPost) return;

    const isOwner = Boolean(
      user.id && currentPost.author?.id && user.id === currentPost.author.id,
    );
    if (!isOwner) return;

    const nextStatus = currentPost.status === "PRIVATE" ? "PUBLISHED" : "PRIVATE";

    try {
      await visibilityMutation.mutateAsync(nextStatus);
      setPost((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
            }
          : current,
      );
      alert(
        nextStatus === "PRIVATE"
          ? t("visibilityChangedPrivate")
          : t("visibilityChangedPublic"),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (message === "UNAUTHORIZED") {
        redirectToSignIn();
        return;
      }
      if (message === "NOT_FOUND") {
        alert(t("notFound"));
        return;
      }
      alert(t("visibilityChangeFailed"));
    }
  };

  const handleDelete = async (): Promise<boolean> => {
    if (!user) {
      redirectToSignIn();
      return false;
    }

    const currentPost = detailQuery.data?.post;
    if (!currentPost) return false;

    const isOwner = Boolean(
      user.id && currentPost.author?.id && user.id === currentPost.author.id,
    );
    if (!isOwner) return false;

    try {
      await deleteMutation.mutateAsync();
      alert(t("deleted"));
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (message === "UNAUTHORIZED") {
        redirectToSignIn();
        return false;
      }
      if (message === "NOT_FOUND") {
        alert(t("notFound"));
        return false;
      }
      alert(t("deleteFailed"));
      return false;
    }
  };

  const handleReport = () => {
    alert(t("reportSubmitted"));
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
  const storedReaction = storedReactionQuery.data ?? null;
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
      return t("notFound");
    }
    return t("loadFailed");
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
    handleToggleVisibility,
    handleDelete,
    handleReport,
    isVisibilityUpdating: visibilityMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
