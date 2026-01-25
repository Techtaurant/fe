"use client";

import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import FilterBar from "./components/FilterBar";
import PostCard from "./components/PostCard";
import { FilterState, Post, Tag, TechBlog, FeedMode, User } from "./types";

// 더미 데이터
const DUMMY_TAGS: Tag[] = [
  { id: "1", name: "React" },
  { id: "2", name: "TypeScript" },
  { id: "3", name: "Next.js" },
  { id: "4", name: "Node.js" },
  { id: "5", name: "DevOps" },
  { id: "6", name: "AWS" },
  { id: "7", name: "Docker" },
  { id: "8", name: "Kubernetes" },
  { id: "9", name: "Vue.js" },
  { id: "10", name: "Angular" },
  { id: "11", name: "Python" },
  { id: "12", name: "Java" },
  { id: "13", name: "Spring" },
  { id: "14", name: "Django" },
  { id: "15", name: "GraphQL" },
];

const DUMMY_TECH_BLOGS: TechBlog[] = [
  { id: "1", name: "토스", iconUrl: "/next.svg" },
  { id: "2", name: "카카오", iconUrl: "/next.svg" },
  { id: "3", name: "네이버", iconUrl: "/next.svg" },
  { id: "4", name: "우아한형제들", iconUrl: "/next.svg" },
  { id: "5", name: "라인", iconUrl: "/next.svg" },
  { id: "6", name: "쿠팡", iconUrl: "/next.svg" },
  { id: "7", name: "당근마켓", iconUrl: "/next.svg" },
  { id: "8", name: "뱅크샐러드", iconUrl: "/next.svg" },
  { id: "9", name: "야놀자", iconUrl: "/next.svg" },
  { id: "10", name: "컬리", iconUrl: "/next.svg" },
];

const DUMMY_USERS: User[] = [
  { id: "u1", name: "김개발", email: "dev1@test.com", profileImageUrl: "", role: "USER" },
  { id: "u2", name: "이코딩", email: "dev2@test.com", profileImageUrl: "", role: "USER" },
  { id: "u3", name: "박해커", email: "dev3@test.com", profileImageUrl: "", role: "USER" },
];

const DUMMY_COMPANY_POSTS: Post[] = [
  {
    id: "c1",
    type: 'company',
    title: "React 19의 새로운 기능과 변화",
    thumbnailUrl: "/next.svg",
    viewCount: 15420,
    tags: [DUMMY_TAGS[0], DUMMY_TAGS[1]],
    techBlog: DUMMY_TECH_BLOGS[0],
    isRead: false,
    publishedAt: "2025-01-15",
    url: "https://toss.tech",
  },
  {
    id: "c2",
    type: 'company',
    title: "TypeScript 5.0 릴리즈 노트 정리",
    thumbnailUrl: "/next.svg",
    viewCount: 8350,
    tags: [DUMMY_TAGS[1]],
    techBlog: DUMMY_TECH_BLOGS[1],
    isRead: true,
    publishedAt: "2025-01-14",
    url: "https://tech.kakao.com",
  },
  {
    id: "c3",
    type: 'company',
    title: "Next.js 16에서 달라진 점",
    viewCount: 23100,
    tags: [DUMMY_TAGS[0], DUMMY_TAGS[2]],
    techBlog: DUMMY_TECH_BLOGS[2],
    isRead: false,
    publishedAt: "2025-01-13",
    url: "https://d2.naver.com",
  },
  {
    id: "c4",
    type: 'company',
    title: "AWS Lambda에서 컨테이너 이미지 사용하기",
    thumbnailUrl: "/next.svg",
    viewCount: 5200,
    tags: [DUMMY_TAGS[4], DUMMY_TAGS[5]],
    techBlog: DUMMY_TECH_BLOGS[3],
    isRead: false,
    publishedAt: "2025-01-12",
    url: "https://techblog.woowahan.com",
  },
  {
    id: "c5",
    type: 'company',
    title: "Kubernetes 운영 경험 공유",
    thumbnailUrl: "/next.svg",
    viewCount: 12800,
    tags: [DUMMY_TAGS[4], DUMMY_TAGS[7]],
    techBlog: DUMMY_TECH_BLOGS[4],
    isRead: true,
    publishedAt: "2025-01-11",
    url: "https://engineering.linecorp.com",
  },
];

const DUMMY_COMMUNITY_POSTS: Post[] = [
  {
    id: "u1",
    type: 'community',
    title: "주니어 개발자의 이직 회고",
    viewCount: 1200,
    likeCount: 56,
    commentCount: 12,
    tags: [DUMMY_TAGS[0]],
    author: DUMMY_USERS[0],
    isRead: false,
    publishedAt: "2025-01-16",
    url: "/post/u1",
  },
  {
    id: "u2",
    type: 'community',
    title: "사이드 프로젝트 실패 경험담",
    viewCount: 3400,
    likeCount: 128,
    commentCount: 45,
    tags: [DUMMY_TAGS[2], DUMMY_TAGS[4]],
    author: DUMMY_USERS[1],
    isRead: false,
    publishedAt: "2025-01-15",
    url: "/post/u2",
  },
  {
    id: "u3",
    type: 'community',
    title: "오늘 배운 알고리즘 정리",
    viewCount: 150,
    likeCount: 5,
    commentCount: 0,
    tags: [DUMMY_TAGS[11]],
    author: DUMMY_USERS[2],
    isRead: false,
    publishedAt: "2025-01-14",
    url: "/post/u3",
  },
];

export default function Home() {
  const [filterState, setFilterState] = useState<FilterState>({
    mode: 'company',
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
          availableTags={DUMMY_TAGS}
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
