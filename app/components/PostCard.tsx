"use client";

import Image from "next/image";
import { type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Post } from "../types";
import { formatDisplayTime } from "@/app/utils";

interface PostCardProps {
  post: Post;
  onReadStatusChange?: (postId: string, isRead: boolean) => void;
  currentUserId?: string;
}

const HTML_ENTITY_PATTERN = /&(amp|lt|gt|quot|apos|nbsp);/g;

function stripReadTimeLabel(value: string): string {
  return value
    .replace(/^\s*(?:약\s*)?\d+\s*분\s*읽기\s*[-–—·•\/|:]?\s*/, "")
    .replace(/^\s*about\s+\d+\s+minutes?\s+read\s*[-–—·•\/|:]?\s*/i, "")
    .replace(/^\s*\d+\s*분\s*read\s*[-–—·•\/|:]?\s*/i, "")
    .trimStart();
}

function decodeHtmlEntities(value: string): string {
  return value.replace(HTML_ENTITY_PATTERN, (match, entity) => {
    if (entity === "amp") return "&";
    if (entity === "lt") return "<";
    if (entity === "gt") return ">";
    if (entity === "quot") return '"';
    if (entity === "apos") return "'";
    return match;
  });
}

function sanitizePostPreview(rawContent: string): string {
  const removeFrontMatter = rawContent.replace(/^---[\s\S]*?---\n?/m, "");
  const removeCodeBlocks = removeFrontMatter.replace(/```[\s\S]*?```/g, "");
  const removeComments = removeCodeBlocks.replace(/<!--([\s\S]*?)-->/g, "");
  const removeHtmlTags = removeComments.replace(/<[^>]*>/g, "");

  const removeHeadings = removeHtmlTags.replace(/^\s*#{1,6}\s+/gm, "");
  const removeTaskList = removeHeadings.replace(/^\s*[-*+]\s+\[[\sxX]\]\s+/gm, "");
  const removeListPrefix = removeTaskList
    .replace(/^\s*[-*+\u2212]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "");
  const removeBlockquote = removeListPrefix.replace(/^\s*>\s?/gm, "");
  const removeImages = removeBlockquote.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  const removeAutoLinks = removeImages.replace(/<([^>\s]+)>/g, "$1");
  const removeLinks = removeAutoLinks.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  const removeReferenceLinks = removeLinks.replace(/^\[[^\]]+\]:\s*.+$/gm, "");

  const removeCode = removeReferenceLinks.replace(/`{1,2}([^`\n]+)`{1,2}/g, "$1");
  const removeEmphasis = removeCode
    .replace(/~~([\s\S]*?)~~/g, "$1")
    .replace(/\*\*([\s\S]*?)\*\*/g, "$1")
    .replace(/__([\s\S]*?)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1");

  const removeEscapedChars = removeEmphasis.replace(/\\([`*_{}\[\]()#+.!-])/g, "$1");
  const removeTableChars = removeEscapedChars.replace(/\|/g, " ");
  const removeHr = removeTableChars
    .replace(/^\s*-{3,}\s*$/gm, "")
    .replace(/^\s*\*{3,}\s*$/gm, "")
    .replace(/^\s*_{3,}\s*$/gm, "");

  const collapsedWhitespace = stripReadTimeLabel(
    decodeHtmlEntities(removeHr)
      .replace(/\r\n?/g, "\n")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim(),
  );

  return collapsedWhitespace;
}

