'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FilterState, Tag, TechBlog, FeedMode, SortOption } from '../types';
import SearchInput from './SearchInput';
import { useTags } from '../hooks/useTags';
import { useTechBlogsTags } from '../hooks/useTechBlogsTags';
import FilterCheckboxListSkeleton from './skeleton/FilterCheckboxListSkeleton';

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
const LEGACY_TAGS_EXPANDED_STORAGE_KEY = 'sidebar_user_tags_expanded';

export default function Sidebar({
  mode,
  filterState,
  onFilterChange,
  availableTags,
  availableTechBlogs = [],
  isOpen = false,
  onClose = () => {},
}: SidebarProps) {
  const t = useTranslations('Sidebar');
  const locale = useLocale();
  const tagsExpandedStorageKey = `sidebar_tags_expanded_${locale}_${mode}`;
  const [showAllTags, setShowAllTags] = useState(() => {
    if (typeof window === 'undefined') return false;

    try {
      const scopedValue = localStorage.getItem(tagsExpandedStorageKey);
      if (scopedValue === '1') {
        return true;
      }

      return localStorage.getItem(LEGACY_TAGS_EXPANDED_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [showAllTechBlogs, setShowAllTechBlogs] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState(filterState.searchUser || '');
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [techBlogSearchQuery, setTechBlogSearchQuery] = useState('');
  const shouldFetchAllTags = showAllTags || tagSearchQuery.trim().length > 0;
  const { tags: fetchedTags, isLoading: isTagsLoading } = useTags(availableTags, {
    fetchAll: shouldFetchAllTags,
  });
  const { techBlogs: fetchedTechBlogs, isLoading: isTechBlogsLoading } = useTechBlogsTags(availableTechBlogs);
  const latestFilterStateRef = useRef(filterState);
  const shouldShowTechBlogSkeleton = isTechBlogsLoading || isTagsLoading;
  const tagItemRefs = useRef<Map<string, HTMLLabelElement>>(new Map());
  const previousTagOffsetsRef = useRef<Map<string, number>>(new Map());

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

  useEffect(() => {
    latestFilterStateRef.current = filterState;
  }, [filterState]);

  // 검색어 디바운스 처리 (Community Mode)
  useEffect(() => {
    if (mode === 'user') {
      const timer = setTimeout(() => {
        const latest = latestFilterStateRef.current;
        onFilterChange({ ...latest, searchUser: userSearchQuery });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [userSearchQuery, mode, onFilterChange]);

  const toggleTag = (tagId: string) => {
    const normalizedTagId = tagId.toLowerCase();
    const isSelected = filterState.selectedTags.some(
      (id) => id.toLowerCase() === normalizedTagId,
    );
    const newSelectedTags = isSelected
      ? filterState.selectedTags.filter(
          (id) => id.toLowerCase() !== normalizedTagId,
        )
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

  const filteredTags = fetchedTags.filter((tag: Tag) =>
    tag.name.toLowerCase().includes(tagSearchQuery.trim().toLowerCase()),
  );
  const selectedTagIdSet = new Set(
    filterState.selectedTags.map((id) => id.toLowerCase()),
  );
  const orderedTags = [
    ...filteredTags.filter((tag) => selectedTagIdSet.has(tag.id.toLowerCase())),
    ...filteredTags.filter((tag) => !selectedTagIdSet.has(tag.id.toLowerCase())),
  ];
  const filteredTechBlogs = fetchedTechBlogs.filter((blog: TechBlog) =>
    blog.name.toLowerCase().includes(techBlogSearchQuery.trim().toLowerCase()),
  );

  const selectTopTag = () => {
    const topTag =
      orderedTags.find((tag) => !selectedTagIdSet.has(tag.id.toLowerCase())) ||
      orderedTags[0];
    if (!topTag) return;
    if (!selectedTagIdSet.has(topTag.id.toLowerCase())) {
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
    ? orderedTags
    : orderedTags.slice(0, MAX_VISIBLE_ITEMS);
  const visibleTagOrderKey = visibleTags.map((tag) => tag.id).join('|');
  const visibleTechBlogs = showAllTechBlogs
    ? filteredTechBlogs
    : filteredTechBlogs.slice(0, MAX_VISIBLE_ITEMS);

  useLayoutEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const nextOffsets = new Map<string, number>();
      const visibleTagIds = visibleTagOrderKey ? visibleTagOrderKey.split('|') : [];
      visibleTagIds.forEach((tagId) => {
        const element = tagItemRefs.current.get(tagId);
        if (!element) return;
        nextOffsets.set(tagId, element.offsetTop);
      });
      previousTagOffsetsRef.current = nextOffsets;
      return;
    }

    const nextOffsets = new Map<string, number>();
    const visibleTagIds = visibleTagOrderKey ? visibleTagOrderKey.split('|') : [];

    visibleTagIds.forEach((tagId) => {
      const element = tagItemRefs.current.get(tagId);
      if (!element) return;

      const nextTop = element.offsetTop;
      nextOffsets.set(tagId, nextTop);

      const prevTop = previousTagOffsetsRef.current.get(tagId);
      if (prevTop === undefined) return;

      const deltaY = prevTop - nextTop;
      if (deltaY === 0) return;

      const distance = Math.abs(deltaY);
      const durationMs = Math.max(420, Math.min(680, 320 + distance * 0.75));

      element.style.transition = 'none';
      element.style.transform = `translateY(${deltaY}px)`;
      element.style.willChange = 'transform';

      requestAnimationFrame(() => {
        element.style.transition = `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        element.style.transform = '';
      });

      const clearWillChange = () => {
        element.style.willChange = '';
        element.removeEventListener('transitionend', clearWillChange);
      };

      element.addEventListener('transitionend', clearWillChange);
    });

    previousTagOffsetsRef.current = nextOffsets;
  }, [visibleTagOrderKey]);

  const handleToggleShowAllTags = () => {
    const nextValue = !showAllTags;
    setShowAllTags(nextValue);

    if (typeof window === 'undefined') return;

    try {
      if (nextValue) {
        localStorage.setItem(tagsExpandedStorageKey, '1');
      } else {
        localStorage.removeItem(tagsExpandedStorageKey);
      }
    } catch {
      // ignore storage write errors
    }
  };

  return (
    <>
      {/* Backdrop (모바일만) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[350]"
          onClick={onClose}
          onPointerDown={onClose}
          onTouchStart={onClose}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full md:h-auto
          w-[280px] p-6 bg-sidebar
          border-r border-border
          overflow-y-auto
          z-[400] md:z-auto
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* 닫기 버튼 (모바일만) */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-md hover:bg-muted transition-colors duration-200"
          aria-label={t('closeFilter')}
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
              <h3 className="text-sm font-bold mb-3 text-foreground">{t('sort.title')}</h3>
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
                  {t('sort.latest')}
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
                  {t('sort.popular')}
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
                  {t('hideReadPosts')}
                </span>
              </label>
            </div>

             {/* 기술 블로그 필터 */}
             <div className="mb-8">
               <h3 className="text-sm font-bold mb-3 text-foreground">{t('techBlog.title')}</h3>
               <div className="mb-3">
                 <SearchInput
                    placeholder={t('techBlog.searchPlaceholder')}
                    value={techBlogSearchQuery}
                    onChange={setTechBlogSearchQuery}
                    onEnter={selectTopTechBlog}
                 />
              </div>
              <div className="flex flex-col gap-2">
                {shouldShowTechBlogSkeleton ? (
                  <FilterCheckboxListSkeleton count={MAX_VISIBLE_ITEMS} />
                ) : (
                  visibleTechBlogs.map((blog: TechBlog) => (
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
                  ))
                )}
                {!shouldShowTechBlogSkeleton && filteredTechBlogs.length > MAX_VISIBLE_ITEMS && (
                  <button
                    onClick={() => setShowAllTechBlogs((prev) => !prev)}
                    className="mt-2 px-4 py-2 rounded-md text-sm text-muted-foreground bg-transparent hover:bg-muted transition-colors duration-200"
                  >
                     {showAllTechBlogs
                      ? t('collapse')
                      : t('showMoreCount', { count: filteredTechBlogs.length - MAX_VISIBLE_ITEMS })}
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
               <h3 className="text-sm font-bold mb-3 text-foreground">{t('userSearch.title')}</h3>
               <SearchInput
                 placeholder={t('userSearch.placeholder')}
                 value={userSearchQuery}
                 onChange={setUserSearchQuery}
               />
            </div>
          </div>
        )}

        {/* =================================================================
           COMMON UI (Tags)
           ================================================================= */}
        {/* 태그 필터 */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-3 text-foreground">{t('tag.title')}</h3>
          <div className="mb-3">
            <SearchInput
              placeholder={t('tag.searchPlaceholder')}
              value={tagSearchQuery}
              onChange={setTagSearchQuery}
              onEnter={selectTopTag}
            />
          </div>
          <div className="flex flex-col gap-2">
            {isTagsLoading ? (
              <FilterCheckboxListSkeleton count={MAX_VISIBLE_ITEMS} />
            ) : (
              visibleTags.map((tag: Tag) => (
                <label
                  key={tag.id}
                  ref={(element) => {
                    if (!element) {
                      tagItemRefs.current.delete(tag.id);
                      return;
                    }

                    tagItemRefs.current.set(tag.id, element);
                  }}
                  className="flex items-center gap-3 cursor-pointer px-2 py-1 rounded hover:bg-muted transition-colors duration-200"
                >
                    <input
                      type="checkbox"
                      checked={filterState.selectedTags.some(
                        (id) => id.toLowerCase() === tag.id.toLowerCase(),
                      )}
                      onChange={() => toggleTag(tag.id)}
                      className="w-4 h-4 rounded border-border text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                  <span className="text-sm text-muted-foreground">
                    {tag.name}
                  </span>
                </label>
              ))
            )}
            {orderedTags.length > MAX_VISIBLE_ITEMS && (
              <button
                onClick={handleToggleShowAllTags}
                className="mt-2 px-4 py-2 rounded-md text-sm text-muted-foreground bg-transparent hover:bg-muted transition-colors duration-200"
              >
                {showAllTags
                  ? t('collapse')
                  : t('showMoreCount', { count: orderedTags.length - MAX_VISIBLE_ITEMS })}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
