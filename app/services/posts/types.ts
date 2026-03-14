import { Post } from "@/app/types";

export type PostListSort = "LATEST" | "VIEW" | "LIKE" | "COMMENT";
export type PostListPeriod = "WEEK" | "MONTH" | "YEAR" | "ALL";

export interface PostListItem {
  id: string;
  title: string;
  content?: string;
  authorId?: string;
  categoryPath?: string;
  category?: {
    id?: string;
    path?: string;
  };
  status?: "DRAFT" | "PUBLISHED" | "PRIVATE";
  authorName: string;
  authorProfileImageUrl?: string;
  thumbnailUrl?: string;
  isRead: boolean;
  tags: { id: string; name: string }[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface PostListResponse {
  status: number;
  data: {
    content: PostListItem[];
    nextCursor?: string;
    hasNext?: boolean;
    size?: number;
  };
  message: string;
}

export interface UserPostListResponse {
  status: number;
  data: {
    content: PostListItem[];
    nextCursor: string | null;
    hasNext: boolean;
    size: number;
  };
  message: string;
}

export interface UserCategory {
  id: string;
  name: string;
  path: string;
  depth: number;
  parentId: string | null;
}

export interface UserCategoryResponse {
  status: number;
  data: UserCategory[];
  message: string;
}

export interface PostDetailResponse {
  status: number;
  data: {
    id: string;
    title?: string;
    content?: string;
    status?: "DRAFT" | "PUBLISHED" | "PRIVATE";
    publishedAt?: string;
    author: {
      id: string;
      name: string;
      profileImageUrl?: string;
    };
    category?: {
      id: string;
      name: string;
      path: string;
      depth: number;
      parentId?: string;
    } | null;
    tags?: { id: string; name: string }[];
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    isLiked?: boolean;
    isRead?: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export interface TogglePostReadLogResponse {
  status: number;
  data: null | {
    isRead: boolean;
  };
  message: string;
}

export interface CommunityPostListResult {
  posts: Post[];
  nextCursor?: string;
  hasNext?: boolean;
}

export interface DraftPostListItem {
  id: string;
  title: string;
  contentPreview: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftPostListResponse {
  status: number;
  data: {
    content: DraftPostListItem[];
    nextCursor: string | null;
    hasNext: boolean;
    size: number;
    totalCount?: number;
  };
  message: string;
}

export interface DraftPostListResult {
  drafts: DraftPostListItem[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount?: number;
}
