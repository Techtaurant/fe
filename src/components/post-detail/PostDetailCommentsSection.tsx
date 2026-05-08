'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { scrollToElementBelowHeader } from '../../lib/scrollToElementBelowHeader';
import { ValidationErrors } from '../../services/comments/apiError';
import { CommentSort } from '../../services/comments/types';
import { Comment } from '../../types';
import PostDetailCommentItem from './PostDetailCommentItem';
import PostDetailCommentReplies from './PostDetailCommentReplies';

interface PostDetailCommentsSectionProps {
  comments: Comment[];
  commentsSort: CommentSort;
  isCommentsLoading: boolean;
  commentsHasNext: boolean;
  isCommentsLoadingMore: boolean;
  createCommentFieldErrors: ValidationErrors;
  onCreateComment: (content: string, parentId?: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  onBanCommentAuthor: (targetUserId: string) => Promise<boolean>;
  onLikeComment: (commentId: string) => void;
  onDislikeComment: (commentId: string) => void;
  onClearCommentFieldError: (fieldName: string) => void;
  onLoadMoreComments: () => void;
  onCommentsSortChange: (sort: CommentSort) => void;
  currentUserId?: string | null;
  postAuthorId?: string | null;
  updatingCommentId: string | null;
  deletingCommentId: string | null;
  banningCommentAuthorId: string | null;
  focusRequestKey: number;
  onShowError?: (message: string) => void;
}

export default function PostDetailCommentsSection({
  comments,
  commentsSort,
  isCommentsLoading,
  commentsHasNext,
  isCommentsLoadingMore,
  createCommentFieldErrors,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onBanCommentAuthor,
  onLikeComment,
  onDislikeComment,
  onClearCommentFieldError,
  onLoadMoreComments,
  onCommentsSortChange,
  currentUserId,
  postAuthorId,
  updatingCommentId,
  deletingCommentId,
  banningCommentAuthorId,
  focusRequestKey,
  onShowError,
}: PostDetailCommentsSectionProps) {
  const t = useTranslations('PostDetail');
  const commentInputRef = useRef<HTMLDivElement | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const replyingCommentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [commentValue, setCommentValue] = useState('');
  const [openRepliesByCommentId, setOpenRepliesByCommentId] = useState<Record<string, boolean>>({});
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyingCommentValue, setReplyingCommentValue] = useState('');
  const [isReplyActionsBelow, setIsReplyActionsBelow] = useState(false);
  const [replySubmittingCommentId, setReplySubmittingCommentId] = useState<string | null>(null);
  const collapsedTextareaHeight = '44px';

  const commentFieldErrorMessage =
    createCommentFieldErrors.content ||
    createCommentFieldErrors.postId ||
    Object.values(createCommentFieldErrors)[0] ||
    null;

