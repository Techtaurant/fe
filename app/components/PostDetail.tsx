"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Bookmark,
  MessageCircle,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Eye,
} from "lucide-react";
import Header from "./Header";
import MarkdownRenderer from "./MarkdownRenderer";
import { useUser } from "../hooks/useUser";
import { Comment, FeedMode, Post } from "../types";
import { CommentSort } from "../services/comments/types";

interface PostDetailProps {
  post: Post;
  postId: string;
  comments: Comment[];
  isLiked: boolean;
  isBookmarked: boolean;
  reactionState: "like" | "dislike" | "none";
  currentMode: FeedMode;
  isCommentsLoading: boolean;
  commentsHasNext: boolean;
  isCommentsLoadingMore: boolean;
  commentsSort: CommentSort;
  onBack: () => void;
  onLike: () => void;
  onDislike?: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onCreateComment: (content: string) => Promise<void>;
  onLoadMoreComments: () => void;
  onCommentsSortChange: (sort: CommentSort) => void;
}

export default function PostDetail({
  post,
  postId,
  comments,
  isLiked,
  isBookmarked,
  reactionState,
  currentMode,
  isCommentsLoading,
  commentsHasNext,
  isCommentsLoadingMore,
  commentsSort,
  onBack,
  onLike,
  onDislike,
  onBookmark,
  onShare,
  onCreateComment,
  onLoadMoreComments,
  onCommentsSortChange,
}: PostDetailProps) {
  const { user } = useUser();
  const isOwner = Boolean(user?.id && post.author?.id && user.id === post.author.id);
  const commentInputRef = useRef<HTMLDivElement | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const collapsedTextareaHeight = "52px";
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

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
            <ArrowLeft className="w-5 h-5" />
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
            {isOwner ? (
              <button className="ml-auto p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200">
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
            ) : (
              <button className="ml-auto px-4 py-1.5 rounded-full border border-success text-success text-sm font-medium hover:bg-success hover:text-success-foreground transition-colors duration-200">
                팔로우
              </button>
            )}
          </div>

          {/* 태그 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
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
        </header>

        {/* 게시물 본문 */}
        <article className="mb-12">
          <MarkdownRenderer content={post.content || ""} />
        </article>

        {/* 상호작용 바 */}
        <div className="flex items-center justify-between py-3 border-t border-border mb-3">
          <div className="flex items-center gap-4">
            {/* 좋아요 / 싫어요 */}
            <div className="flex items-center gap-3 rounded-full bg-muted px-3 py-2 text-base font-semibold text-muted-foreground">
              <button
                onClick={onLike}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 cursor-pointer ${
                  reactionState === "like"
                    ? "bg-red-500/15 text-red-600 hover:bg-red-500/20"
                    : "hover:text-foreground hover:bg-muted/80"
                }`}
                aria-label="좋아요"
              >
                <ThumbsUp className="w-5 h-5" />
              </button>
              <span className="px-1">{formatCount(post.likeCount || 0)}</span>
              <button
                onClick={onDislike}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 cursor-pointer ${
                  reactionState === "dislike"
                    ? "bg-blue-500/15 text-blue-600 hover:bg-blue-500/20"
                    : "hover:text-foreground hover:bg-muted/80"
                }`}
                aria-label="싫어요"
              >
                <ThumbsDown className="w-5 h-5" />
              </button>
            </div>

          {/* 댓글 */}
            <button
              onClick={() => {
                commentInputRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                setIsCommentExpanded(true);
                setTimeout(() => commentTextareaRef.current?.focus(), 150);
              }}
              className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
            >
              <MessageCircle className="w-6 h-6" />
              <span>{formatCount(post.commentCount || 0)}</span>
            </button>
            {/* 조회수 */}
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-base font-semibold text-muted-foreground">
              <Eye className="w-6 h-6" />
              <span>{formatCount(post.viewCount || 0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 북마크 */}
            <button
              onClick={onBookmark}
              className={`p-3 rounded-full transition-colors duration-200 cursor-pointer ${
                isBookmarked
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bookmark
                className="w-6 h-6"
                fill={isBookmarked ? "currentColor" : "none"}
              />
            </button>

            {/* 공유 */}
            <button
              onClick={onShare}
              className="p-3 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* 댓글 섹션 */}
        <section>

          {/* 댓글 입력 */}
          <div ref={commentInputRef} className="flex gap-3 mb-8">
            <div className="flex-1">
              <textarea
                ref={commentTextareaRef}
                placeholder={isCommentExpanded ? "" : "의견을 나눠주세요"}
                value={commentValue}
                onChange={(e) => setCommentValue(e.target.value)}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
                className={`w-full px-5 rounded-3xl border-2 border-border bg-background text-base resize-none focus:outline-none focus:border-ring transition-colors duration-200 placeholder:text-lg hover:bg-muted/85 ${
                  isCommentExpanded
                    ? "min-h-[120px] max-h-60 overflow-y-auto text-left py-4"
                    : "h-[52px] overflow-hidden text-left py-4 leading-5"
                }`}
                rows={1}
                onFocus={() => {
                  setIsCommentExpanded(true);
                  if (commentTextareaRef.current && !commentValue) {
                    commentTextareaRef.current.style.height = "120px";
                  }
                }}
              />
              <div className="flex justify-end mt-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCommentValue("");
                    setIsCommentExpanded(false);
                    if (commentTextareaRef.current) {
                      commentTextareaRef.current.style.height = collapsedTextareaHeight;
                    }
                  }}
                  className="px-5 py-2.5 rounded-full border border-border text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/85 transition-colors duration-200"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const trimmed = commentValue.trim();
                    if (!trimmed || isCommentSubmitting) return;
                    setIsCommentSubmitting(true);
                    try {
                      await onCreateComment(trimmed);
                      setCommentValue("");
                      setIsCommentExpanded(false);
                      if (commentTextareaRef.current) {
                        commentTextareaRef.current.style.height = collapsedTextareaHeight;
                      }
                    } finally {
                      setIsCommentSubmitting(false);
                    }
                  }}
                  disabled={isCommentSubmitting}
                  className="px-5 py-2.5 rounded-full bg-slate-700 text-white text-base font-medium hover:bg-slate-800 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  댓글
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              {(
                [
                  { label: "최신순", value: "LATEST" },
                  { label: "좋아요순", value: "LIKE" },
                  { label: "답글순", value: "REPLY" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onCommentsSortChange(option.value)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors duration-200 ${
                    commentsSort === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {isCommentsLoading && comments.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                댓글을 불러오는 중입니다.
              </div>
            ) : comments.length > 0 ? (
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
                        답글 {comment.replyCount}
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
            {commentsHasNext && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={onLoadMoreComments}
                  disabled={isCommentsLoadingMore}
                  className="px-5 py-2.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/85 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCommentsLoadingMore ? "불러오는 중..." : "더보기"}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
