"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import Header from "./Header";
import MarkdownRenderer, { extractTableOfContents } from "./MarkdownRenderer";
import PostDetailActionBar from "./post-detail/PostDetailActionBar";
import PostDetailCommentsSection from "./post-detail/PostDetailCommentsSection";
import PostDetailConfirmDialog, {
  DELETE_CONFIRM_BUTTON_CLASS_NAME,
  CANCEL_CONFIRM_BUTTON_CLASS_NAME,
  PRIVATE_CONFIRM_BUTTON_CLASS_NAME,
  PUBLIC_CONFIRM_BUTTON_CLASS_NAME,
} from "./post-detail/PostDetailConfirmDialog";
import PostDetailHeader from "./post-detail/PostDetailHeader";
import PostDetailTableOfContents from "./post-detail/PostDetailTableOfContents";
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
  onFollowAuthor: () => Promise<void> | void;
  isFollowingAuthor: boolean;
  isFollowingUpdating: boolean;
  onLike: () => void;
  onDislike?: () => void;
  onToggleRead: () => void;
  onShare: () => void;
  onCreateComment: (content: string, parentId?: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  onBanCommentAuthor: (targetUserId: string) => Promise<boolean>;
  onLikeComment: (commentId: string) => void;
  onDislikeComment: (commentId: string) => void;
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
  onShowError?: (message: string) => void;
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
  onFollowAuthor,
  isFollowingAuthor,
  isFollowingUpdating,
  onLike,
  onDislike,
  onToggleRead,
  onShare,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onBanCommentAuthor,
  onLikeComment,
  onDislikeComment,
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
  onShowError,
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
  const nextVisibilityStatus =
    post.status === "PRIVATE" ? "PUBLISHED" : "PRIVATE";
  const isNextStatusPrivate = nextVisibilityStatus === "PRIVATE";
  const tableOfContents = useMemo(
    () => extractTableOfContents(post.content || ""),
    [post.content],
  );
  const hasTableOfContents = tableOfContents.length > 0;

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

      <main className="mx-auto px-4 pt-8 pb-[calc(max(18rem,100vh)+env(safe-area-inset-bottom))] md:px-6 md:pt-12 md:pb-[calc(max(24rem,100vh)+env(safe-area-inset-bottom))]">
        <div
          className={
            hasTableOfContents
              ? "mx-auto max-w-[1048px] xl:grid xl:grid-cols-[minmax(0,728px)_240px] xl:gap-12"
              : "mx-auto max-w-[728px]"
          }
        >
          <div className="min-w-0">
            <PostDetailHeader
              post={post}
              isOwner={isOwner}
              onBack={onBack}
              onEdit={onEdit}
              onAuthorClick={onAuthorClick}
              onToggleVisibility={() => setIsVisibilityConfirmOpen(true)}
              onRequestDelete={() => setIsDeleteConfirmOpen(true)}
              onRequestReport={() => setIsReportConfirmOpen(true)}
              onFollowAuthor={onFollowAuthor}
              isFollowingAuthor={isFollowingAuthor}
              isFollowingUpdating={isFollowingUpdating}
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
              onFocusComment={() =>
                setCommentFocusRequestKey((prev) => prev + 1)
              }
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
              onLikeComment={onLikeComment}
              onDislikeComment={onDislikeComment}
              onClearCommentFieldError={onClearCommentFieldError}
              onLoadMoreComments={onLoadMoreComments}
              onCommentsSortChange={onCommentsSortChange}
              currentUserId={currentUserId}
              postAuthorId={post.author?.id ?? null}
              updatingCommentId={updatingCommentId}
              deletingCommentId={deletingCommentId}
              banningCommentAuthorId={banningCommentAuthorId}
              focusRequestKey={commentFocusRequestKey}
              onShowError={onShowError}
            />
          </div>

          {hasTableOfContents ? (
            <PostDetailTableOfContents headings={tableOfContents} />
          ) : null}
        </div>

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
          confirmLabel={
            isNextStatusPrivate
              ? t("menuToggleToPrivate")
              : t("menuToggleToPublic")
          }
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
