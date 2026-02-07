import { CreatePostRequest, CreatePostResponse, Post } from "@/app/types";
import { createPostRequest, fetchCommunityPosts, fetchPostDetail } from "./client";
import { mapDetailToPost, mapListItemToPost } from "./mappers";
import {
  CommunityPostListResult,
  PostListPeriod,
  PostListSort,
} from "./types";

export async function createPost(
  payload: CreatePostRequest,
): Promise<CreatePostResponse> {
  return createPostRequest(payload);
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
    isLiked: result.data.isLiked,
  };
}
