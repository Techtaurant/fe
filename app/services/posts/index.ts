import {
  CreatePostRequest,
  CreatePostResponse,
  Post,
  UpdatePostRequest,
} from "@/app/types";
import {
  createPostRequest,
  fetchDraftDetail,
  fetchDraftPosts,
  fetchCommunityPosts,
  fetchPostDetail,
  setPostLike,
  updatePostRequest,
} from "./client";
import { mapDetailToPost, mapListItemToPost } from "./mappers";
import {
  DraftPostListResult,
  CommunityPostListResult,
  PostListPeriod,
  PostListSort,
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
}): Promise<CommunityPostListResult> {
  const result = await fetchCommunityPosts(params);
  return {
    posts: result.data.content.map(mapListItemToPost),
    nextCursor: result.data.nextCursor,
  };
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
