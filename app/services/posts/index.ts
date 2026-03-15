import {
  CreatePostRequest,
  CreatePostResponse,
  Post,
  UpdatePostRequest,
} from "@/app/types";
import {
  createPostRequest,
  deletePostRequest,
  fetchDraftDetail,
  fetchDraftPosts,
  fetchCommunityPosts,
  fetchUserPosts,
  fetchUserCategories as fetchUserCategoriesRequest,
  fetchPostDetail,
  togglePostReadLog,
  setPostLike,
  updatePostRequest,
} from "./client";
import { mapDetailToPost, mapListItemToPost } from "./mappers";
import {
  DraftPostListResult,
  CommunityPostListResult,
  PostListPeriod,
  PostListSort,
  UserCategory,
} from "./types";

export async function createPost(
  payload: CreatePostRequest,
  signal?: AbortSignal,
): Promise<CreatePostResponse> {
  return createPostRequest(payload, signal);
}

export async function updatePost(
  postId: string,
  payload: UpdatePostRequest,
  signal?: AbortSignal,
): Promise<CreatePostResponse> {
  return updatePostRequest(postId, payload, signal);
}

export async function fetchCommunityPostList(params?: {
  cursor?: string;
  size?: number;
  period?: PostListPeriod;
  sort?: PostListSort;
  authorId?: string;
  categoryPath?: string;
}): Promise<CommunityPostListResult> {
  const result = await fetchCommunityPosts(params);
  return {
    posts: result.data.content.map(mapListItemToPost),
    nextCursor: result.data.nextCursor,
  };
}

export async function fetchUserPostList(params: {
  userId: string;
  cursor?: string;
  size?: number;
  period?: PostListPeriod;
  sort?: PostListSort;
  categoryId?: string;
}): Promise<CommunityPostListResult> {
  const result = await fetchUserPosts(params);
  return {
    posts: result.data.content.map(mapListItemToPost),
    nextCursor: result.data.nextCursor || undefined,
    hasNext: result.data.hasNext,
  };
}

export async function fetchUserCategories(
  userId: string,
  path?: string,
): Promise<UserCategory[]> {
  const response = await fetchUserCategoriesRequest(userId, path);
  return response.data;
}

export async function fetchPostDetailWithMeta(postId: string): Promise<{
  post: Post;
  isLiked: boolean;
}> {
  const result = await fetchPostDetail(postId);
  return {
    post: mapDetailToPost(result.data),
    isLiked: Boolean(result.data.isLiked),
  };
}

export async function fetchDraftPostList(params?: {
  cursor?: string;
  size?: number;
}): Promise<DraftPostListResult> {
  const result = await fetchDraftPosts(params);
  return {
    drafts: result.data.content,
    nextCursor: result.data.nextCursor,
    hasNext: result.data.hasNext,
    totalCount: result.data.totalCount,
  };
}

export async function fetchDraftPostDetail(postId: string): Promise<{
  post: Post;
  isLiked: boolean;
  categoryPath: string;
}> {
  const result = await fetchDraftDetail(postId);
  const mappedPost = mapDetailToPost(result.data);
  return {
    post: {
      ...mappedPost,
      viewCount: 0,
    },
    isLiked: Boolean(result.data.isLiked),
    categoryPath: result.data.category?.path || "",
  };
}

export async function updatePostLike(
  postId: string,
  likeStatus: "NONE" | "LIKE" | "DISLIKE",
) {
  return setPostLike(postId, likeStatus);
}

export async function updatePostReadLog(postId: string, isRead: boolean) {
  return togglePostReadLog(postId, { isRead });
}

export async function deletePost(postId: string): Promise<void> {
  return deletePostRequest(postId);
}
