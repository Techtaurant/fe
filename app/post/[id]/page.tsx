"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Header from "../../components/Header";
import PostDetail from "../../components/PostDetail";
import { useComments } from "../../hooks/useComments";
import { usePostDetail } from "../../hooks/usePostDetail";
import { useUser } from "../../hooks/useUser";

/**
 * 게시물 상세 페이지 컴포넌트
 * 커뮤니티 게시물의 전체 내용과 댓글을 표시
 */
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
    isBookmarked,
    reactionState,
    currentMode,
    isLoading,
    errorMessage,
    handleLike,
    handleDislike,
    handleBookmark,
    handleShare,
    handleToggleVisibility,
    handleDelete,
    handleReport,
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
    handleLoadMoreComments,
    handleCreateComment,
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
      isBookmarked={isBookmarked}
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
      onBookmark={handleBookmark}
      onShare={handleShare}
      onCreateComment={handleCreateComment}
      onClearCommentFieldError={clearCreateCommentFieldError}
      onLoadMoreComments={handleLoadMoreComments}
      onCommentsSortChange={setCommentsSort}
      isVisibilityUpdating={isVisibilityUpdating}
      isDeleting={isDeleting}
    />
  );
}
