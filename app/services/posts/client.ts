import { httpClient } from "@/app/utils/httpClient";
import { CreatePostRequest, CreatePostResponse } from "@/app/types";
import {
  PostDetailResponse,
  PostListPeriod,
  PostListResponse,
  PostListSort,
} from "./types";

export async function createPostRequest(
  payload: CreatePostRequest,
): Promise<CreatePostResponse> {
  const response = await httpClient("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as CreatePostResponse | null;
    throw new Error(body?.message || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as CreatePostResponse;
}

export async function fetchCommunityPosts(params?: {
  cursor?: string;
  size?: number;
  period?: PostListPeriod;
  sort?: PostListSort;
}): Promise<PostListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  searchParams.set("size", String(params?.size ?? 20));
  searchParams.set("period", params?.period ?? "ALL");
  searchParams.set("sort", params?.sort ?? "LATEST");

  const response = await httpClient(`/open-api/posts?${searchParams.toString()}`, {
    method: "GET",
  });

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as PostListResponse | null;
    throw new Error(body?.message || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as PostListResponse;
}

export async function fetchPostDetail(postId: string): Promise<PostDetailResponse> {
  const response = await httpClient(`/open-api/posts/${postId}`, {
    method: "GET",
  });

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as PostDetailResponse;
}
