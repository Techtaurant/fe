"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Globe, Lock, Pencil, Trash2, UserX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "../../i18n/navigation";
import { Post } from "../../types";
import { formatDisplayTime } from "../../utils";
import PostDetailMenuItemButton from "./PostDetailMenuItemButton";
import UnblockActionButton from "../ui/UnblockActionButton";

function buildTagRoute(tagId: string): string {
  return `/?mode=user&tagIds=${encodeURIComponent(tagId)}`;
}

interface PostDetailHeaderProps {
  post: Post;
  isOwner: boolean;
  onBack: () => void;
  onEdit: () => void;
  onCategoryClick?: () => void;
  onToggleVisibility: () => Promise<void> | void;
  onRequestDelete: () => void;
  onRequestReport: () => void;
  onFollowAuthor: () => Promise<void> | void;
  isFollowingAuthor: boolean;
  isFollowingUpdating: boolean;
  isVisibilityUpdating: boolean;
  onAuthorClick?: () => void;
}

export default function PostDetailHeader({
  post,
  isOwner,
  onBack,
  onEdit,
  onCategoryClick,
  onToggleVisibility,
  onRequestDelete,
  onRequestReport,
  onFollowAuthor,
  isFollowingAuthor,
  isFollowingUpdating,
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
  const categoryLabel = post.categoryPath?.trim();
  const hasAuthorClick = Boolean(onAuthorClick && post.author?.id);
  const hasCategoryClick = Boolean(onCategoryClick && categoryLabel);

  const handleAuthorClick = () => {
    if (!hasAuthorClick || !onAuthorClick) return;

    onAuthorClick();
  };

  const handleCategoryClick = () => {
    if (!hasCategoryClick || !onCategoryClick) return;

    onCategoryClick();
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

      {categoryLabel ? (
        hasCategoryClick ? (
          <button
            type="button"
            onClick={handleCategoryClick}
            className="mb-3 inline-flex max-w-full rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/90 hover:text-foreground"
          >
            <span className="truncate">{categoryLabel}</span>
          </button>
        ) : (
          <div className="mb-3 inline-flex max-w-full rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            <span className="truncate">{categoryLabel}</span>
          </div>
        )
      ) : null}

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

          {!isOwner && (
            isFollowingAuthor ? (
              <button
                type="button"
                onClick={async () => {
                  await onFollowAuthor();
                }}
                disabled={isFollowingUpdating}
                className="h-[34px] rounded-md bg-[#F3F4F5] px-4 text-sm font-medium text-[#303949] transition-colors hover:bg-[#EBECEF] dark:bg-[#2C2C36] dark:text-[#E6E6E7] dark:hover:bg-[#353540] disabled:opacity-60"
              >
                {t("following")}
              </button>
            ) : (
              <UnblockActionButton
                size="headerFollow"
                onClick={async () => {
                  await onFollowAuthor();
                }}
                disabled={isFollowingUpdating}
              >
                {t("follow")}
              </UnblockActionButton>
            )
          )}

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
                router.push(buildTagRoute(tag.id));
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
