"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "./useUser";
import {
  createComment,
  deleteComment,
  fetchComments,
  updateComment,
  updateCommentLike,
} from "../services/comments";
import { banUser, isBanApiError } from "../services/users/ban";
import {
  redirectToGoogleLogin,
  resolveCommentLikeError,
  resolveCreateCommentError,
  resolveDeleteCommentError,
  resolveFetchCommentsError,
  resolveUpdateCommentError,
} from "../services/comments/errors";
import {
  mapCommentListItemToComment,
  mapCreatedCommentToComment,
  mapUpdatedCommentToComment,
} from "../services/comments/mappers";
import {
  CommentListResponse,
  CommentSort,
  FetchCommentRepliesResponse,
  FetchCommentsResponse,
} from "../services/comments/types";
import { ValidationErrors } from "../services/comments/apiError";
import { queryKeys } from "../lib/queryKeys";
import { calculateNextLikeCount } from "../utils/reactionCounter";
import { FetchMyBansResponse } from "../services/users/ban/types";
import {
  resolveNextReaction,
  toLikeStatus,
  toReactionState,
} from "../utils/reactionState";

type ReactionState = "like" | "dislike" | "none";

const COMMENTS_PAGE_SIZE = 20;

export function useComments(
  postId: string,
  onCommentCreated?: () => void,
) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [commentsSort, setCommentsSort] = useState<CommentSort>("LATEST");
  const [createCommentFieldErrors, setCreateCommentFieldErrors] =
    useState<ValidationErrors>({});
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [banningCommentAuthorId, setBanningCommentAuthorId] = useState<string | null>(null);

  const commentsQueryKey = queryKeys.comments.list({
    postId,
    sort: commentsSort,
    size: COMMENTS_PAGE_SIZE,
  });

  const commentsQuery = useInfiniteQuery({
    queryKey: commentsQueryKey,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchComments({
        postId,
        size: COMMENTS_PAGE_SIZE,
        sort: commentsSort,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string;
    }) =>
      createComment({
        content,
        postId,
        parentId,
      }),
    onSuccess: (result, variables) => {
      if (!user) return;

      const createdComment = mapCreatedCommentToComment(
        result.data,
        user.profileImageUrl || "",
      );

      if (variables.parentId) {
        void queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey as [string, unknown, unknown?] | unknown[];
            if (!Array.isArray(queryKey)) return false;
            if (queryKey[0] !== "comments") return false;

            if (queryKey[1] === "replies") {
              const params = queryKey[2];
              if (!params || typeof params !== "object") return false;
              return (params as { commentId?: string }).commentId === variables.parentId;
            }

            const params = queryKey[1];
            if (!params || typeof params !== "object") return false;
            return (params as { postId?: string }).postId === postId;
          },
        });

        onCommentCreated?.();
        return;
      }

      queryClient.setQueryData<InfiniteData<FetchCommentsResponse>>(
        commentsQueryKey,
        (current) => {
          if (!current || current.pages.length === 0) return current;
          const [firstPage, ...restPages] = current.pages;
          const nextFirstPage: FetchCommentsResponse = {
            ...firstPage,
            data: {
                ...firstPage.data,
                content: [
                  {
                    id: createdComment.id,
                    content: createdComment.content,
                    postId,
                    authorId: createdComment.author.id,
                    authorName: createdComment.author.name,
                    authorProfileImageUrl: createdComment.author.profileImageUrl || null,
                    depth: 0,
                    isDeleted: createdComment.isDeleted,
                    likeCount: createdComment.likeCount,
                    replyCount: createdComment.replyCount,
                    likeStatus: "NONE",
                    createdAt: createdComment.createdAt,
                    updatedAt: result.data.updatedAt,
                  },
                  ...firstPage.data.content,
                ],
              },
            };
          return {
            ...current,
            pages: [nextFirstPage, ...restPages],
          };
        },
      );

      onCommentCreated?.();
    },
  });

  const updateCommentInAllCommentCaches = useCallback(
    (commentId: string, updater: (item: CommentListResponse) => CommentListResponse) => {
      queryClient.setQueriesData<InfiniteData<FetchCommentsResponse>>(
        { queryKey: queryKeys.comments.all },
        (current) => {
          if (!current) return current;

          let hasUpdated = false;
          const nextPages = current.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              content: page.data.content.map((item) => {
                if (item.id !== commentId) return item;
                hasUpdated = true;
                return updater(item);
              }),
            },
          }));

          if (!hasUpdated) return current;

          return {
            ...current,
            pages: nextPages,
          };
        },
      );
    },
    [queryClient],
  );

  const updateCommentAuthorInAllCommentCaches = useCallback(
    (targetUserId: string, updater: (item: CommentListResponse) => CommentListResponse) => {
      queryClient.setQueriesData<InfiniteData<FetchCommentsResponse>>(
        { queryKey: queryKeys.comments.all },
        (current) => {
          if (!current) return current;

          let hasUpdated = false;
          const nextPages = current.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              content: page.data.content.map((item) => {
                if (item.authorId !== targetUserId) return item;
                hasUpdated = true;
                return updater(item);
              }),
            },
          }));

          if (!hasUpdated) return current;

          return {
            ...current,
            pages: nextPages,
          };
        },
      );
    },
    [queryClient],
  );

  const findCommentInAllCommentCaches = useCallback(
    (commentId: string): CommentListResponse | null => {
      const allCommentQueries = queryClient.getQueriesData<InfiniteData<FetchCommentsResponse>>({
        queryKey: queryKeys.comments.all,
      });

      for (const [, data] of allCommentQueries) {
        const foundItem = data?.pages
          .flatMap((page) => page.data.content)
          .find((item) => item.id === commentId);
        if (foundItem) {
          return foundItem;
        }
      }

      return null;
    },
    [queryClient],
  );

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(commentId, { content }),
    onSuccess: (result) => {
      if (!user) return;

      updateCommentInAllCommentCaches(result.data.id, (item) => {
        const updated = mapUpdatedCommentToComment(result.data, item.authorProfileImageUrl || "");
        return {
          ...item,
          id: updated.id,
          isDeleted: updated.isDeleted,
          content: updated.content,
          updatedAt: result.data.updatedAt,
          createdAt: item.createdAt,
          likeCount: item.likeCount,
          replyCount: item.replyCount,
          parentId: item.parentId,
          depth: item.depth,
          authorId: updated.author.id,
          authorName: updated.author.name,
        };
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (_result, deletedCommentId) => {
      const deletedComment = findCommentInAllCommentCaches(deletedCommentId);

      updateCommentInAllCommentCaches(deletedCommentId, (item) => ({
        ...item,
        content: item.content,
        isDeleted: true,
      }));

      void queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as [string, unknown, unknown?] | unknown[];
          if (!Array.isArray(queryKey)) return false;
          if (queryKey[0] !== "comments") return false;

          if (queryKey[1] === "replies") {
            if (!deletedComment?.parentId) return false;
            const params = queryKey[2];
            if (!params || typeof params !== "object") return false;
            return (params as { commentId?: string }).commentId === deletedComment.parentId;
          }

          const params = queryKey[1];
          if (!params || typeof params !== "object") return false;
          return (params as { postId?: string }).postId === postId;
        },
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: ({ targetUserId }: {
      targetUserId: string;
      targetUserName: string;
      targetUserProfileImageUrl: string | null;
    }) => banUser(targetUserId),
    onMutate: async ({ targetUserId, targetUserName, targetUserProfileImageUrl }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.bans() });
      const previous = queryClient.getQueryData<FetchMyBansResponse>(queryKeys.user.bans());
      const optimisticBan = {
        userId: targetUserId,
        name: targetUserName,
        profileImageUrl: targetUserProfileImageUrl,
        bannedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<FetchMyBansResponse>(queryKeys.user.bans(), (current) => {
        if (!current) {
          return {
            status: 200,
            data: [optimisticBan],
            message: "OK",
          };
        }

        if (current.data.some((item) => item.userId === targetUserId)) {
          return current;
        }

        return {
          ...current,
          data: [optimisticBan, ...current.data],
        };
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (isBanApiError(error) && error.code === "CONFLICT") {
        return;
      }

      if (context?.previous) {
        queryClient.setQueryData(queryKeys.user.bans(), context.previous);
      }
    },
    onSuccess: (result, { targetUserId, targetUserProfileImageUrl }) => {
      if (!result.data) return;
      const serverBan = {
        userId: result.data.userId,
        name: result.data.name,
        bannedAt: result.data.bannedAt,
        profileImageUrl: targetUserProfileImageUrl,
      };

      queryClient.setQueryData<FetchMyBansResponse>(queryKeys.user.bans(), (current) => {
        if (!current) {
          return {
            status: 200,
            data: [serverBan],
            message: "OK",
          };
        }

        const alreadyExists = current.data.some((item) => item.userId === targetUserId);
        if (alreadyExists) {
          return {
            ...current,
            data: current.data.map((item) =>
              item.userId === targetUserId
                ? {
                    ...item,
                    ...serverBan,
                  }
                : item,
            ),
          };
        }

        return {
          ...current,
          data: [serverBan, ...current.data],
        };
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.bans() });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: ({ commentId, likeStatus }: { commentId: string; likeStatus: "NONE" | "LIKE" | "DISLIKE" }) =>
      updateCommentLike(commentId, { likeStatus }),
  });

  useEffect(() => {
    if (commentsQuery.error) {
      const resolved = resolveFetchCommentsError(commentsQuery.error);
      if (resolved.shouldRedirectToLogin) {
        redirectToGoogleLogin();
        return;
      }
      if (resolved.alertMessage) {
        alert(resolved.alertMessage);
      }
    }
  }, [commentsQuery.error]);

  const comments = useMemo(
    () =>
      (commentsQuery.data?.pages ?? [])
        .flatMap((page) => page.data.content)
        .map(mapCommentListItemToComment),
    [commentsQuery.data?.pages],
  );

  const handleLoadMoreComments = useCallback(async () => {
    if (!commentsQuery.hasNextPage || commentsQuery.isFetchingNextPage) return;
    await commentsQuery.fetchNextPage();
  }, [commentsQuery]);

  const handleCommentsSortChange = useCallback((sort: CommentSort) => {
    setCreateCommentFieldErrors({});
    setCommentsSort(sort);
  }, []);

  const handleCreateComment = async (content: string, parentId?: string) => {
    if (!user) {
      redirectToGoogleLogin();
      return;
    }

    setCreateCommentFieldErrors({});

    try {
      await createCommentMutation.mutateAsync({ content, parentId });
    } catch (error) {
      const resolved = resolveCreateCommentError(error);
      if (resolved.shouldRedirectToLogin) {
        redirectToGoogleLogin();
        return;
      }
      if (resolved.fieldErrors) {
        setCreateCommentFieldErrors(resolved.fieldErrors);
      }
      if (resolved.alertMessage) {
        alert(resolved.alertMessage);
      }
    }
  };

  const clearCreateCommentFieldError = (fieldName: string) => {
    setCreateCommentFieldErrors((prev) => {
      if (!(fieldName in prev)) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!user) {
      redirectToGoogleLogin();
      return false;
    }

    setUpdatingCommentId(commentId);
    try {
      await updateCommentMutation.mutateAsync({ commentId, content: content.trim() });
      return true;
    } catch (error) {
      const resolved = resolveUpdateCommentError(error);
      if (resolved.shouldRedirectToLogin) {
        redirectToGoogleLogin();
        return false;
      }
      if (resolved.fieldErrors) {
        const firstError = Object.values(resolved.fieldErrors)[0];
        if (firstError) {
          alert(firstError);
          return false;
        }
      }
      if (resolved.alertMessage) {
        alert(resolved.alertMessage);
      }
      return false;
    } finally {
      setUpdatingCommentId((currentId) => (currentId === commentId ? null : currentId));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      redirectToGoogleLogin();
      return false;
    }

    setDeletingCommentId(commentId);
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      return true;
    } catch (error) {
      const resolved = resolveDeleteCommentError(error);
      if (resolved.shouldRedirectToLogin) {
        redirectToGoogleLogin();
        return false;
      }
      if (resolved.alertMessage) {
        alert(resolved.alertMessage);
      }
      return false;
    } finally {
      setDeletingCommentId((currentId) => (currentId === commentId ? null : currentId));
    }
  };

  const handleBanCommentAuthor = async (targetUserId: string) => {
    if (!user) {
      redirectToGoogleLogin();
      return false;
    }

    setBanningCommentAuthorId(targetUserId);
    try {
      const commentQueries = queryClient.getQueriesData<
        InfiniteData<FetchCommentsResponse | FetchCommentRepliesResponse>
      >({
        queryKey: queryKeys.comments.all,
      });

      let targetUserName = "Unknown user";
      let targetUserProfileImageUrl: string | null = null;

      for (const [, queryData] of commentQueries) {
        if (!queryData?.pages) continue;

        for (const page of queryData.pages) {
          const matchedComment = page.data.content.find(
            (item) => item.authorId === targetUserId,
          );

          if (!matchedComment) continue;

          targetUserName = matchedComment.authorName;
          targetUserProfileImageUrl = matchedComment.authorProfileImageUrl;
          break;
        }

        if (targetUserName !== "Unknown user") {
          break;
        }
      }

      await banUserMutation.mutateAsync({
        targetUserId,
        targetUserName,
        targetUserProfileImageUrl,
      });
      updateCommentAuthorInAllCommentCaches(targetUserId, (item) => ({
        ...item,
        isBanned: true,
        authorProfileImageUrl: null,
      }));
      return true;
    } catch (error: unknown) {
      if (isBanApiError(error)) {
        if (error.code === "UNAUTHORIZED") {
          redirectToGoogleLogin();
          return false;
        }

        if (error.code === "CONFLICT") {
          updateCommentAuthorInAllCommentCaches(targetUserId, (item) => ({
            ...item,
            isBanned: true,
            authorProfileImageUrl: null,
          }));
          return true;
        }

        alert(error.message || "사용자 차단에 실패했습니다.");
        return false;
      }

      alert("사용자 차단에 실패했습니다.");
      return false;
    } finally {
      setBanningCommentAuthorId((currentId) =>
        currentId === targetUserId ? null : currentId,
      );
    }
  };

  const handleCommentReaction = async (commentId: string, target: "like" | "dislike") => {
    if (!user) {
      redirectToGoogleLogin();
      return;
    }

    const currentItem = findCommentInAllCommentCaches(commentId);

    if (!currentItem) {
      return;
    }

    const previousReaction = toReactionState(currentItem.likeStatus);
    const nextReaction: ReactionState = resolveNextReaction(previousReaction, target);
    const previousLikeCount = currentItem.likeCount;
    const nextLikeCount = calculateNextLikeCount({
      currentLikeCount: previousLikeCount,
      currentReaction: previousReaction,
      nextReaction,
    });

    updateCommentInAllCommentCaches(commentId, (item) => ({
      ...item,
      likeCount: nextLikeCount,
      likeStatus: toLikeStatus(nextReaction),
    }));

    try {
      await likeCommentMutation.mutateAsync({
        commentId,
        likeStatus: toLikeStatus(nextReaction),
      });
    } catch (error) {
      updateCommentInAllCommentCaches(commentId, (item) => ({
        ...item,
        likeCount: previousLikeCount,
        likeStatus: toLikeStatus(previousReaction),
      }));

      const resolved = resolveCommentLikeError(error);
      if (resolved.shouldRedirectToLogin) {
        redirectToGoogleLogin();
        return;
      }
      if (resolved.alertMessage) {
        alert(resolved.alertMessage);
      }
    }
  };

  const handleLikeComment = (commentId: string) => {
    void handleCommentReaction(commentId, "like");
  };

  const handleDislikeComment = (commentId: string) => {
    void handleCommentReaction(commentId, "dislike");
  };

  return {
    comments,
    isCommentsLoading: commentsQuery.isPending,
    commentsHasNext: Boolean(commentsQuery.hasNextPage),
    isCommentsLoadingMore: commentsQuery.isFetchingNextPage,
    commentsSort,
    setCommentsSort: handleCommentsSortChange,
    createCommentFieldErrors,
    clearCreateCommentFieldError,
    handleUpdateComment,
    handleDeleteComment,
    updatingCommentId,
    deletingCommentId,
    banningCommentAuthorId,
    handleLoadMoreComments,
    handleCreateComment,
    handleBanCommentAuthor,
    handleLikeComment,
    handleDislikeComment,
  };
}
