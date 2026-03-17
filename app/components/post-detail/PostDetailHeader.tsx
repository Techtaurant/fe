"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Globe, Lock, Pencil, Trash2, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Post } from "@/app/types";
import { formatDisplayTime } from "@/app/utils";
import PostDetailMenuItemButton from "./PostDetailMenuItemButton";

function buildTagRoute(locale: string, tagId: string): string {
  return `/${locale}?mode=user&tagIds=${encodeURIComponent(tagId)}`;
}

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
  const router = useRouter();
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

      <div className="flex items-center gap-3 mb-1">
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
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold leading-none text-gray-700 dark:border-gray-400/40 dark:bg-gray-200/20 dark:text-gray-100">
                {t("privateBadge")}
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto relative flex items-center gap-2" ref={menuRef}>
          {!isOwner && (
            <button className="px-4 py-1.5 rounded-full border border-blue-500 text-blue-500 text-sm font-medium hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
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
            <div className="absolute right-0 top-12 z-20 min-w-[120px] rounded-xl border border-border bg-background p-1 shadow-lg">
              {isOwner ? (
                <>
                  <PostDetailMenuItemButton
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit();
                    }}
                    icon={<Pencil className="h-3.5 w-3.5 text-foreground" />}
                  >
                    {t("menuEdit")}
                  </PostDetailMenuItemButton>

                  <PostDetailMenuItemButton
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRequestDelete();
                    }}
                    icon={<Trash2 className="h-3.5 w-3.5 text-foreground" />}
                  >
                    {t("menuDelete")}
                  </PostDetailMenuItemButton>

                  <PostDetailMenuItemButton
                    onClick={async () => {
                      setIsMenuOpen(false);
                      await onToggleVisibility();
                    }}
                    icon={
                      post.status === "PRIVATE" ? (
                        <Globe className="h-3.5 w-3.5 text-foreground" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-foreground" />
                      )
                    }
                    disabled={isVisibilityUpdating}
                  >
                    {post.status === "PRIVATE"
                      ? t("menuToggleToPublic")
                      : t("menuToggleToPrivate")}
                  </PostDetailMenuItemButton>
                </>
              ) : (
                <PostDetailMenuItemButton
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRequestReport();
                  }}
                  icon={<UserX className="h-3.5 w-3.5 text-foreground" />}
                >
                  {t("menuReport")}
                </PostDetailMenuItemButton>
              )}
            </div>
          )}
        </div>
      </div>

      {post.tags?.length ? (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {post.tags?.map((tag) => (
            <button
              type="button"
              key={tag.id}
              className="px-2.5 py-1 rounded-full bg-muted/85 text-sm font-semibold text-blue-500 hover:bg-muted/30 hover:text-blue-400 cursor-pointer transition-colors duration-200"
              onClick={() => {
                router.push(buildTagRoute(locale, tag.id));
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );
}