export default function PostCard({
  post,
  onReadStatusChange,
  currentUserId,
}: PostCardProps) {
  const router = useRouter();
  const t = useTranslations("PostCard");
  const locale = useLocale();

  const hasAuthorPage = post.type === "community" && Boolean(post.author?.id);

  const handleAuthorClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!hasAuthorPage || !post.author?.id) return;

    event.stopPropagation();
    void router.push(`/${locale}/user/${post.author.id}`);
  };

  const handleCardClick = () => {
    // 커뮤니티 게시물은 상세 페이지에서 수동으로 읽음 처리
    if (onReadStatusChange && post.type === "company" && !post.isRead) {
      onReadStatusChange(post.id, true);
    }

    // 커뮤니티 글은 상세 페이지로, 기업 글은 외부 링크로 이동
    if (post.type === "community") {
      router.push(`/${locale}/post/${post.id}`);
    } else {
      window.open(post.url, "_blank");
    }
  };

  const formatCount = (count: number): string => {
    if (locale === "ko") {
      if (count >= 10000) {
        return `${(count / 10000).toFixed(1)}만`;
      }
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}천`;
      }
      return count.toString();
    }
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return String(count);
  };

  // 작성자 정보 (기업 또는 사용자)
  const authorName =
    post.type === "company" ? post.techBlog?.name : post.author?.name;
  const authorImage =
    post.type === "company"
      ? post.techBlog?.iconUrl
      : post.author?.profileImageUrl;
  const previewContent = post.content ? sanitizePostPreview(post.content) : "";

  const isOwnCommunityPost =
    post.type === "community" &&
    Boolean(currentUserId) &&
    Boolean(post.author?.id) &&
    post.author?.id === currentUserId;

  return (
    <article
      onClick={handleCardClick}
      className="group cursor-pointer py-4 md:py-6 border-b border-border"
    >
      <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-6">
        {/* Content */}
        <div className="flex-1">
          {/* Header Info: Author/Blog + Date */}
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            {hasAuthorPage ? (
              <button
                type="button"
                onClick={handleAuthorClick}
                className="rounded-full cursor-pointer transition-all duration-150 hover:bg-muted/25 hover:brightness-95"
                aria-label={`Go to ${authorName || "author"} page`}
              >
                <div className="relative w-5 h-5 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {authorImage ? (
                    <Image
                      src={authorImage}
                      alt={authorName || "Profile"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {(authorName || "?").charAt(0)}
                    </span>
                  )}
                </div>
              </button>
            ) : (
              <div className="relative w-5 h-5 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {authorImage ? (
                  <Image
                    src={authorImage}
                    alt={authorName || "Profile"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {(authorName || "?").charAt(0)}
                  </span>
                )}
              </div>
            )}

            {hasAuthorPage ? (
              <button
                type="button"
                onClick={handleAuthorClick}
                className="text-sm font-medium text-foreground hover:underline underline-offset-4"
                aria-label={`Go to ${authorName || "author"} page`}
              >
                {authorName}
              </button>
            ) : (
              <span className="text-sm font-medium text-foreground">
                {authorName}
              </span>
            )}
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDisplayTime(post.publishedAt, locale)}
            </span>
            {post.type === "community" && post.status === "PRIVATE" && (
              <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-100/60 px-2 py-0.5 text-[11px] font-semibold leading-none text-amber-900">
                {t("private")}
              </span>
            )}

            {post.isRead && !isOwnCommunityPost && (
              <span
                className="ml-auto md:ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-muted text-xs font-medium text-muted-foreground"
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("read")}
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3 line-clamp-2 font-kr-serif group-hover:text-foreground"
          >
            {post.title}
          </h2>

          {previewContent ? (
            <p className="text-sm md:text-base text-muted-foreground mb-3 leading-relaxed whitespace-normal line-clamp-2 md:line-clamp-3">
              {previewContent}
            </p>
          ) : null}

          {/* Metadata & Tags */}
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-sm bg-muted/60 text-[11px] md:text-xs text-muted-foreground hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 태그 클릭 시 해당 태그로 필터링
                    }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Metrics (Community Mode often shows likes/comments) */}
            <div className="flex items-center gap-3 ml-auto md:ml-0">
              {/* View Count */}
              <div
                className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground"
                title={t("views")}
              >
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>{formatCount(post.viewCount)}</span>
              </div>

              {/* Likes (Optional) */}
              {post.likeCount !== undefined && (
                <div
                  className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground"
                  title={t("likes")}
                >
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
                  <span>{formatCount(post.likeCount)}</span>
                </div>
              )}

              {/* Comments (Optional) */}
              {post.commentCount !== undefined && (
                <div
                  className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground"
                  title={t("comments")}
                >
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>{formatCount(post.commentCount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {post.thumbnailUrl && (
          <div className="relative w-full md:w-[200px] h-[160px] md:h-[134px] flex-shrink-0 rounded-md overflow-hidden">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    </article>
  );
}
