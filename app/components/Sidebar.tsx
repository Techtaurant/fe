'use client';

import { useState, useEffect } from 'react';
import { FilterState, Tag, TechBlog, FeedMode, SortOption } from '../types';
import SidebarSearchInput from './SidebarSearchInput';
import { useTags } from '../hooks/useTags';

interface SidebarProps {
  mode: FeedMode;
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
  availableTags: Tag[];
  availableTechBlogs?: TechBlog[]; // Company Mode Only
  isOpen?: boolean;
  onClose?: () => void;
}

const MAX_VISIBLE_ITEMS = 5;

export default function Sidebar({
  mode,
  filterState,
  onFilterChange,
  availableTags,
  availableTechBlogs = [],
  isOpen = false,
  onClose = () => {},
}: SidebarProps) {
  const { tags: fetchedTags } = useTags(availableTags);
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllTechBlogs, setShowAllTechBlogs] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState(filterState.searchUser || '');
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [techBlogSearchQuery, setTechBlogSearchQuery] = useState('');

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

  // 검색어 디바운스 처리 (Community Mode)
  useEffect(() => {
    if (mode === 'user') {
      const timer = setTimeout(() => {
        onFilterChange({ ...filterState, searchUser: userSearchQuery });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [userSearchQuery, mode]); // removed filterState dependency

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

  const handleSortChange = (sortBy: SortOption) => {
    onFilterChange({ ...filterState, sortBy });
  };

  const toggleHideReadPosts = () => {
    onFilterChange({
      ...filterState,
      hideReadPosts: !filterState.hideReadPosts,
    });
  };

  const filteredTags = fetchedTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchQuery.trim().toLowerCase()),
  );
  const filteredTechBlogs = availableTechBlogs.filter((blog) =>
    blog.name.toLowerCase().includes(techBlogSearchQuery.trim().toLowerCase()),
  );

  const selectTopTag = () => {
    const topTag = filteredTags[0];
    if (!topTag) return;
    if (!filterState.selectedTags.includes(topTag.id)) {
      onFilterChange({
        ...filterState,
        selectedTags: [...filterState.selectedTags, topTag.id],
      });
    }
  };

  const selectTopTechBlog = () => {
    const topTechBlog = filteredTechBlogs[0];
    if (!topTechBlog) return;
    if (!filterState.selectedTechBlogs.includes(topTechBlog.id)) {
      onFilterChange({
        ...filterState,
        selectedTechBlogs: [...filterState.selectedTechBlogs, topTechBlog.id],
      });
    }
  };

  const visibleTags = showAllTags
    ? filteredTags
    : filteredTags.slice(0, MAX_VISIBLE_ITEMS);
  const visibleTechBlogs = showAllTechBlogs
    ? filteredTechBlogs
    : filteredTechBlogs.slice(0, MAX_VISIBLE_ITEMS);

  return (
    <>
      {/* Backdrop (모바일만) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[200]"
          onClick={onClose}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full md:h-auto
          w-[280px] p-6 bg-sidebar
          border-r border-border
          overflow-y-auto
          z-[250] md:z-auto
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* 닫기 버튼 (모바일만) */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-md hover:bg-muted transition-colors duration-200"
          aria-label="필터 닫기"
        >
          <svg
            className="w-6 h-6 text-muted-foreground"
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

        {/* =================================================================
           COMPANY MODE UI (Restored Original Filter UI)
           ================================================================= */}
        {mode === 'company' && (
          <div className="mt-12 md:mt-0">
            {/* 정렬 */}
            <div className="mb-8">
              <h3 className="text-sm font-bold mb-3 text-foreground">정렬</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSortChange('latest')}
                  className={`px-4 py-2 rounded-md text-sm text-left transition-colors duration-200
                    ${
                      filterState.sortBy === 'latest'
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-transparent text-muted-foreground hover:bg-muted'
                    }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => handleSortChange('popular')}
                  className={`px-4 py-2 rounded-md text-sm text-left transition-colors duration-200
                    ${
                      filterState.sortBy === 'popular'
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-transparent text-muted-foreground hover:bg-muted'
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
                  className="w-5 h-5 rounded border-border text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-0"
                />
                <span className="text-sm text-muted-foreground">
                  읽은 게시물 제외
                </span>
              </label>
            </div>

             {/* 기술 블로그 필터 */}
             <div className="mb-8">
              <h3 className="text-sm font-bold mb-3 text-foreground">기술 블로그</h3>
              <div className="mb-3">
                <SidebarSearchInput
                  placeholder="기술 블로그 검색"
                  value={techBlogSearchQuery}
                  onChange={setTechBlogSearchQuery}
                  onEnter={selectTopTechBlog}
                />
              </div>
              <div className="flex flex-col gap-2">
                {visibleTechBlogs.map((blog) => (
                  <label
                    key={blog.id}
                    className="flex items-center gap-3 cursor-pointer px-2 py-1 rounded hover:bg-muted transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={filterState.selectedTechBlogs.includes(blog.id)}
                      onChange={() => toggleTechBlog(blog.id)}
                      className="w-4 h-4 rounded border-border text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                    <span className="text-sm text-muted-foreground">
                      {blog.name}
                    </span>
                  </label>
                ))}
                {filteredTechBlogs.length > MAX_VISIBLE_ITEMS && (
                  <button
                    onClick={() => setShowAllTechBlogs((prev) => !prev)}
                    className="mt-2 px-4 py-2 rounded-md text-sm text-muted-foreground bg-transparent hover:bg-muted transition-colors duration-200"
                  >
                    {showAllTechBlogs
                      ? '접기'
                      : `더보기 (${filteredTechBlogs.length - MAX_VISIBLE_ITEMS}개)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


        {/* =================================================================
           COMMUNITY MODE UI (New Requirements)
           ================================================================= */}
        {mode === 'user' && (
          <div className="mt-12 md:mt-0">
             {/* 사용자 검색 */}
             <div className="mb-8">
              <h3 className="text-sm font-bold mb-3 text-foreground">사용자 검색</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="사용자 이름..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-muted border-none rounded-full
                          py-2 pl-10 pr-4 text-sm text-foreground
                          transition-colors duration-200
                          focus:bg-muted/70 focus:outline-none"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
           COMMON UI (Tags)
           ================================================================= */}
        {/* 태그 필터 */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-3 text-foreground">태그</h3>
          <div className="mb-3">
            <SidebarSearchInput
              placeholder="태그 검색"
              value={tagSearchQuery}
              onChange={setTagSearchQuery}
              onEnter={selectTopTag}
            />
          </div>
          <div className="flex flex-col gap-2">
            {visibleTags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-3 cursor-pointer px-2 py-1 rounded hover:bg-muted transition-colors duration-200"
              >
                <input
                  type="checkbox"
                  checked={filterState.selectedTags.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                  className="w-4 h-4 rounded border-border text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-0"
                />
                <span className="text-sm text-muted-foreground">
                  {tag.name}
                </span>
              </label>
            ))}
            {filteredTags.length > MAX_VISIBLE_ITEMS && (
              <button
                onClick={() => setShowAllTags((prev) => !prev)}
                className="mt-2 px-4 py-2 rounded-md text-sm text-muted-foreground bg-transparent hover:bg-muted transition-colors duration-200"
              >
                {showAllTags
                  ? '접기'
                  : `더보기 (${filteredTags.length - MAX_VISIBLE_ITEMS}개)`}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
