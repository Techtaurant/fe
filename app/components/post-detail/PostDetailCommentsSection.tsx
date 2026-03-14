"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Comment } from "@/app/types";
import { CommentSort } from "@/app/services/comments/types";
import { ValidationErrors } from "@/app/services/comments/apiError";
import { formatDisplayTime } from "@/app/utils";

interface PostDetailCommentsSectionProps {
  comments: Comment[];
  commentsSort: CommentSort;
  isCommentsLoading: boolean;
  commentsHasNext: boolean;
  isCommentsLoadingMore: boolean;
  createCommentFieldErrors: ValidationErrors;
  onCreateComment: (content: string) => Promise<void>;
  onClearCommentFieldError: (fieldName: string) => void;
  onLoadMoreComments: () => void;
  onCommentsSortChange: (sort: CommentSort) => void;
  focusRequestKey: number;
}

export default function PostDetailCommentsSection({
  comments,
  commentsSort,
  isCommentsLoading,
  commentsHasNext,
  isCommentsLoadingMore,
  createCommentFieldErrors,
  onCreateComment,
  onClearCommentFieldError,
  onLoadMoreComments,
  onCommentsSortChange,
  focusRequestKey,
}: PostDetailCommentsSectionProps) {
  const t = useTranslations("PostDetail");
  const locale = useLocale();
  const commentInputRef = useRef<HTMLDivElement | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const collapsedTextareaHeight = "52px";
  const commentFieldErrorMessage =
    createCommentFieldErrors.content ||
    createCommentFieldErrors.postId ||
    Object.values(createCommentFieldErrors)[0] ||
    null;

  useEffect(() => {
    if (focusRequestKey <= 0) return;

    commentInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setIsCommentExpanded(true);
    setTimeout(() => commentTextareaRef.current?.focus(), 150);
  }, [focusRequestKey]);

  return (
    <section>
      <div ref={commentInputRef} className="flex gap-3 mb-8">
        <div className="flex-1">
          <textarea
            ref={commentTextareaRef}
            placeholder={isCommentExpanded ? "" : t("commentPlaceholder")}
            value={commentValue}
            onChange={(e) => {
              setCommentValue(e.target.value);
              if (createCommentFieldErrors.content) {
                onClearCommentFieldError("content");
              }
            }}
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
            className={`w-full px-5 rounded-3xl border-2 border-border bg-background text-base resize-none focus:outline-none transition-colors duration-200 placeholder:text-lg hover:bg-muted/85 ${
              commentFieldErrorMessage
                ? "border-red-500 focus:border-red-500"
                : "border-border focus:border-ring"
            } ${
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
          {commentFieldErrorMessage && (
            <p className="mt-2 px-2 text-sm font-medium text-red-600">
              {commentFieldErrorMessage}
            </p>
          )}
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
              {t("cancel")}
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
              {t("comment")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          {(
            [
              { label: t("sortLatest"), value: "LATEST" },
              { label: t("sortLikes"), value: "LIKE" },
              { label: t("sortReplies"), value: "REPLY" },
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
          <div className="text-sm text-muted-foreground py-4">{t("loadingComments")}</div>
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
                    {formatDisplayTime(comment.createdAt, locale)}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-2">{comment.content}</p>
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
                    {t("replies", { count: comment.replyCount })}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">{t("noComments")}</p>
        )}
        {commentsHasNext && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onLoadMoreComments}
              disabled={isCommentsLoadingMore}
              className="px-5 py-2.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/85 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCommentsLoadingMore ? t("loadingMore") : t("loadMore")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
