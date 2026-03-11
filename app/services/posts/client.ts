import { httpClient } from "@/app/utils/httpClient";
import {
  CreatePostRequest,
  CreatePostResponse,
  UpdatePostRequest,
} from "@/app/types";
import {
  DraftPostListResponse,
  PostDetailResponse,
  PostListPeriod,
  PostListResponse,
  PostListSort,
} from "./types";

export async function createPostRequest(
  payload: CreatePostRequest,
  signal?: AbortSignal,
): Promise<CreatePostResponse> {
  const response = await httpClient("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
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

export async function updatePostRequest(
  postId: string,
  payload: UpdatePostRequest,
  signal?: AbortSignal,
): Promise<CreatePostResponse> {
  const response = await httpClient(`/api/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    signal,
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
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

export async function fetchDraftPosts(params?: {
  cursor?: string;
  size?: number;
}): Promise<DraftPostListResponse> {
  const searchParams = new URLSearchParams();
  if (params && params.cursor !== undefined) searchParams.set("cursor", params.cursor);
  searchParams.set("size", String(params?.size ?? 20));

  const query = searchParams.toString();
  const response = await httpClient(`/api/posts/drafts${query ? `?${query}` : ""}`, {
    method: "GET",
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as DraftPostListResponse;
}

export async function fetchDraftDetail(postId: string): Promise<PostDetailResponse> {
  const response = await httpClient(`/api/posts/drafts/${postId}`, {
    method: "GET",
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as PostDetailResponse;
}

export async function setPostLike(
  postId: string,
  likeStatus: "NONE" | "LIKE" | "DISLIKE",
): Promise<{ status: number; message: string }> {
  const response = await httpClient(`/api/posts/${postId}/like`, {
    method: "POST",
    body: JSON.stringify({ likeStatus }),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as { status: number; message: string };
}

export async function deletePostRequest(
  postId: string,
): Promise<{ status: number; message: string }> {
  const response = await httpClient(`/api/posts/${postId}`, {
    method: "DELETE",
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as { status: number; message: string };
}
