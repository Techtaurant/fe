"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useUser } from "./useUser";
import { redirectToOAuthLogin } from "../lib/authRedirect";
import { FEED_MODES } from "../constants/feed";
import {
  deletePost,
  fetchPostDetailWithMeta,
  updatePostReadLog,
  updatePost,
  updatePostLike,
} from "../services/posts";
import { banUser, isBanApiError } from "../services/users/ban";
import { FeedMode, Post } from "../types";
import { queryKeys } from "../lib/queryKeys";
import {
  calculateNextLikeCount,
  inferReactionFromServer,
  resolveReactionState,
} from "../utils/reactionCounter";

type PostDetailQueryData = {
  post: Post;
  isLiked: boolean;
};

type ReactionState = "like" | "dislike" | "none";

export function usePostDetail(postId: string) {
  const t = useTranslations("PostDetailPage");
  const queryClient = useQueryClient();
  const { user } = useUser();
  const currentMode: FeedMode = FEED_MODES.USER;
  const userId = user?.id ?? null;
  const [reactionOverride, setReactionOverride] = useState<{
    postId: string;
    value: ReactionState;
  } | null>(null);

  const getStoredReaction = (id: string): ReactionState | null => {
    if (typeof window === "undefined") return null;
    if (!userId) {
      return null;
    }

    const storageKey = `post:${id}:reaction:${userId}`;
    try {
      const value = window.localStorage.getItem(storageKey);
      if (value === "like" || value === "dislike" || value === "none") {
        return value;
      }
      return null;
    } catch {
      return null;
    }
  };

  const setStoredReaction = useCallback((id: string, value: ReactionState) => {
    if (typeof window === "undefined") return;
    if (!userId) {
      return;
    }

    const storageKey = `post:${id}:reaction:${userId}`;
    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      // ignore storage errors
    }
  }, [userId]);

  const setStoredReactionState = useCallback(
    (id: string, value: ReactionState) => {
      setStoredReaction(id, value);
      queryClient.setQueryData<ReactionState>(
        ["post-reaction", id, userId ?? "guest"],
        value,
      );
    },
    [queryClient, setStoredReaction, userId],
  );

  const detailQueryKey = queryKeys.posts.detail(postId);

  const setLikeStatusInCache = (nextReaction: ReactionState, nextLikeCount: number) => {
    queryClient.setQueryData<PostDetailQueryData>(
      detailQueryKey,
      (current) => {
        if (!current) return current;
        return {
          ...current,
          isLiked: nextReaction === "like",
          post: {
            ...current.post,
            likeCount: nextLikeCount,
          },
        };
      },
    );
  };

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => fetchPostDetailWithMeta(postId),
  });
  const storedReactionQuery = useQuery({
    queryKey: ["post-reaction", postId, userId ?? "guest"],
    queryFn: async (): Promise<ReactionState | null> => getStoredReaction(postId),
    initialData: getStoredReaction(postId),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (!detailQuery.data || !userId) {
      return;
    }

    const nextReaction = inferReactionFromServer({
      isLiked: detailQuery.data.isLiked,
    });
    if (nextReaction !== "none") {
      setStoredReactionState(postId, nextReaction);
      return;
    }

    const existingStoredReaction = storedReactionQuery.data;
    if (existingStoredReaction == null) {
      setStoredReactionState(postId, "none");
    }
  }, [
    detailQuery.data,
    postId,
    setStoredReactionState,
    storedReactionQuery.data,
    userId,
  ]);

  const setPost = useCallback(
    (updater: (current: Post | null) => Post | null) => {
      queryClient.setQueryData<{
        post: Post;
        isLiked: boolean;
      } | null>(queryKeys.posts.detail(postId), (current) => {
        if (!current) return current;
        const nextPost = updater(current.post);
        if (!nextPost) return null;
        return {
          ...current,
          post: nextPost,
        };
      });
    },
    [queryClient, postId],
  );

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
  const banMutation = useMutation({
    mutationFn: (targetUserId: string) => banUser(targetUserId),
  });

  const handleReaction = async (target: "like" | "dislike") => {
    if (!user) {
      redirectToOAuthLogin();
      return;
    }

    const nextReaction: ReactionState = reactionState === target ? "none" : target;
    const previousReaction: ReactionState = reactionState;
    const cachedDetail = queryClient.getQueryData<PostDetailQueryData>(detailQueryKey);
    const previousLikeCount = cachedDetail?.post?.likeCount ?? 0;
    const nextLikeCount = calculateNextLikeCount({
      currentLikeCount: previousLikeCount,
      currentReaction: previousReaction,
      nextReaction,
    });
    const likeStatus =
      nextReaction === "none"
        ? "NONE"
        : nextReaction === "like"
          ? "LIKE"
          : "DISLIKE";

    try {
      if (cachedDetail) {
        setLikeStatusInCache(nextReaction, nextLikeCount);
      }

      setReactionOverride({ postId, value: nextReaction });
      setStoredReactionState(postId, nextReaction);

      await likeMutation.mutateAsync(likeStatus);
    } catch (error: unknown) {
      if (cachedDetail) {
        setLikeStatusInCache(previousReaction, previousLikeCount);
      }
      setReactionOverride({ postId, value: previousReaction });
      setStoredReactionState(postId, previousReaction);

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

  const handleToggleRead = async () => {
    if (!user) {
      redirectToOAuthLogin();
      return;
    }

    const currentPost = detailQuery.data?.post;
    if (!currentPost) return;

    const isOwner = Boolean(
      currentPost.author?.id && user.id && currentPost.author.id === user.id,
    );
    if (isOwner) return;

    const nextRead = !currentPost.isRead;
    const previousRead = currentPost.isRead;

    setPost((postToUpdate) => {
      if (!postToUpdate) return postToUpdate;
      return {
        ...postToUpdate,
        isRead: nextRead,
      };
    });

    try {
      await updatePostReadLog(postId, nextRead);
    } catch (error: unknown) {
      setPost((postToUpdate) => {
        if (!postToUpdate) return postToUpdate;
        return {
          ...postToUpdate,
          isRead: previousRead,
        };
      });

      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (message === "UNAUTHORIZED") {
        redirectToOAuthLogin();
        return;
      }
      if (message === "NOT_FOUND") {
        alert(t("notFound"));
        return;
      }
      alert(t("markReadFailed"));
    }
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
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.posts.all, "community"] as const,
      });
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
      queryClient.removeQueries({ queryKey: queryKeys.posts.all });
      queryClient.removeQueries({ queryKey: detailQueryKey });
      alert(t("deleted"));
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (message === "UNAUTHORIZED") {
        redirectToSignIn();
        return false;
      }
      if (message === "FORBIDDEN") {
        alert(t("deleteForbidden"));
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

  const handleReport = async () => {
    if (!user) {
      redirectToSignIn();
      return;
    }

    const currentPost = detailQuery.data?.post;
    const targetUserId = currentPost?.author?.id;
    if (!currentPost || !targetUserId) return;

    if (user.id === targetUserId) return;

    try {
      await banMutation.mutateAsync(targetUserId);
      setPost(() => null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.user.bans() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
      ]);
    } catch (error: unknown) {
      if (isBanApiError(error)) {
        if (error.code === "UNAUTHORIZED") {
          redirectToSignIn();
          return;
        }

        if (error.code === "CONFLICT") {
          setPost(() => null);
          return;
        }

        alert(error.message || t("reportFailed"));
        return;
      }

      alert(t("reportFailed"));
    }
  };

  const serverReaction: ReactionState | null = detailQuery.data
    ? inferReactionFromServer({
        isLiked: detailQuery.data.isLiked,
      })
    : null;
  const storedReaction: ReactionState = storedReactionQuery.data ?? "none";
  const overriddenReaction =
    reactionOverride?.postId === postId ? reactionOverride.value : null;
  const reactionState: ReactionState = resolveReactionState({
    override: overriddenReaction,
    serverReaction,
    storedReaction,
  });
  const isLiked = reactionState === "like";
  const post = detailQuery.data?.post ?? null;
  const isLoading = detailQuery.isPending;
  const isRead = Boolean(user) && Boolean(post?.isRead);
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
    reactionState,
    isRead,
    currentMode,
    isLoading,
    errorMessage,
    handleLike,
    handleDislike,
    handleToggleRead,
    handleShare,
    handleToggleVisibility,
    handleDelete,
    handleReport,
    isReporting: banMutation.isPending,
    isVisibilityUpdating: visibilityMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
