/**
 * 게시물 관련 타입 정의
 */

// 태그
export interface Tag {
  id: string;
  name: string;
}

// 기술 블로그 회사
export interface TechBlog {
  id: string;
  name: string;
  iconUrl: string;
}

// 게시물
export interface Post {
  id: string;
  title: string;
  thumbnailUrl?: string;
  viewCount: number;
  tags: Tag[];
  techBlog: TechBlog;
  isRead: boolean;
  publishedAt: string;
  url: string;
}

// 정렬 옵션
export type SortOption = 'latest' | 'popular';

// 필터 상태
export interface FilterState {
  sortBy: SortOption;
  hideReadPosts: boolean;
  selectedTags: string[];
  selectedTechBlogs: string[];
}