  const resizeReplyTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setIsReplyActionsBelow(textarea.scrollHeight > 40);
  };

  const beginReplyComment = (comment: Comment) => {
    if (comment.isDeleted || comment.isBanned) return;
    setReplyingCommentId(comment.id);
    setReplyingCommentValue('');
    setIsReplyActionsBelow(false);
    setOpenRepliesByCommentId((current) => ({
      ...current,
      [comment.id]: true,
    }));

    setTimeout(() => {
      const textarea = replyingCommentTextareaRef.current;
      if (!textarea) return;
      resizeReplyTextarea(textarea);
      textarea.focus();
    }, 0);
  };

  const cancelReplyComment = () => {
    setReplyingCommentId(null);
    setReplyingCommentValue('');
    setIsReplyActionsBelow(false);
    setReplySubmittingCommentId(null);
  };

  const handleCreateReply = async (parentCommentId: string) => {
    const trimmed = replyingCommentValue.trim();
    if (!trimmed || replySubmittingCommentId) return;
    setReplySubmittingCommentId(parentCommentId);
    try {
      await onCreateComment(trimmed, parentCommentId);
      setReplyingCommentValue('');
      setIsReplyActionsBelow(false);
      setOpenRepliesByCommentId((current) => ({
        ...current,
        [parentCommentId]: true,
      }));
      setTimeout(() => {
        const textarea = replyingCommentTextareaRef.current;
        if (!textarea) return;
        resizeReplyTextarea(textarea);
        textarea.focus();
      }, 0);
    } finally {
      setReplySubmittingCommentId(null);
    }
  };

  const toggleReplies = (commentId: string) => {
    const isOpen = Boolean(openRepliesByCommentId[commentId]);
    if (isOpen) {
      if (replyingCommentId === commentId) {
        cancelReplyComment();
      }
      setOpenRepliesByCommentId((current) => ({
        ...current,
        [commentId]: false,
      }));
      return;
    }

    const targetComment = comments.find((item) => item.id === commentId);
    if (!targetComment || targetComment.isDeleted || targetComment.isBanned) return;
    beginReplyComment(targetComment);
  };

  const getReplyCount = (comment: Comment) => {
    const normalizedReplyCount = Number(comment.replyCount ?? 0);
    return Number.isFinite(normalizedReplyCount) ? Math.max(0, normalizedReplyCount) : 0;
  };

  const getRepliesLabel = (comment: Comment) => {
    const replyCount = getReplyCount(comment);
    if (replyCount > 0) {
      return t('replies', { count: replyCount });
    }
    return t('repliesZero');
  };

  useEffect(() => {
    if (focusRequestKey <= 0) return;

    if (commentInputRef.current) {
      scrollToElementBelowHeader(commentInputRef.current, 'smooth');
    }

    setIsCommentExpanded(true);
    setTimeout(() => commentTextareaRef.current?.focus(), 150);
  }, [focusRequestKey]);

  return (
    <section>
      <div ref={commentInputRef} className="mb-8">
        <div className="flex-1">
          <div className="relative">
            <textarea
              ref={commentTextareaRef}
              placeholder={isCommentExpanded ? '' : t('commentPlaceholder')}
              value={commentValue}
              onChange={(event) => {
                setCommentValue(event.target.value);
                if (createCommentFieldErrors.content) {
                  onClearCommentFieldError('content');
                }
              }}
              onInput={(event) => {
                const target = event.currentTarget;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              className={`border-border bg-background hover:bg-comment-input-hover focus:bg-comment-input-hover active:bg-comment-input-hover w-full resize-none rounded-xl border px-4 text-base transition-colors duration-200 placeholder:text-base focus:outline-none ${
                commentFieldErrorMessage
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-border focus:border-border'
              } ${
                isCommentExpanded
                  ? 'max-h-60 min-h-[120px] overflow-y-auto pt-3 pb-14 text-left'
                  : 'h-[44px] max-h-[44px] min-h-[44px] overflow-hidden pt-[10px] pb-[10px] text-left leading-[22px]'
              }`}
              rows={1}
              onFocus={() => {
                setIsCommentExpanded(true);
                if (commentTextareaRef.current && !commentValue) {
                  commentTextareaRef.current.style.height = '120px';
                }
              }}
            />
            {isCommentExpanded ? (
              <div className="absolute right-3 bottom-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCommentValue('');
                    setIsCommentExpanded(false);
                    if (commentTextareaRef.current) {
                      commentTextareaRef.current.style.height = collapsedTextareaHeight;
                    }
                  }}
                  className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/85 h-8 rounded-md border px-4 text-sm font-semibold transition-colors duration-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const trimmed = commentValue.trim();
                    if (!trimmed || isCommentSubmitting) return;
                    setIsCommentSubmitting(true);
                    try {
                      await onCreateComment(trimmed);
                      setCommentValue('');
                      setIsCommentExpanded(false);
                      if (commentTextareaRef.current) {
                        commentTextareaRef.current.style.height = collapsedTextareaHeight;
                      }
                    } finally {
                      setIsCommentSubmitting(false);
                    }
                  }}
                  disabled={isCommentSubmitting}
                  className="comment-submit-button h-8 rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('comment')}
                </button>
              </div>
            ) : null}
          </div>
          {commentFieldErrorMessage ? (
            <p className="mt-2 px-2 text-sm font-medium text-red-600">{commentFieldErrorMessage}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          {(
            [
              { label: t('sortLatest'), value: 'LATEST' },
              { label: t('sortLikes'), value: 'LIKE' },
              { label: t('sortReplies'), value: 'REPLY' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onCommentsSortChange(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                commentsSort === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'comment-sort-button'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isCommentsLoading && comments.length === 0 ? (
          <div className="text-muted-foreground py-4 text-sm">{t('loadingComments')}</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => {
            const isReplyThreadOpen = Boolean(openRepliesByCommentId[comment.id]);
            const isReplyingCurrentComment = replyingCommentId === comment.id;

            return (
              <PostDetailCommentItem
                key={comment.id}
                comment={comment}
                onLikeComment={onLikeComment}
                onDislikeComment={onDislikeComment}
                onUpdateComment={onUpdateComment}
                onDeleteComment={onDeleteComment}
                onBanCommentAuthor={onBanCommentAuthor}
                currentUserId={currentUserId}
                postAuthorId={postAuthorId}
                updatingCommentId={updatingCommentId}
                deletingCommentId={deletingCommentId}
                banningCommentAuthorId={banningCommentAuthorId}
                onShowError={onShowError}
                extraActions={
                  !comment.isDeleted && !comment.isBanned ? (
                    <button
                      type="button"
                      onClick={() => toggleReplies(comment.id)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      {isReplyThreadOpen ? t('hideReplies') : getRepliesLabel(comment)}
                    </button>
                  ) : !comment.isBanned ? (
                    <span className="text-muted-foreground text-xs">
                      {getRepliesLabel(comment)}
                    </span>
                  ) : null
                }
              >
                {isReplyingCurrentComment ? (
                  <div className="relative mt-2">
                    <textarea
                      ref={isReplyingCurrentComment ? replyingCommentTextareaRef : null}
                      value={replyingCommentValue}
                      onChange={(event) => setReplyingCommentValue(event.target.value)}
                      className={`border-border bg-background hover:bg-comment-input-hover focus:bg-comment-input-hover active:bg-comment-input-hover focus:border-border min-h-9 w-full resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none ${
                        isReplyActionsBelow ? 'pr-3' : 'pr-24'
                      }`}
                      rows={1}
                      onInput={(event) => {
                        resizeReplyTextarea(event.currentTarget);
                      }}
                      disabled={replySubmittingCommentId === comment.id}
                    />
                    <div
                      className={
                        isReplyActionsBelow
                          ? 'mt-2 flex items-center justify-end gap-2'
                          : 'absolute top-[6px] right-2 flex items-center gap-2'
                      }
                    >
                      <button
                        type="button"
                        onClick={cancelReplyComment}
                        disabled={replySubmittingCommentId === comment.id}
                        className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/85 flex h-6 min-w-[37px] items-center justify-center rounded-md border px-2 text-[11px] leading-none font-semibold whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleCreateReply(comment.id);
                        }}
                        disabled={replySubmittingCommentId === comment.id}
                        className="save-action-button flex h-6 min-w-[37px] items-center justify-center rounded-md px-2 text-[11px] leading-none font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t('comment')}
                      </button>
                    </div>
                  </div>
                ) : null}

                {isReplyThreadOpen ? (
                  <PostDetailCommentReplies
                    parentCommentId={comment.id}
                    parentSort={commentsSort}
                    onLikeComment={onLikeComment}
                    onDislikeComment={onDislikeComment}
                    onUpdateComment={onUpdateComment}
                    onDeleteComment={onDeleteComment}
                    onBanCommentAuthor={onBanCommentAuthor}
                    currentUserId={currentUserId}
                    postAuthorId={postAuthorId}
                    updatingCommentId={updatingCommentId}
                    deletingCommentId={deletingCommentId}
                    banningCommentAuthorId={banningCommentAuthorId}
                    onShowError={onShowError}
                  />
                ) : null}
              </PostDetailCommentItem>
            );
          })
        ) : (
          <p className="text-muted-foreground py-8 text-center">{t('noComments')}</p>
        )}

        {commentsHasNext ? (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onLoadMoreComments}
              disabled={isCommentsLoadingMore}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/85 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCommentsLoadingMore ? t('loadingMore') : t('loadMore')}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
