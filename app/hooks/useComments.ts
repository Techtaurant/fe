"use client";

import { useEffect, useState } from "react";
import { useUser } from "./useUser";
import { createComment, fetchComments } from "../services/comments";
import {
  handleCreateCommentError,
  handleFetchCommentsError,
  redirectToGoogleLogin,
} from "../services/comments/errors";
import {
  mapCommentListItemToComment,
  mapCreatedCommentToComment,
} from "../services/comments/mappers";
import { Comment } from "../types";
import { CommentSort } from "../services/comments/types";
import { ValidationErrors } from "../services/comments/apiError";

const COMMENTS_PAGE_SIZE = 20;

export function useComments(
  postId: string,
  onCommentCreated?: () => void,
) {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isCommentsLoadingMore, setIsCommentsLoadingMore] = useState(false);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [commentsHasNext, setCommentsHasNext] = useState(false);
  const [commentsSort, setCommentsSort] = useState<CommentSort>("LATEST");
  const [createCommentFieldErrors, setCreateCommentFieldErrors] =
    useState<ValidationErrors>({});

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      setIsCommentsLoading(true);
      try {
        const response = await fetchComments({
          postId,
          size: COMMENTS_PAGE_SIZE,
          sort: commentsSort,
        });

        const mapped = response.data.content.map(mapCommentListItemToComment);

        if (isMounted) {
          setComments(mapped);
          setCommentsCursor(response.data.nextCursor);
          setCommentsHasNext(response.data.hasNext);
        }
      } catch (error) {
        if (!isMounted) return;
        handleFetchCommentsError(error);
      } finally {
        if (isMounted) setIsCommentsLoading(false);
      }
    };

    setComments([]);
    setCommentsCursor(null);
    setCommentsHasNext(false);
    setCreateCommentFieldErrors({});
    void loadComments();
    return () => {
      isMounted = false;
    };
  }, [postId, commentsSort]);

  const handleLoadMoreComments = async () => {
    if (!commentsHasNext || isCommentsLoadingMore) return;
    setIsCommentsLoadingMore(true);
    try {
      const response = await fetchComments({
        postId,
        size: COMMENTS_PAGE_SIZE,
        sort: commentsSort,
        cursor: commentsCursor || undefined,
      });

      const mapped = response.data.content.map(mapCommentListItemToComment);

      setComments((prev) => [...prev, ...mapped]);
      setCommentsCursor(response.data.nextCursor);
      setCommentsHasNext(response.data.hasNext);
    } catch (error) {
      handleFetchCommentsError(error);
    } finally {
      setIsCommentsLoadingMore(false);
    }
  };

  const handleCreateComment = async (content: string) => {
    if (!user) {
      redirectToGoogleLogin();
      return;
    }

    setCreateCommentFieldErrors({});

    try {
      const result = await createComment({
        content,
        postId,
      });

      setComments((prev) => [
        mapCreatedCommentToComment(result.data, user.profileImageUrl || ""),
        ...prev,
      ]);

      onCommentCreated?.();
    } catch (error) {
      const fieldErrors = handleCreateCommentError(error);
      if (fieldErrors) {
        setCreateCommentFieldErrors(fieldErrors);
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
    isCommentsLoading,
    commentsHasNext,
    isCommentsLoadingMore,
    commentsSort,
    setCommentsSort,
    createCommentFieldErrors,
    clearCreateCommentFieldError,
    handleLoadMoreComments,
    handleCreateComment,
  };
}
