"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "./useUser";
import { createComment, deleteComment, fetchComments, updateComment } from "../services/comments";
import {
  redirectToGoogleLogin,
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
import { CommentListResponse, CommentSort, FetchCommentsResponse } from "../services/comments/types";
import { ValidationErrors } from "../services/comments/apiError";
import { queryKeys } from "../lib/queryKeys";

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
    mutationFn: async (content: string) =>
      createComment({
        content,
        postId,
      }),
    onSuccess: (result) => {
      if (!user) return;

      const createdComment = mapCreatedCommentToComment(
        result.data,
        user.profileImageUrl || "",
      );

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

  const updateCommentInCache = useCallback(
    (commentId: string, updater: (item: CommentListResponse) => CommentListResponse) => {
      queryClient.setQueryData<InfiniteData<FetchCommentsResponse>>(
        commentsQueryKey,
        (current) => {
          if (!current) return current;

          const nextPages = current.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              content: page.data.content.map((item) =>
                item.id === commentId ? updater(item) : item,
              ),
            },
          }));

          return {
            ...current,
            pages: nextPages,
          };
        },
      );
    },
    [commentsQueryKey, queryClient],
  );

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(commentId, { content }),
    onSuccess: (result) => {
      if (!user) return;

      updateCommentInCache(result.data.id, (item) => {
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
      updateCommentInCache(deletedCommentId, (item) => ({
        ...item,
        content: item.content,
        isDeleted: true,
      }));
    },
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

  const handleCreateComment = async (content: string) => {
    if (!user) {
      redirectToGoogleLogin();
      return;
    }

    setCreateCommentFieldErrors({});

    try {
      await createCommentMutation.mutateAsync(content);
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
    handleLoadMoreComments,
    handleCreateComment,
  };
}
