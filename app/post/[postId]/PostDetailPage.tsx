"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Header from "../../components/Header";
import PostDetail from "../../components/PostDetail";
import ActionSnackbar from "../../components/ui/ActionSnackbar";
import { useActionSnackbar } from "../../hooks/useActionSnackbar";
import { useComments } from "../../hooks/useComments";
import { usePostDetail } from "../../hooks/usePostDetail";
import { useUser } from "../../hooks/useUser";
import { buildLocalizedUserPath } from "../../lib/userRoute";

export default function PostDetailPage() {
  const t = useTranslations("PostDetailPage");
  const userPageT = useTranslations("UserPage");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const routePostId = typeof params.postId === "string" ? params.postId : null;
  const routeSlug = params.slug;
  const slugPostId = Array.isArray(routeSlug) && routeSlug.length > 0
    ? routeSlug[routeSlug.length - 1]
    : null;
  const postId = routePostId ?? slugPostId ?? "";
  const { user } = useUser();
  const [isRedirectingAfterBlock, setIsRedirectingAfterBlock] = useState(false);
  const { snackbar, showSnackbar } = useActionSnackbar();
  const showErrorSnackbar = (message: string) => {
    showSnackbar({ type: "error", message });
  };
  const showSnackbarMessage = (message: string, type: "error" | "success" = "error") => {
    showSnackbar({ type, message });
  };

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
    handleFollowAuthor,
    isFollowingAuthor,
    isFollowingUpdating,
    isReporting,
    isVisibilityUpdating,
    isDeleting,
  } = usePostDetail(postId, showSnackbarMessage);

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
    handleLikeComment,
    handleDislikeComment,
  } = useComments(postId, () => {
    setPost((current) => {
      if (!current) return current;
      return {
        ...current,
        commentCount: (current.commentCount || 0) + 1,
      };
    });
  }, showErrorSnackbar);

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
    if (isRedirectingAfterBlock) {
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

  const authorId = post.author?.id;

  return (
    <>
      <ActionSnackbar
        isOpen={Boolean(snackbar)}
        variant={snackbar?.type ?? "error"}
        message={
          snackbar?.message
            ? snackbar.message
            : snackbar
              ? snackbar.type === "followed"
                ? userPageT("actions.followedWithName", { name: snackbar.name ?? "" })
                : snackbar.type === "unfollowed"
                  ? userPageT("actions.unfollowedWithName", { name: snackbar.name ?? "" })
                  : ""
            : ""
        }
      />

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
          authorId
            ? () => {
                router.push(buildLocalizedUserPath(locale, authorId));
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
        onReport={async () => {
          setIsRedirectingAfterBlock(true);
          const result = await handleReport();
          if (result.ok && post.author?.id) {
            router.replace(`/${locale}/user/${post.author.id}?blocked=1`);
            return;
          }

          if (result.errorMessage) {
            showSnackbar({ type: "error", message: result.errorMessage });
          }

          setIsRedirectingAfterBlock(false);
        }}
        onFollowAuthor={async () => {
          const result = await handleFollowAuthor();
          if (!result) {
            return;
          }

          if (!result.ok) {
            if (result.reason === "unauthorized") {
              return;
            }

            showSnackbar({
              type: "error",
              message: result.message || t("loadFailed"),
            });
            return;
          }

          showSnackbar({ type: result.action, name: result.name });
        }}
        isFollowingAuthor={isFollowingAuthor}
        isFollowingUpdating={isFollowingUpdating}
        onLike={handleLike}
        onDislike={handleDislike}
        onToggleRead={handleToggleRead}
        onShare={handleShare}
        onCreateComment={handleCreateComment}
        onUpdateComment={handleUpdateComment}
        onDeleteComment={handleDeleteComment}
        onBanCommentAuthor={handleBanCommentAuthor}
        onLikeComment={handleLikeComment}
        onDislikeComment={handleDislikeComment}
        onClearCommentFieldError={clearCreateCommentFieldError}
        onLoadMoreComments={handleLoadMoreComments}
        onCommentsSortChange={setCommentsSort}
        updatingCommentId={updatingCommentId}
        deletingCommentId={deletingCommentId}
        banningCommentAuthorId={banningCommentAuthorId}
        isVisibilityUpdating={isVisibilityUpdating}
        isDeleting={isDeleting}
        isReporting={isReporting}
        onShowError={showErrorSnackbar}
      />
    </>
  );
}
