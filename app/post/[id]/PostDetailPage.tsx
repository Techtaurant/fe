"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Header from "../../components/Header";
import PostDetail from "../../components/PostDetail";
import { useComments } from "../../hooks/useComments";
import { usePostDetail } from "../../hooks/usePostDetail";
import { useUser } from "../../hooks/useUser";

export default function PostDetailPage() {
  const t = useTranslations("PostDetailPage");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { user } = useUser();

  const {
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
    isReporting,
    isVisibilityUpdating,
    isDeleting,
  } = usePostDetail(postId);

  const {
    comments,
    isCommentsLoading,
    commentsHasNext,
    isCommentsLoadingMore,
    commentsSort,
    setCommentsSort,
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
  } = useComments(postId, () => {
    setPost((current) => {
      if (!current) return current;
      return {
        ...current,
        commentCount: (current.commentCount || 0) + 1,
      };
    });
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          onMenuClick={() => {}}
          currentMode={currentMode}
          onModeChange={() => {}}
        />
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          onMenuClick={() => {}}
          currentMode={currentMode}
          onModeChange={() => {}}
        />
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">
            {errorMessage || t("notFound")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PostDetail
      post={post}
      comments={comments}
      isRead={isRead}
      reactionState={reactionState}
      currentMode={currentMode}
      isCommentsLoading={isCommentsLoading}
      commentsHasNext={commentsHasNext}
      isCommentsLoadingMore={isCommentsLoadingMore}
      commentsSort={commentsSort}
      createCommentFieldErrors={createCommentFieldErrors}
      currentUserId={user?.id ?? null}
      onBack={() => router.back()}
      onEdit={() => router.push(`/${locale}/post/write?postId=${post.id}`)}
      onAuthorClick={
        post.author?.id
          ? () => {
              router.push(`/${locale}/user/${post.author?.id}`);
            }
          : undefined
      }
      onToggleVisibility={handleToggleVisibility}
      onDelete={async () => {
        const deleted = await handleDelete();
        if (deleted) {
          router.replace(`/${locale}?mode=user`);
          router.refresh();
        }
        return deleted;
      }}
      onReport={handleReport}
      onLike={handleLike}
      onDislike={handleDislike}
      onToggleRead={handleToggleRead}
      onShare={handleShare}
      onCreateComment={handleCreateComment}
      onUpdateComment={handleUpdateComment}
      onDeleteComment={handleDeleteComment}
      onBanCommentAuthor={handleBanCommentAuthor}
      onClearCommentFieldError={clearCreateCommentFieldError}
      onLoadMoreComments={handleLoadMoreComments}
      onCommentsSortChange={setCommentsSort}
      updatingCommentId={updatingCommentId}
      deletingCommentId={deletingCommentId}
      banningCommentAuthorId={banningCommentAuthorId}
      isVisibilityUpdating={isVisibilityUpdating}
      isDeleting={isDeleting}
      isReporting={isReporting}
    />
  );
}
