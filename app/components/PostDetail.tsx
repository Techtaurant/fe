"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Header from "./Header";
import MarkdownRenderer from "./MarkdownRenderer";
import PostDetailActionBar from "./post-detail/PostDetailActionBar";
import PostDetailCommentsSection from "./post-detail/PostDetailCommentsSection";
import PostDetailConfirmDialog, {
  DELETE_CONFIRM_BUTTON_CLASS_NAME,
  CANCEL_CONFIRM_BUTTON_CLASS_NAME,
  PRIVATE_CONFIRM_BUTTON_CLASS_NAME,
  PUBLIC_CONFIRM_BUTTON_CLASS_NAME,
} from "./post-detail/PostDetailConfirmDialog";
import PostDetailHeader from "./post-detail/PostDetailHeader";
import { Comment, FeedMode, Post } from "../types";
import { CommentSort } from "../services/comments/types";
import { ValidationErrors } from "../services/comments/apiError";

interface PostDetailProps {
  post: Post;
  comments: Comment[];
  isRead: boolean;
  reactionState: "like" | "dislike" | "none";
  currentMode: FeedMode;
  isCommentsLoading: boolean;
  commentsHasNext: boolean;
  isCommentsLoadingMore: boolean;
  commentsSort: CommentSort;
  createCommentFieldErrors: ValidationErrors;
  currentUserId?: string | null;
  onBack: () => void;
  onEdit: () => void;
  onToggleVisibility: () => Promise<void> | void;
  onDelete: () => Promise<boolean | void> | boolean | void;
  onReport: () => Promise<void> | void;
  onLike: () => void;
  onDislike?: () => void;
  onToggleRead: () => void;
  onShare: () => void;
  onCreateComment: (content: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  onBanCommentAuthor: (targetUserId: string) => Promise<boolean>;
  onClearCommentFieldError: (fieldName: string) => void;
  onLoadMoreComments: () => void;
  onCommentsSortChange: (sort: CommentSort) => void;
  updatingCommentId: string | null;
  deletingCommentId: string | null;
  banningCommentAuthorId: string | null;
  onAuthorClick?: () => void;
  isVisibilityUpdating: boolean;
  isDeleting: boolean;
  isReporting: boolean;
}

export default function PostDetail({
  post,
  comments,
  isRead,
  reactionState,
  currentMode,
  isCommentsLoading,
  commentsHasNext,
  isCommentsLoadingMore,
  commentsSort,
  createCommentFieldErrors,
  currentUserId,
  onBack,
  onEdit,
  onToggleVisibility,
  onDelete,
  onReport,
  onLike,
  onDislike,
  onToggleRead,
  onShare,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onBanCommentAuthor,
  onClearCommentFieldError,
  onLoadMoreComments,
  onCommentsSortChange,
  updatingCommentId,
  deletingCommentId,
  banningCommentAuthorId,
  onAuthorClick,
  isVisibilityUpdating,
  isDeleting,
  isReporting,
}: PostDetailProps) {
  const t = useTranslations("PostDetail");
  const locale = useLocale();
  const isOwner = Boolean(
    currentUserId && post.author?.id && currentUserId === post.author.id,
  );
  const canToggleRead = !isOwner;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const [isVisibilityConfirmOpen, setIsVisibilityConfirmOpen] = useState(false);
  const [commentFocusRequestKey, setCommentFocusRequestKey] = useState(0);
  const nextVisibilityStatus = post.status === "PRIVATE" ? "PUBLISHED" : "PRIVATE";
  const isNextStatusPrivate = nextVisibilityStatus === "PRIVATE";

  const formatCount = (count: number): string => {
    if (locale === "ko") {
      if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}천`;
      return count.toString();
    }
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => {}}
        currentMode={currentMode}
        onModeChange={() => {}}
      />

      <main className="max-w-[728px] mx-auto px-4 md:px-6 pt-8 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:py-12">
        <PostDetailHeader
          post={post}
          isOwner={isOwner}
          onBack={onBack}
          onEdit={onEdit}
          onAuthorClick={onAuthorClick}
          onToggleVisibility={() => setIsVisibilityConfirmOpen(true)}
          onRequestDelete={() => setIsDeleteConfirmOpen(true)}
          onRequestReport={() => setIsReportConfirmOpen(true)}
          isVisibilityUpdating={isVisibilityUpdating}
        />

        <article className="mb-12">
          <MarkdownRenderer content={post.content || ""} />
        </article>

        <PostDetailActionBar
          reactionState={reactionState}
          isRead={isRead}
          showReadToggle={canToggleRead}
          likeCount={post.likeCount || 0}
          commentCount={post.commentCount || 0}
          viewCount={post.viewCount || 0}
          formatCount={formatCount}
          onLike={onLike}
          onDislike={onDislike}
          onToggleRead={onToggleRead}
          onShare={onShare}
          onFocusComment={() => setCommentFocusRequestKey((prev) => prev + 1)}
        />

        <PostDetailCommentsSection
          comments={comments}
          commentsSort={commentsSort}
          isCommentsLoading={isCommentsLoading}
          commentsHasNext={commentsHasNext}
          isCommentsLoadingMore={isCommentsLoadingMore}
          createCommentFieldErrors={createCommentFieldErrors}
          onCreateComment={onCreateComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onBanCommentAuthor={onBanCommentAuthor}
          onClearCommentFieldError={onClearCommentFieldError}
          onLoadMoreComments={onLoadMoreComments}
          onCommentsSortChange={onCommentsSortChange}
          currentUserId={currentUserId}
          postAuthorId={post.author?.id ?? null}
          updatingCommentId={updatingCommentId}
          deletingCommentId={deletingCommentId}
          banningCommentAuthorId={banningCommentAuthorId}
          focusRequestKey={commentFocusRequestKey}
        />

        <PostDetailConfirmDialog
          isOpen={isDeleteConfirmOpen}
          title={t("deleteConfirmTitle")}
          description={t("deleteConfirmDescription")}
          cancelLabel={t("close")}
          confirmLabel={t("deleteConfirmAction")}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={async () => {
            const deleted = await onDelete();
            if (deleted !== false) {
              setIsDeleteConfirmOpen(false);
            }
          }}
          isConfirming={isDeleting}
          cancelButtonClassName={CANCEL_CONFIRM_BUTTON_CLASS_NAME}
          confirmButtonClassName={DELETE_CONFIRM_BUTTON_CLASS_NAME}
        />

        <PostDetailConfirmDialog
          isOpen={isVisibilityConfirmOpen}
          title={
            isNextStatusPrivate
              ? t("visibilityConfirmToPrivateTitle")
              : t("visibilityConfirmToPublicTitle")
          }
          description={t("visibilityConfirmDescription")}
          cancelLabel={t("close")}
          confirmLabel={isNextStatusPrivate ? t("menuToggleToPrivate") : t("menuToggleToPublic")}
          onCancel={() => setIsVisibilityConfirmOpen(false)}
          onConfirm={async () => {
            await onToggleVisibility();
            setIsVisibilityConfirmOpen(false);
          }}
          isConfirming={isVisibilityUpdating}
          cancelButtonClassName={CANCEL_CONFIRM_BUTTON_CLASS_NAME}
          confirmButtonClassName={
            isNextStatusPrivate
              ? PRIVATE_CONFIRM_BUTTON_CLASS_NAME
              : PUBLIC_CONFIRM_BUTTON_CLASS_NAME
          }
        />

        <PostDetailConfirmDialog
          isOpen={isReportConfirmOpen}
          title={t("reportConfirmTitle")}
          description={t("reportConfirmDescription")}
          cancelLabel={t("cancel")}
          confirmLabel={t("reportConfirmAction")}
          onCancel={() => setIsReportConfirmOpen(false)}
          onConfirm={async () => {
            await onReport();
            setIsReportConfirmOpen(false);
          }}
          isConfirming={isReporting}
        />
      </main>
    </div>
  );
}
