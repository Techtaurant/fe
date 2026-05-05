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
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export type LikeStatus = "NONE" | "LIKE" | "DISLIKE";

export interface UpdateCommentLikeRequest {
  likeStatus: LikeStatus;
}

export interface UpdateCommentLikeResponse {
  status: number | Record<string, unknown>;
  message: string;
}

export interface UpdateCommentResponse {
  status: number | Record<string, unknown>;
  data: {
    id: string;
    content: string;
    postId: string;
    authorId: string;
    authorName: string;
    parentId?: string | null;
    depth: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export interface ApiStatusResponse {
  httpStatusCode: number;
  code: number;
  message: string;
}

export interface ValidationErrorResponseData {
  errors: Record<string, string>;
}

export interface ValidationErrorApiResponse {
  status: ApiStatusResponse | number | Record<string, unknown>;
  data?: ValidationErrorResponseData;
  message?: string;
}

export type CommentSort = "LATEST" | "LIKE" | "REPLY";

export interface FetchCommentsRequest {
  postId: string;
  cursor?: string;
  size?: number;
  sort?: CommentSort;
}

export interface FetchCommentRepliesRequest {
  commentId: string;
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
  isDeleted: boolean;
  isBanned?: boolean;
  likeCount: number;
  replyCount: number;
  likeStatus?: LikeStatus;
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

export interface FetchCommentRepliesResponse {
  status: number | Record<string, unknown>;
  data: CursorPageResponse<CommentListResponse>;
  message: string;
}
