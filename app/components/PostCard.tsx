'use client';

import Image from 'next/image';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onReadStatusChange?: (postId: string, isRead: boolean) => void;
}

export default function PostCard({ post, onReadStatusChange }: PostCardProps) {
  const handleCardClick = () => {
    // 게시물을 읽음으로 표시
    if (onReadStatusChange && !post.isRead) {
      onReadStatusChange(post.id, true);
    }
    // 새 탭에서 게시물 열기
    window.open(post.url, '_blank');
  };

  const formatViewCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}만`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}천`;
    }
    return count.toString();
  };

  return (
    <article
      onClick={handleCardClick}
      className="group cursor-pointer py-4 md:py-6 border-b border-[var(--color-border-default)]
               transition-[background-color] duration-[var(--transition-base)]
               hover:bg-[var(--color-bg-card-hover)]"
    >
      <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-6">
        {/* Content */}
        <div className="flex-1">
          {/* Tech Blog Info */}
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="relative w-6 h-6 rounded-full overflow-hidden">
              <Image
                src={post.techBlog.iconUrl}
                alt={post.techBlog.name}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm font-medium text-[var(--color-gray-700)]">
              {post.techBlog.name}
            </span>
            {post.isRead && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)]
                           bg-[var(--color-gray-200)] text-xs font-medium text-[var(--color-gray-600)]">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                읽음
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg md:text-xl font-bold text-black mb-2 md:mb-3 line-clamp-2
                       font-[family-name:var(--font-family-serif)]
                       group-hover:text-[var(--color-gray-800)]">
            {post.title}
          </h2>

          {/* Metadata & Tags */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* View Count */}
            <div className="flex items-center gap-1 text-xs md:text-sm text-[var(--color-gray-600)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span>{formatViewCount(post.viewCount)}</span>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-[var(--radius-sm)] bg-[var(--color-gray-100)]
                           text-[11px] md:text-xs text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]"
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
          </div>
        </div>

        {/* Thumbnail */}
        {post.thumbnailUrl && (
          <div className="relative w-full md:w-[200px] h-[160px] md:h-[134px] flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden">
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
