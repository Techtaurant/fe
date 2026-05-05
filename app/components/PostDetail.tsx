"use client";

import { useLocale, useTranslations } from "next-intl";
import { ListTree, X } from "lucide-react";
import { useMemo, useState } from "react";
import Header from "./Header";
import AppModal from "./common/AppModal";
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

const ATTACHMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const POST_DETAIL_CENTER_COLUMN_CLASS_NAME =
  "mx-auto w-full max-w-[728px] min-w-0 xl:col-start-2";
const POST_DETAIL_CENTER_CONTENT_COLUMN_CLASS_NAME = `${POST_DETAIL_CENTER_COLUMN_CLASS_NAME} xl:row-start-2`;

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
  onCategoryClick?: () => void;
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
  onCategoryClick,
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
  const [isTableOfContentsDialogOpen, setIsTableOfContentsDialogOpen] =
    useState(false);
  const [commentFocusRequestKey, setCommentFocusRequestKey] = useState(0);
  const nextVisibilityStatus =
    post.status === "PRIVATE" ? "PUBLISHED" : "PRIVATE";
  const isNextStatusPrivate = nextVisibilityStatus === "PRIVATE";
  const tableOfContents = useMemo(
    () => extractTableOfContents(post.content || ""),
    [post.content],
  );
  const attachmentPresignedUrlMap = useMemo(
    () =>
      new Map(
        (post.attachmentPresignedUrls ?? []).map(({ attachmentId, presignedUrl }) => [
          attachmentId,
          presignedUrl,
        ]),
      ),
    [post.attachmentPresignedUrls],
  );
  const hasTableOfContents = tableOfContents.length > 0;
  const postDetailHeaderColumnClassName = hasTableOfContents
    ? POST_DETAIL_CENTER_COLUMN_CLASS_NAME
    : "min-w-0";
  const postDetailContentColumnClassName = hasTableOfContents
    ? POST_DETAIL_CENTER_CONTENT_COLUMN_CLASS_NAME
    : "min-w-0";

  const resolvePostImageSrc = (src: string): string | null => {
    if (!ATTACHMENT_ID_PATTERN.test(src)) {
      return src;
    }

    return attachmentPresignedUrlMap.get(src) ?? null;
  };

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
        {hasTableOfContents ? (
          <button
            type="button"
            aria-label={t("tocOpen")}
            onClick={() => setIsTableOfContentsDialogOpen(true)}
            className="fixed right-4 top-20 z-[250] inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-lg shadow-black/10 backdrop-blur transition-colors hover:bg-muted md:right-6 xl:hidden"
          >
            <ListTree className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        <div
          className={
            hasTableOfContents
              ? "mx-auto grid w-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,728px)_minmax(0,1fr)]"
              : "mx-auto max-w-[728px]"
          }
        >
          <div className={postDetailHeaderColumnClassName}>
            <PostDetailHeader
              post={post}
              isOwner={isOwner}
              onBack={onBack}
              onEdit={onEdit}
              onCategoryClick={onCategoryClick}
              onAuthorClick={onAuthorClick}
              onToggleVisibility={() => setIsVisibilityConfirmOpen(true)}
              onRequestDelete={() => setIsDeleteConfirmOpen(true)}
              onRequestReport={() => setIsReportConfirmOpen(true)}
              onFollowAuthor={onFollowAuthor}
              isFollowingAuthor={isFollowingAuthor}
              isFollowingUpdating={isFollowingUpdating}
              isVisibilityUpdating={isVisibilityUpdating}
            />
          </div>

          <div className={postDetailContentColumnClassName}>
            <article className="mb-12">
              <MarkdownRenderer
                content={post.content || ""}
                resolveImageSrc={resolvePostImageSrc}
              />
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

        {hasTableOfContents ? (
          <AppModal
            isOpen={isTableOfContentsDialogOpen}
            onClose={() => setIsTableOfContentsDialogOpen(false)}
            panelClassName="w-full max-w-[420px] rounded-2xl border border-border bg-background p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">{t("tocTitle")}</h2>
              <button
                type="button"
                aria-label={t("tocClose")}
                onClick={() => setIsTableOfContentsDialogOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4">
              <PostDetailTableOfContents
                headings={tableOfContents}
                variant="dialog"
                onNavigate={() => setIsTableOfContentsDialogOpen(false)}
              />
            </div>
          </AppModal>
        ) : null}

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
