/**
 * 게시물 관련 타입 정의
 */

// 사용자
export interface User {
  id: string;
  name: string;
  email: string;
  profileImageUrl: string;
  role: string;
  followerCount?: number;
  followingCount?: number;
}

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
  type: "company" | "community"; // 게시물 타입
  title: string;
  content?: string; // 게시물 본문 (커뮤니티 상세 페이지용)
  thumbnailUrl?: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  tags: Tag[];
  techBlog?: TechBlog; // 기업 블로그 글일 경우
  author?: User; // 커뮤니티 글일 경우
  isRead: boolean;
  publishedAt: string;
  url: string; // 원문 링크 (기업) 또는 내부 링크 (커뮤니티)
}

// 댓글
export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  likeCount: number;
}

// 피드 모드 (기업 글 / 일반 사용자 글)
export type FeedMode = "company" | "user";

// 날짜 범위
export type DateRange = "7d" | "30d" | "365d" | "all";

// 정렬 옵션
export type SortOption = "latest" | "popular" | "comments" | "views" | "likes";

// 필터 상태
export interface FilterState {
  mode: FeedMode;
  dateRange: DateRange;
  sortBy: SortOption;
  searchUser: string; // 사용자 검색어
  hideReadPosts: boolean;
  selectedTags: string[];
  selectedTechBlogs: string[];
}
