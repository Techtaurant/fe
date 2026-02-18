"use client";

import { useParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import PostDetail from "../../components/PostDetail";
import { useComments } from "../../hooks/useComments";
import { usePostDetail } from "../../hooks/usePostDetail";

/**
 * 게시물 상세 페이지 컴포넌트
 * 커뮤니티 게시물의 전체 내용과 댓글을 표시
 */
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const {
    post,
    setPost,
    isLiked,
    isBookmarked,
    reactionState,
    currentMode,
    isLoading,
    errorMessage,
    handleLike,
    handleDislike,
    handleBookmark,
    handleShare,
  } = usePostDetail(postId);

  const {
    comments,
    isCommentsLoading,
    commentsHasNext,
    isCommentsLoadingMore,
    commentsSort,
    setCommentsSort,
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
          <p className="text-lg text-muted-foreground">게시물을 불러오는 중입니다.</p>
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
            {errorMessage || "게시물을 찾을 수 없습니다."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PostDetail
      post={post}
      postId={postId}
      comments={comments}
      isLiked={isLiked}
      isBookmarked={isBookmarked}
      reactionState={reactionState}
      currentMode={currentMode}
      isCommentsLoading={isCommentsLoading}
      commentsHasNext={commentsHasNext}
      isCommentsLoadingMore={isCommentsLoadingMore}
      commentsSort={commentsSort}
      onBack={() => router.back()}
      onLike={handleLike}
      onDislike={handleDislike}
      onBookmark={handleBookmark}
      onShare={handleShare}
      onCreateComment={handleCreateComment}
      onLoadMoreComments={handleLoadMoreComments}
      onCommentsSortChange={setCommentsSort}
    />
  );
}
