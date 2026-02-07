import { Post } from "@/app/types";

export type PostListSort = "LATEST" | "VIEW" | "LIKE" | "COMMENT";
export type PostListPeriod = "WEEK" | "MONTH" | "YEAR" | "ALL";

export interface PostListItem {
  id: string;
  title: string;
  authorName: string;
  authorProfileImageUrl?: string;
  thumbnailUrl?: string;
  isRead: boolean;
  tags: { id: string; name: string }[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface PostListResponse {
  status: number;
  data: {
    content: PostListItem[];
    nextCursor?: string;
  };
  message: string;
}

export interface PostDetailResponse {
  status: number;
  data: {
    id: string;
    title: string;
    content: string;
    author: {
      id: string;
      name: string;
      profileImageUrl?: string;
    };
    category: {
      id: string;
      name: string;
      path: string;
      depth: number;
      parentId?: string;
    };
    tags: { id: string; name: string }[];
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export interface CommunityPostListResult {
  posts: Post[];
  nextCursor?: string;
}
