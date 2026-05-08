'use client';

import { ArrowLeft, Globe, Lock, Pencil, Trash2, UserX } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useRouter } from '../../i18n/navigation';
import { Post } from '../../types';
import { formatDisplayTime } from '../../utils';
import UnblockActionButton from '../ui/UnblockActionButton';
import PostDetailMenuItemButton from './PostDetailMenuItemButton';

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
  const t = useTranslations('PostDetail');
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

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  const menuButtonClassName =
    'p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200';
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
        className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2 transition-colors duration-200"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">{t('back')}</span>
      </button>

      {categoryLabel ? (
        hasCategoryClick ? (
          <button
            type="button"
            onClick={handleCategoryClick}
            className="bg-muted text-muted-foreground hover:bg-muted/90 hover:text-foreground mb-3 inline-flex max-w-full rounded-full px-3 py-1 text-sm font-medium transition-colors duration-200"
          >
            <span className="truncate">{categoryLabel}</span>
          </button>
        ) : (
          <div className="bg-muted text-muted-foreground mb-3 inline-flex max-w-full rounded-full px-3 py-1 text-sm font-medium">
            <span className="truncate">{categoryLabel}</span>
          </div>
        )
      ) : null}

      <h1 className="text-foreground mb-6 text-2xl leading-tight font-bold md:text-4xl">
        {post.title}
      </h1>

      <div className="mb-1 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={hasAuthorClick ? handleAuthorClick : undefined}
            aria-label={hasAuthorClick ? `Go to ${post.author?.name ?? 'user'} page` : undefined}
            className={`bg-muted relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full transition-all duration-150 ${
              hasAuthorClick
                ? 'hover:bg-muted/25 cursor-pointer hover:brightness-95'
                : 'cursor-default'
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
              <span className="text-muted-foreground text-sm font-bold">
                {post.author?.name.charAt(0) || '?'}
              </span>
            )}
          </button>

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {hasAuthorClick ? (
              <button
                type="button"
                onClick={handleAuthorClick}
                className="text-foreground text-left font-medium underline-offset-4 hover:underline"
                aria-label={`Go to ${post.author?.name ?? 'user'} page`}
              >
                {post.author?.name}
              </button>
            ) : (
              <span className="text-foreground font-medium">{post.author?.name}</span>
            )}

            <span>•</span>
            <span>{formatDisplayTime(post.publishedAt, locale)}</span>

            {post.status === 'PRIVATE' && (
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] leading-none font-semibold text-gray-700 dark:border-gray-400/40 dark:bg-gray-200/20 dark:text-gray-100">
                {t('privateBadge')}
              </span>
            )}
          </div>
        </div>

        <div className="relative ml-auto flex items-center gap-2" ref={menuRef}>
          <button
            type="button"
            aria-label={t('menuOpen')}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={menuButtonClassName}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </button>

          {!isOwner &&
            (isFollowingAuthor ? (
              <button
                type="button"
                onClick={async () => {
                  await onFollowAuthor();
                }}
                disabled={isFollowingUpdating}
                className="h-[34px] rounded-md bg-[#F3F4F5] px-4 text-sm font-medium text-[#303949] transition-colors hover:bg-[#EBECEF] disabled:opacity-60 dark:bg-[#2C2C36] dark:text-[#E6E6E7] dark:hover:bg-[#353540]"
              >
                {t('following')}
              </button>
            ) : (
              <UnblockActionButton
                size="headerFollow"
                onClick={async () => {
                  await onFollowAuthor();
                }}
                disabled={isFollowingUpdating}
              >
                {t('follow')}
              </UnblockActionButton>
            ))}

          {isMenuOpen && (
            <div className="border-border bg-background absolute top-12 right-0 z-20 min-w-[120px] rounded-xl border p-1 shadow-lg">
              {isOwner ? (
                <>
                  <PostDetailMenuItemButton
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit();
                    }}
                    icon={<Pencil className="text-foreground h-3.5 w-3.5" />}
                  >
                    {t('menuEdit')}
                  </PostDetailMenuItemButton>

                  <PostDetailMenuItemButton
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRequestDelete();
                    }}
                    icon={<Trash2 className="text-foreground h-3.5 w-3.5" />}
                  >
                    {t('menuDelete')}
                  </PostDetailMenuItemButton>

                  <PostDetailMenuItemButton
                    onClick={async () => {
                      setIsMenuOpen(false);
                      await onToggleVisibility();
                    }}
                    icon={
                      post.status === 'PRIVATE' ? (
                        <Globe className="text-foreground h-3.5 w-3.5" />
                      ) : (
                        <Lock className="text-foreground h-3.5 w-3.5" />
                      )
                    }
                    disabled={isVisibilityUpdating}
                  >
                    {post.status === 'PRIVATE' ? t('menuToggleToPublic') : t('menuToggleToPrivate')}
                  </PostDetailMenuItemButton>
                </>
              ) : (
                <PostDetailMenuItemButton
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRequestReport();
                  }}
                  icon={<UserX className="text-foreground h-3.5 w-3.5" />}
                >
                  {t('menuReport')}
                </PostDetailMenuItemButton>
              )}
            </div>
          )}
        </div>
      </div>

      {post.tags?.length ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {post.tags?.map((tag) => (
            <button
              type="button"
              key={tag.id}
              className="bg-muted/85 hover:bg-muted/30 cursor-pointer rounded-full px-2.5 py-1 text-sm font-semibold text-blue-500 transition-colors duration-200 hover:text-blue-400"
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
