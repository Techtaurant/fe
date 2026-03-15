"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Post } from "@/app/types";
import { formatDisplayTime } from "@/app/utils";

interface PostDetailHeaderProps {
  post: Post;
  isOwner: boolean;
  onBack: () => void;
  onEdit: () => void;
  onToggleVisibility: () => Promise<void> | void;
  onRequestDelete: () => void;
  onRequestReport: () => void;
  isVisibilityUpdating: boolean;
  onAuthorClick?: () => void;
}

export default function PostDetailHeader({
  post,
  isOwner,
  onBack,
  onEdit,
  onToggleVisibility,
  onRequestDelete,
  onRequestReport,
  isVisibilityUpdating,
  onAuthorClick,
}: PostDetailHeaderProps) {
  const t = useTranslations("PostDetail");
  const locale = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isMenuOpen]);

  const menuButtonClassName =
    "p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200";
  const menuItemClassName =
    "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted/80 transition-colors duration-150";
  const hasAuthorClick = Boolean(onAuthorClick && post.author?.id);

  const handleAuthorClick = () => {
    if (!hasAuthorClick || !onAuthorClick) return;

    onAuthorClick();
  };

  return (
    <header className="mb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{t("back")}</span>
      </button>

      <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-6">
        {post.title}
      </h1>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={hasAuthorClick ? handleAuthorClick : undefined}
            aria-label={
              hasAuthorClick ? `Go to ${post.author?.name ?? "user"} page` : undefined
            }
              className={`relative h-6 w-6 rounded-full overflow-hidden bg-muted inline-flex items-center justify-center transition-all duration-150 ${
                hasAuthorClick
                  ? "cursor-pointer hover:bg-muted/25 hover:brightness-95"
                  : "cursor-default"
              }`}
          >
            {post.author?.profileImageUrl ? (
              <Image
                src={post.author.profileImageUrl}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">
                {post.author?.name.charAt(0) || "?"}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasAuthorClick ? (
              <button
                type="button"
                onClick={handleAuthorClick}
                className="font-medium text-foreground text-left hover:underline underline-offset-4"
                aria-label={`Go to ${post.author?.name ?? "user"} page`}
              >
                {post.author?.name}
              </button>
            ) : (
              <span className="font-medium text-foreground">{post.author?.name}</span>
            )}

            <span>•</span>
            <span>{formatDisplayTime(post.publishedAt, locale)}</span>

            {post.status === "PRIVATE" && (
              <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-100/60 px-2 py-0.5 text-[11px] font-semibold leading-none text-amber-900">
                {t("privateBadge")}
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto relative flex items-center gap-2" ref={menuRef}>
          {!isOwner && (
            <button className="px-4 py-1.5 rounded-full border border-success text-success text-sm font-medium hover:bg-success hover:text-success-foreground transition-colors duration-200">
              {t("follow")}
            </button>
          )}

          <button
            type="button"
            aria-label={t("menuOpen")}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={menuButtonClassName}
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
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 z-20 min-w-[180px] rounded-xl border border-border bg-background p-2 shadow-lg">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit();
                    }}
                    className={menuItemClassName}
                  >
                    {t("menuEdit")}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsMenuOpen(false);
                      await onToggleVisibility();
                    }}
                    className={menuItemClassName}
                    disabled={isVisibilityUpdating}
                  >
                    {post.status === "PRIVATE"
                      ? t("menuToggleToPublic")
                      : t("menuToggleToPrivate")}
                  </button>

                  <div className="my-1 h-px bg-border" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRequestDelete();
                    }}
                    className={`${menuItemClassName} text-red-600 hover:bg-red-50`}
                  >
                    {t("menuDelete")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRequestReport();
                  }}
                  className={menuItemClassName}
                >
                  {t("menuReport")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {post.tags?.length ? (
        <div className="flex flex-wrap gap-2 mt-4">
          {post.tags?.map((tag) => (
            <span
              key={tag.id}
              className="px-3 py-1.5 rounded-full bg-muted/60 text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors duration-200"
            >
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}
