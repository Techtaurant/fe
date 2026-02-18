export interface CreateCommentRequest {
  content: string;
  postId: string;
  parentId?: string;
}

export interface CreateCommentResponse {
  status: number | Record<string, unknown>;
  data: {
    id: string;
    content: string;
    postId: string;
    authorId: string;
    authorName: string;
    parentId?: string | null;
    depth: number;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export type CommentSort = "LATEST" | "LIKE" | "REPLY";

export interface FetchCommentsRequest {
  postId: string;
  cursor?: string;
  size?: number;
  sort?: CommentSort;
}

export interface CommentListResponse {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorProfileImageUrl: string | null;
  parentId?: string | null;
  depth: number;
  likeCount: number;
  replyCount: number;
  likeStatus?: "NONE" | "LIKE" | "DISLIKE";
  createdAt: string;
  updatedAt: string;
}

export interface CursorPageResponse<T> {
  content: T[];
  nextCursor: string | null;
  hasNext: boolean;
  size: number;
}

export interface FetchCommentsResponse {
  status: number | Record<string, unknown>;
  data: CursorPageResponse<CommentListResponse>;
  message: string;
}
