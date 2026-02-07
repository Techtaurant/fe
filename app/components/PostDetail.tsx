"use client";

import Image from "next/image";
import Header from "./Header";
import MarkdownRenderer from "./MarkdownRenderer";
import { Comment, FeedMode, Post } from "../types";

interface PostDetailProps {
  post: Post;
  comments: Comment[];
  isLiked: boolean;
  isBookmarked: boolean;
  currentMode: FeedMode;
  onBack: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export default function PostDetail({
  post,
  comments,
  isLiked,
  isBookmarked,
  currentMode,
  onBack,
  onLike,
  onBookmark,
  onShare,
}: PostDetailProps) {
  const formatCount = (count: number): string => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}천`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => {}}
        currentMode={currentMode}
        onModeChange={() => {}}
      />

      <main className="max-w-[728px] mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">돌아가기</span>
        </button>

        {/* 게시물 헤더 */}
        <header className="mb-8">
          {/* 제목 */}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-6">
            {post.title}
          </h1>

          {/* 작성자 정보 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {post.author?.profileImageUrl ? (
                <Image
                  src={post.author.profileImageUrl}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">
                  {post.author?.name.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {post.author?.name}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{post.publishedAt}</span>
                <span>•</span>
                <span>
                  {Math.ceil((post.content?.length || 0) / 500)} min read
                </span>
              </div>
            </div>
            <button className="ml-auto px-4 py-1.5 rounded-full border border-success text-success text-sm font-medium hover:bg-success hover:text-success-foreground transition-colors duration-200">
              팔로우
            </button>
          </div>

          {/* 상호작용 바 */}
          <div className="flex items-center justify-between py-3 border-y border-border">
            <div className="flex items-center gap-4">
              {/* 좋아요 */}
              <button
                onClick={onLike}
                className={`flex items-center gap-1.5 text-sm transition-colors duration-200 ${
                  isLiked
                    ? "text-success"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{formatCount(post.likeCount || 0)}</span>
              </button>

              {/* 댓글 */}
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{formatCount(post.commentCount || 0)}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* 북마크 */}
              <button
                onClick={onBookmark}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  isBookmarked
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isBookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>

              {/* 공유 */}
              <button
                onClick={onShare}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>

              {/* 더보기 */}
              <button className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* 게시물 본문 */}
        <article className="mb-12">
          <MarkdownRenderer content={post.content || ""} />
        </article>

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1.5 rounded-full bg-muted/60 text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors duration-200"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 구분선 */}
        <div className="h-px bg-border mb-8" />

        {/* 댓글 섹션 */}
        <section>
          <h3 className="text-lg font-bold text-foreground mb-6">
            댓글 ({comments.length})
          </h3>

          {/* 댓글 입력 */}
          <div className="flex gap-3 mb-8">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
              <span className="text-sm font-bold text-muted-foreground">?</span>
            </div>
            <div className="flex-1">
              <textarea
                placeholder="댓글을 작성해주세요..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:border-ring transition-colors duration-200"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button className="px-4 py-2 rounded-full bg-success text-success-foreground text-sm font-medium hover:opacity-90 transition-opacity duration-200">
                  댓글 작성
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="flex flex-col gap-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    {comment.author.profileImageUrl ? (
                      <Image
                        src={comment.author.profileImageUrl}
                        alt={comment.author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {comment.author.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-2">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>{comment.likeCount}</span>
                      </button>
                      <button className="text-xs text-muted-foreground hover:text-foreground">
                        답글
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
