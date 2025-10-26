'use client';

import { useState, useEffect } from 'react';
import { FilterState, SortOption, Tag, TechBlog } from '../types';
import SelectDialog from './SelectDialog';

interface FilterProps {
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
  availableTags: Tag[];
  availableTechBlogs: TechBlog[];
  isOpen?: boolean;
  onClose?: () => void;
}

const MAX_VISIBLE_ITEMS = 5;

export default function Filter({
  filterState,
  onFilterChange,
  availableTags,
  availableTechBlogs,
  isOpen = false,
  onClose = () => {},
}: FilterProps) {
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isTechBlogDialogOpen, setIsTechBlogDialogOpen] = useState(false);

  // 모바일 드로어가 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSortChange = (sortBy: SortOption) => {
    onFilterChange({ ...filterState, sortBy });
  };

  const toggleHideReadPosts = () => {
    onFilterChange({
      ...filterState,
      hideReadPosts: !filterState.hideReadPosts,
    });
  };

  const toggleTag = (tagId: string) => {
    const newSelectedTags = filterState.selectedTags.includes(tagId)
      ? filterState.selectedTags.filter((id) => id !== tagId)
      : [...filterState.selectedTags, tagId];
    onFilterChange({ ...filterState, selectedTags: newSelectedTags });
  };

  const toggleTechBlog = (blogId: string) => {
    const newSelectedTechBlogs = filterState.selectedTechBlogs.includes(blogId)
      ? filterState.selectedTechBlogs.filter((id) => id !== blogId)
      : [...filterState.selectedTechBlogs, blogId];
    onFilterChange({
      ...filterState,
      selectedTechBlogs: newSelectedTechBlogs,
    });
  };

  // 최대 5개만 표시
  const visibleTags = availableTags.slice(0, MAX_VISIBLE_ITEMS);
  const visibleTechBlogs = availableTechBlogs.slice(0, MAX_VISIBLE_ITEMS);

  return (
    <>
      {/* Backdrop (모바일만) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[200]"
          onClick={onClose}
        />
      )}

      {/* Filter Sidebar / Drawer */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full md:h-auto
          w-[280px] p-6 bg-white
          border-r border-[var(--color-border-default)]
          overflow-y-auto
          z-[250] md:z-auto
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* 닫기 버튼 (모바일만) */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-[var(--radius-md)]
                   hover:bg-[var(--color-gray-100)] transition-[background-color] duration-[var(--transition-base)]"
          aria-label="필터 닫기"
        >
          <svg
            className="w-6 h-6 text-[var(--color-gray-700)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      {/* 정렬 */}
      <div className="mb-8 mt-12 md:mt-0">
        <h3 className="text-sm font-bold mb-3 text-black">정렬</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleSortChange('latest')}
            className={`px-4 py-2 rounded-[var(--radius-md)] text-sm text-left transition-[background-color] duration-[var(--transition-base)]
              ${
                filterState.sortBy === 'latest'
                  ? 'bg-black text-white font-bold'
                  : 'bg-transparent text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]'
              }`}
          >
            최신순
          </button>
          <button
            onClick={() => handleSortChange('popular')}
            className={`px-4 py-2 rounded-[var(--radius-md)] text-sm text-left transition-[background-color] duration-[var(--transition-base)]
              ${
                filterState.sortBy === 'popular'
                  ? 'bg-black text-white font-bold'
                  : 'bg-transparent text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]'
              }`}
          >
            인기순
          </button>
        </div>
      </div>

      {/* 읽은 게시물 제외 */}
      <div className="mb-8">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filterState.hideReadPosts}
            onChange={toggleHideReadPosts}
            className="w-5 h-5 rounded border-[var(--color-gray-400)] text-black
                     focus:ring-2 focus:ring-black focus:ring-offset-0"
          />
          <span className="text-sm text-[var(--color-gray-700)]">
            읽은 게시물 제외
          </span>
        </label>
      </div>

      {/* 태그 필터 */}
      <div className="mb-8">
        <h3 className="text-sm font-bold mb-3 text-black">태그</h3>
        <div className="flex flex-col gap-2">
          {visibleTags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-3 cursor-pointer px-2 py-1 rounded hover:bg-[var(--color-bg-hover)] transition-[background-color] duration-[var(--transition-base)]"
            >
              <input
                type="checkbox"
                checked={filterState.selectedTags.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
                className="w-4 h-4 rounded border-[var(--color-gray-400)] text-black
                         focus:ring-2 focus:ring-black focus:ring-offset-0"
              />
              <span className="text-sm text-[var(--color-gray-700)]">
                {tag.name}
              </span>
            </label>
          ))}
          {availableTags.length > MAX_VISIBLE_ITEMS && (
            <button
              onClick={() => setIsTagDialogOpen(true)}
              className="mt-2 px-4 py-2 rounded-[var(--radius-md)] text-sm text-[var(--color-gray-700)]
                       bg-transparent hover:bg-[var(--color-gray-100)]
                       transition-[background-color] duration-[var(--transition-base)]"
            >
              더보기 ({availableTags.length - MAX_VISIBLE_ITEMS}개)
            </button>
          )}
        </div>
      </div>

      {/* 기술 블로그 필터 */}
      <div>
        <h3 className="text-sm font-bold mb-3 text-black">기술 블로그</h3>
        <div className="flex flex-col gap-2">
          {visibleTechBlogs.map((blog) => (
            <label
              key={blog.id}
              className="flex items-center gap-3 cursor-pointer px-2 py-1 rounded hover:bg-[var(--color-bg-hover)] transition-[background-color] duration-[var(--transition-base)]"
            >
              <input
                type="checkbox"
                checked={filterState.selectedTechBlogs.includes(blog.id)}
                onChange={() => toggleTechBlog(blog.id)}
                className="w-4 h-4 rounded border-[var(--color-gray-400)] text-black
                         focus:ring-2 focus:ring-black focus:ring-offset-0"
              />
              <span className="text-sm text-[var(--color-gray-700)]">
                {blog.name}
              </span>
            </label>
          ))}
          {availableTechBlogs.length > MAX_VISIBLE_ITEMS && (
            <button
              onClick={() => setIsTechBlogDialogOpen(true)}
              className="mt-2 px-4 py-2 rounded-[var(--radius-md)] text-sm text-[var(--color-gray-700)]
                       bg-transparent hover:bg-[var(--color-gray-100)]
                       transition-[background-color] duration-[var(--transition-base)]"
            >
              더보기 ({availableTechBlogs.length - MAX_VISIBLE_ITEMS}개)
            </button>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SelectDialog
        isOpen={isTagDialogOpen}
        onClose={() => setIsTagDialogOpen(false)}
        items={availableTags}
        selectedIds={filterState.selectedTags}
        onToggle={toggleTag}
        title="태그 선택"
        searchPlaceholder="태그 검색..."
      />

      <SelectDialog
        isOpen={isTechBlogDialogOpen}
        onClose={() => setIsTechBlogDialogOpen(false)}
        items={availableTechBlogs}
        selectedIds={filterState.selectedTechBlogs}
        onToggle={toggleTechBlog}
        title="기술 블로그 선택"
        searchPlaceholder="기술 블로그 검색..."
      />
      </aside>
    </>
  );
}
