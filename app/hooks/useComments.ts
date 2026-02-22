"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "./useUser";
import { createComment, fetchComments } from "../services/comments";
import {
  redirectToGoogleLogin,
  resolveCreateCommentError,
  resolveFetchCommentsError,
} from "../services/comments/errors";
import {
  mapCommentListItemToComment,
  mapCreatedCommentToComment,
} from "../services/comments/mappers";
import { CommentSort, FetchCommentsResponse } from "../services/comments/types";
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
                  likeCount: createdComment.likeCount,
                  replyCount: createdComment.replyCount,
                  likeStatus: "NONE",
                  createdAt: createdComment.createdAt,
                  updatedAt: createdComment.createdAt,
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

  return {
    comments,
    isCommentsLoading: commentsQuery.isPending,
    commentsHasNext: Boolean(commentsQuery.hasNextPage),
    isCommentsLoadingMore: commentsQuery.isFetchingNextPage,
    commentsSort,
    setCommentsSort: handleCommentsSortChange,
    createCommentFieldErrors,
    clearCreateCommentFieldError,
    handleLoadMoreComments,
    handleCreateComment,
  };
}
