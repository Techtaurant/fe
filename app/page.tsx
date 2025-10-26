'use client';

import { useState } from 'react';
import Header from './components/Header';
import Filter from './components/Filter';
import PostCard from './components/PostCard';
import { FilterState, Post, Tag, TechBlog } from './types';

// 더미 데이터
const DUMMY_TAGS: Tag[] = [
  { id: '1', name: 'React' },
  { id: '2', name: 'TypeScript' },
  { id: '3', name: 'Next.js' },
  { id: '4', name: 'Node.js' },
  { id: '5', name: 'DevOps' },
  { id: '6', name: 'AWS' },
  { id: '7', name: 'Docker' },
  { id: '8', name: 'Kubernetes' },
  { id: '9', name: 'Vue.js' },
  { id: '10', name: 'Angular' },
  { id: '11', name: 'Python' },
  { id: '12', name: 'Java' },
  { id: '13', name: 'Spring' },
  { id: '14', name: 'Django' },
  { id: '15', name: 'GraphQL' },
];

const DUMMY_TECH_BLOGS: TechBlog[] = [
  { id: '1', name: '토스', iconUrl: '/next.svg' },
  { id: '2', name: '카카오', iconUrl: '/next.svg' },
  { id: '3', name: '네이버', iconUrl: '/next.svg' },
  { id: '4', name: '우아한형제들', iconUrl: '/next.svg' },
  { id: '5', name: '라인', iconUrl: '/next.svg' },
  { id: '6', name: '쿠팡', iconUrl: '/next.svg' },
  { id: '7', name: '당근마켓', iconUrl: '/next.svg' },
  { id: '8', name: '뱅크샐러드', iconUrl: '/next.svg' },
  { id: '9', name: '야놀자', iconUrl: '/next.svg' },
  { id: '10', name: '컬리', iconUrl: '/next.svg' },
];

const DUMMY_POSTS: Post[] = [
  {
    id: '1',
    title: 'React 19의 새로운 기능과 변화',
    thumbnailUrl: '/next.svg',
    viewCount: 15420,
    tags: [DUMMY_TAGS[0], DUMMY_TAGS[1]],
    techBlog: DUMMY_TECH_BLOGS[0],
    isRead: false,
    publishedAt: '2025-01-15',
    url: 'https://example.com',
  },
  {
    id: '2',
    title: 'TypeScript 5.0 릴리즈 노트 정리',
    thumbnailUrl: '/next.svg',
    viewCount: 8350,
    tags: [DUMMY_TAGS[1]],
    techBlog: DUMMY_TECH_BLOGS[1],
    isRead: true,
    publishedAt: '2025-01-14',
    url: 'https://example.com',
  },
  {
    id: '3',
    title: 'Next.js 16에서 달라진 점',
    viewCount: 23100,
    tags: [DUMMY_TAGS[0], DUMMY_TAGS[2]],
    techBlog: DUMMY_TECH_BLOGS[2],
    isRead: false,
    publishedAt: '2025-01-13',
    url: 'https://example.com',
  },
  {
    id: '4',
    title: 'AWS Lambda에서 컨테이너 이미지 사용하기',
    thumbnailUrl: '/next.svg',
    viewCount: 5200,
    tags: [DUMMY_TAGS[4], DUMMY_TAGS[5]],
    techBlog: DUMMY_TECH_BLOGS[3],
    isRead: false,
    publishedAt: '2025-01-12',
    url: 'https://example.com',
  },
  {
    id: '5',
    title: 'Kubernetes 운영 경험 공유',
    thumbnailUrl: '/next.svg',
    viewCount: 12800,
    tags: [DUMMY_TAGS[4], DUMMY_TAGS[7]],
    techBlog: DUMMY_TECH_BLOGS[4],
    isRead: true,
    publishedAt: '2025-01-11',
    url: 'https://example.com',
  },
];

export default function Home() {
  const [filterState, setFilterState] = useState<FilterState>({
    sortBy: 'latest',
    hideReadPosts: false,
    selectedTags: [],
    selectedTechBlogs: [],
  });

  const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const handleReadStatusChange = (postId: string, isRead: boolean) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, isRead } : post
      )
    );
  };

  // 필터링 로직
  const filteredPosts = posts.filter((post) => {
    // 읽은 게시물 제외
    if (filterState.hideReadPosts && post.isRead) return false;

    // 태그 필터
    if (
      filterState.selectedTags.length > 0 &&
      !post.tags.some((tag) => filterState.selectedTags.includes(tag.id))
    ) {
      return false;
    }

    // 기술 블로그 필터
    if (
      filterState.selectedTechBlogs.length > 0 &&
      !filterState.selectedTechBlogs.includes(post.techBlog.id)
    ) {
      return false;
    }

    return true;
  });

  // 정렬 로직
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (filterState.sortBy === 'latest') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    } else {
      return b.viewCount - a.viewCount;
    }
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg-default)]">
      <Header onMenuClick={() => setIsMobileFilterOpen(true)} />
      <div className="md:flex max-w-[1400px] mx-auto">
        <Filter
          filterState={filterState}
          onFilterChange={setFilterState}
          availableTags={DUMMY_TAGS}
          availableTechBlogs={DUMMY_TECH_BLOGS}
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
        />
        <main className="flex-1 md:max-w-[728px] mx-auto px-4 md:px-6">
          {sortedPosts.length > 0 ? (
            <div>
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
              <p className="text-lg text-[var(--color-gray-600)]">
                조건에 맞는 게시물이 없습니다.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
