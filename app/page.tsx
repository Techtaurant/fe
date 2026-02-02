"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import FilterBar from "./components/FilterBar";
import PostCard from "./components/PostCard";
import { FEED_MODES } from "./constants/feed";
import { FilterState, Post, FeedMode } from "./types";
import {
  DUMMY_TECH_BLOGS,
  DUMMY_COMPANY_POSTS,
  DUMMY_COMMUNITY_POSTS,
} from "./data/dummyData";

function HomeContent({ initialMode }: { initialMode: FeedMode }) {
  const [filterState, setFilterState] = useState<FilterState>({
    mode: initialMode,
    dateRange: 'all',
    sortBy: 'latest',
    searchUser: '',
    hideReadPosts: false,
    selectedTags: [],
    selectedTechBlogs: [],
  });

  // Mode에 따라 보여줄 포스트 소스 결정
  const [companyPosts, setCompanyPosts] = useState<Post[]>(DUMMY_COMPANY_POSTS);
  const [communityPosts, setCommunityPosts] = useState<Post[]>(DUMMY_COMMUNITY_POSTS);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleReadStatusChange = (postId: string, isRead: boolean) => {
    if (filterState.mode === 'company') {
      setCompanyPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, isRead } : post))
      );
    } else {
      setCommunityPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, isRead } : post))
      );
    }
  };

  const handleModeChange = (mode: FeedMode) => {
    // 모드 변경 시 필터 초기화 (선택적)
    setFilterState(prev => ({
      ...prev,
      mode,
      sortBy: 'latest', // 정렬 초기화
      // 태그나 검색어는 유지할지 초기화할지 결정. 여기선 유지.
    }));
  };

  const currentPosts = filterState.mode === 'company' ? companyPosts : communityPosts;

  // 통합 필터링 로직
  const filteredPosts = currentPosts.filter((post) => {
    // 1. 읽은 게시물 제외 (공통)
    if (filterState.hideReadPosts && post.isRead) return false;

    // 2. 태그 필터 (공통)
    if (
      filterState.selectedTags.length > 0 &&
      !post.tags.some((tag) => filterState.selectedTags.includes(tag.id))
    ) {
      return false;
    }

    // 3. 모드별 필터
    if (filterState.mode === 'company') {
      // 기업 블로그 필터
      if (
        filterState.selectedTechBlogs.length > 0 &&
        post.techBlog &&
        !filterState.selectedTechBlogs.includes(post.techBlog.id)
      ) {
        return false;
      }
    } else {
      // 커뮤니티: 날짜 필터
      if (filterState.dateRange !== 'all') {
        const postDate = new Date(post.publishedAt);
        const now = new Date();
        let days = 0;
        if (filterState.dateRange === '7d') days = 7;
        else if (filterState.dateRange === '30d') days = 30;
        else if (filterState.dateRange === '365d') days = 365;
        
        const diffTime = Math.abs(now.getTime() - postDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
        if (diffDays > days) return false;
      }

      // 커뮤니티: 사용자 검색
      if (filterState.searchUser && post.author) {
        if (!post.author.name.toLowerCase().includes(filterState.searchUser.toLowerCase())) {
          return false;
        }
      }
    }
    
    return true;
  });

  // 정렬 로직
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    // 공통: 최신순, 인기순
    // 커뮤니티 전용: 댓글, 좋아요 등

    switch (filterState.sortBy) {
      case 'popular':
        return b.viewCount - a.viewCount;
      case 'comments':
        return (b.commentCount || 0) - (a.commentCount || 0);
      case 'views':
        return b.viewCount - a.viewCount;
      case 'likes':
        return (b.likeCount || 0) - (a.likeCount || 0);
      case 'latest':
      default:
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onMenuClick={() => setIsMobileSidebarOpen(true)} 
        currentMode={filterState.mode}
        onModeChange={handleModeChange}
      />
      <div className="md:flex max-w-[1400px] mx-auto">
        <Sidebar
          mode={filterState.mode}
          filterState={filterState}
          onFilterChange={setFilterState}
          availableTags={[]}
          availableTechBlogs={DUMMY_TECH_BLOGS}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 md:max-w-[728px] mx-auto px-4 md:px-6 py-6">
          {/* Community Mode일 때만 상단 필터 바 표시 */}
          {filterState.mode === 'user' && (
            <FilterBar 
              filterState={filterState}
              onFilterChange={setFilterState}
            />
          )}
          
          {sortedPosts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {sortedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReadStatusChange={handleReadStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-lg text-muted-foreground">
                조건에 맞는 게시물이 없습니다.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const initialMode: FeedMode =
    modeParam === FEED_MODES.USER || modeParam === FEED_MODES.COMPANY
      ? modeParam
      : FEED_MODES.COMPANY;

  return <HomeContent key={initialMode} initialMode={initialMode} />;
}
