"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Header from "./Header";
import MarkdownRenderer from "./MarkdownRenderer";
import PostDetailActionBar from "./post-detail/PostDetailActionBar";
import PostDetailCommentsSection from "./post-detail/PostDetailCommentsSection";
import PostDetailConfirmDialog from "./post-detail/PostDetailConfirmDialog";
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
  onClearCommentFieldError: (fieldName: string) => void;
  onLoadMoreComments: () => void;
  onCommentsSortChange: (sort: CommentSort) => void;
  isVisibilityUpdating: boolean;
  isDeleting: boolean;
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
  onClearCommentFieldError,
  onLoadMoreComments,
  onCommentsSortChange,
  isVisibilityUpdating,
  isDeleting,
}: PostDetailProps) {
  const t = useTranslations("PostDetail");
  const locale = useLocale();
  const isOwner = Boolean(
    currentUserId && post.author?.id && currentUserId === post.author.id,
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const [commentFocusRequestKey, setCommentFocusRequestKey] = useState(0);

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

      <main className="max-w-[728px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <PostDetailHeader
          post={post}
          isOwner={isOwner}
          onBack={onBack}
          onEdit={onEdit}
          onToggleVisibility={onToggleVisibility}
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
          onClearCommentFieldError={onClearCommentFieldError}
          onLoadMoreComments={onLoadMoreComments}
          onCommentsSortChange={onCommentsSortChange}
          focusRequestKey={commentFocusRequestKey}
        />

        <PostDetailConfirmDialog
          isOpen={isDeleteConfirmOpen}
          title={t("deleteConfirmTitle")}
          description={t("deleteConfirmDescription")}
          cancelLabel={t("cancel")}
          confirmLabel={t("deleteConfirmAction")}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={async () => {
            const deleted = await onDelete();
            if (deleted !== false) {
              setIsDeleteConfirmOpen(false);
            }
          }}
          isConfirming={isDeleting}
          confirmButtonClassName="px-4 py-2 rounded-full bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
        />
      </main>
    </div>
  );
}
