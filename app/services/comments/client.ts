import { httpClient } from "@/app/utils/httpClient";
import {
  CreateCommentRequest,
  CreateCommentResponse,
  FetchCommentsRequest,
  FetchCommentsResponse,
} from "./types";

export async function createCommentRequest(
  payload: CreateCommentRequest,
): Promise<CreateCommentResponse> {
  const response = await httpClient("/api/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as CreateCommentResponse | null;
    throw new Error(body?.message || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as CreateCommentResponse;
}

export async function fetchCommentsRequest(
  payload: FetchCommentsRequest,
): Promise<FetchCommentsResponse> {
  const params = new URLSearchParams();
  if (payload.cursor) params.set("cursor", payload.cursor);
  if (payload.size) params.set("size", String(payload.size));
  if (payload.sort) params.set("sort", payload.sort);

  const query = params.toString();
  const response = await httpClient(
    `/open-api/comments/posts/${payload.postId}${query ? `?${query}` : ""}`,
    {
      method: "GET",
    },
  );

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (response.status === 400) {
    const body =
      (await response.json().catch(() => null)) as FetchCommentsResponse | null;
    throw new Error(body?.message || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as FetchCommentsResponse;
}
