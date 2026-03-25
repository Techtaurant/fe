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
import { isBanApiError } from "../services/users/ban";
import {
  fetchUserFollowings,
  isFollowApiError,
} from "../services/users/follow";
import { useUserBlockActions } from "./useUserBlockActions";
import { type ToggleFollowResult, useFollowActions } from "./useFollowActions";
import { FeedMode, Post } from "../types";
import { queryKeys } from "../lib/queryKeys";
import {
  calculateNextLikeCount,
  inferReactionFromServer,
  resolveReactionState,
} from "../utils/reactionCounter";

type PostDetailQueryData = {
  post: Post;
};

type ReactionState = "like" | "dislike" | "none";
export function usePostDetail(
  postId: string,
  onNotifyMessage?: (message: string, type?: "error" | "success") => void,
) {
  const t = useTranslations("PostDetailPage");
  const queryClient = useQueryClient();
  const { user } = useUser();
  const currentMode: FeedMode = FEED_MODES.USER;
  const userId = user?.id ?? null;
  const { blockUser, isBlocking: isReporting } = useUserBlockActions(userId);
  const { toggleFollow, isPending: isFollowingUpdating } = useFollowActions();
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
          post: {
            ...current.post,
            likeCount: nextLikeCount,
            likeStatus:
              nextReaction === "none"
                ? "NONE"
                : nextReaction === "like"
                  ? "LIKE"
                  : "DISLIKE",
          },
        };
      },
    );
  };

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => fetchPostDetailWithMeta(postId),
  });
  const myFollowingsQuery = useQuery({
    queryKey: queryKeys.user.followings(userId ?? ""),
    queryFn: () => fetchUserFollowings(userId ?? ""),
    enabled: Boolean(userId),
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
      likeStatus: detailQuery.data.post.likeStatus,
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
        onNotifyMessage?.(t("notFound"), "error");
        return;
      }
      onNotifyMessage?.(t("reactionFailed"), "error");
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
        onNotifyMessage?.(t("notFound"), "error");
        return;
      }
      onNotifyMessage?.(t("markReadFailed"), "error");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onNotifyMessage?.(t("linkCopied"), "success");
    } catch {
      onNotifyMessage?.(t("copyFailed"), "error");
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
        onNotifyMessage?.(t("notFound"), "error");
        return;
      }
      onNotifyMessage?.(t("visibilityChangeFailed"), "error");
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
      onNotifyMessage?.(t("deleted"), "success");
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      if (message === "UNAUTHORIZED") {
        redirectToSignIn();
        return false;
      }
      if (message === "FORBIDDEN") {
        onNotifyMessage?.(t("deleteForbidden"), "error");
        return false;
      }
      if (message === "NOT_FOUND") {
        onNotifyMessage?.(t("notFound"), "error");
        return false;
      }
      onNotifyMessage?.(t("deleteFailed"), "error");
      return false;
    }
  };

  const handleReport = async (): Promise<{ ok: boolean; errorMessage?: string }> => {
    if (!user) {
      redirectToSignIn();
      return { ok: false };
    }

    const currentPost = detailQuery.data?.post;
    const targetUserId = currentPost?.author?.id;
    if (!currentPost || !targetUserId) return { ok: false };

    if (user.id === targetUserId) return { ok: false };

    try {
      const result = await blockUser(targetUserId);
      if (result === "blocked" || result === "alreadyBlocked") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      }
      return { ok: true };
    } catch (error: unknown) {
      if (isBanApiError(error)) {
        if (error.code === "UNAUTHORIZED") {
          redirectToSignIn();
          return { ok: false };
        }

        return { ok: false, errorMessage: error.message || t("reportFailed") };
      }

      return { ok: false, errorMessage: t("reportFailed") };
    }
  };

  const handleFollowAuthor = async (): Promise<ToggleFollowResult | null> => {
    if (!user) {
      redirectToSignIn();
      return null;
    }

    const currentPost = detailQuery.data?.post;
    const targetUserId = currentPost?.author?.id;
    if (!currentPost || !targetUserId) return null;

    if (user.id === targetUserId) {
      return null;
    }

    const isAlreadyFollowing = Boolean(
      myFollowingsQuery.data?.data.some((item) => item.userId === targetUserId),
    );

    try {
      const result = await toggleFollow({
        actorUserId: user.id,
        targetUserId,
        isCurrentlyFollowing: isAlreadyFollowing,
        targetUserName: currentPost.author?.name ?? "",
        fallbackName: currentPost.author?.name ?? "",
      });

      if (!result.ok) {
        if (result.reason === "unauthorized") {
          redirectToSignIn();
          return null;
        }

        if (result.reason === "self") {
          return null;
        }

        if (result.reason === "api") {
          return result;
        }

        return { ok: false, reason: "unknown", message: t("loadFailed") };
      }

      return {
        ...result,
      };
    } catch (error: unknown) {
      if (isFollowApiError(error)) {
        if (error.code === "UNAUTHORIZED") {
          redirectToSignIn();
          return { ok: false, reason: "unauthorized", code: error.code };
        }
        return { ok: false, reason: "api", message: error.message, code: error.code };
      }

      return { ok: false, reason: "unknown", message: t("loadFailed") };
    }
  };

  const serverReaction: ReactionState | null = detailQuery.data
    ? inferReactionFromServer({
        likeStatus: detailQuery.data.post.likeStatus,
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
  const post = detailQuery.data?.post ?? null;
  const isFollowingAuthor = Boolean(
    post?.author?.id && myFollowingsQuery.data?.data.some((item) => item.userId === post.author?.id),
  );
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
    handleFollowAuthor,
    isFollowingAuthor,
    isFollowingUpdating,
    isReporting,
    isVisibilityUpdating: visibilityMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
