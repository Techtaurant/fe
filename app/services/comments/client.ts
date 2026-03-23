import { httpClient } from "@/app/utils/httpClient";
import { CommentApiError, ValidationErrors } from "./apiError";
import {
  CreateCommentRequest,
  CreateCommentResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
  UpdateCommentLikeRequest,
  UpdateCommentLikeResponse,
  FetchCommentsRequest,
  FetchCommentsResponse,
  FetchCommentRepliesRequest,
  FetchCommentRepliesResponse,
  ValidationErrorApiResponse,
} from "./types";

function isValidationErrors(
  value: unknown,
): value is ValidationErrors {
  if (typeof value !== "object" || value === null) return false;
  for (const message of Object.values(value as Record<string, unknown>)) {
    if (typeof message !== "string") return false;
  }
  return true;
}

function extractValidationErrors(payload: unknown): ValidationErrors | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const data = (payload as ValidationErrorApiResponse).data;
  if (!data || typeof data !== "object" || data === null) return undefined;
  if (!("errors" in data)) return undefined;
  const errors = data.errors;
  if (!isValidationErrors(errors)) return undefined;
  return errors;
}

function extractApiMessage(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

async function parseJson(response: Response): Promise<unknown> {
  return response.json();
}

export async function createCommentRequest(
  payload: CreateCommentRequest,
): Promise<CreateCommentResponse> {
  const response = await httpClient("/api/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new CommentApiError("UNAUTHORIZED", {
      status: response.status,
    });
  }

  if (response.status === 403) {
    throw new CommentApiError("FORBIDDEN", {
      status: response.status,
    });
  }

  if (response.status === 404) {
    throw new CommentApiError("NOT_FOUND", {
      status: response.status,
    });
  }

  if (response.status === 400) {
    const body = (await parseJson(response).catch(() => null)) as
      | ValidationErrorApiResponse
      | CreateCommentResponse
      | null;
    throw new CommentApiError("BAD_REQUEST", {
      status: response.status,
      validationErrors: extractValidationErrors(body),
      message: extractApiMessage(body) || "BAD_REQUEST",
    });
  }

  if (!response.ok) {
    throw new CommentApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  const result = await parseJson(response);
  return result as CreateCommentResponse;
}

export async function updateCommentRequest(
  commentId: string,
  payload: UpdateCommentRequest,
): Promise<UpdateCommentResponse> {
  const response = await httpClient(`/api/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new CommentApiError("UNAUTHORIZED", {
      status: response.status,
    });
  }

  if (response.status === 403) {
    throw new CommentApiError("FORBIDDEN", {
      status: response.status,
    });
  }

  if (response.status === 404) {
    throw new CommentApiError("NOT_FOUND", {
      status: response.status,
    });
  }

  if (response.status === 410) {
    throw new CommentApiError("GONE", {
      status: response.status,
    });
  }

  if (response.status === 400) {
    const body = (await parseJson(response).catch(() => null)) as
      | ValidationErrorApiResponse
      | UpdateCommentResponse
      | null;
    throw new CommentApiError("BAD_REQUEST", {
      status: response.status,
      validationErrors: extractValidationErrors(body),
      message: "BAD_REQUEST",
    });
  }

  if (!response.ok) {
    throw new CommentApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  const result = await parseJson(response);
  return result as UpdateCommentResponse;
}

export async function deleteCommentRequest(commentId: string): Promise<void> {
  const response = await httpClient(`/api/comments/${commentId}`, {
    method: "DELETE",
  });

  if (response.status === 401) {
    throw new CommentApiError("UNAUTHORIZED", {
      status: response.status,
    });
  }

  if (response.status === 403) {
    throw new CommentApiError("FORBIDDEN", {
      status: response.status,
    });
  }

  if (response.status === 404) {
    throw new CommentApiError("NOT_FOUND", {
      status: response.status,
    });
  }

  if (response.status === 410) {
    throw new CommentApiError("GONE", {
      status: response.status,
    });
  }

  if (!response.ok) {
    throw new CommentApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  if (response.status === 204) {
    return;
  }

  await response.text();
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
    throw new CommentApiError("UNAUTHORIZED", {
      status: response.status,
    });
  }

  if (response.status === 404) {
    throw new CommentApiError("NOT_FOUND", {
      status: response.status,
    });
  }

  if (response.status === 400) {
    const body =
      (await parseJson(response).catch(() => null)) as
        | ValidationErrorApiResponse
        | FetchCommentsResponse
        | null;
    throw new CommentApiError("BAD_REQUEST", {
      status: response.status,
      validationErrors: extractValidationErrors(body),
      message: "BAD_REQUEST",
    });
  }

  if (!response.ok) {
    throw new CommentApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  const result = await parseJson(response);
  return result as FetchCommentsResponse;
}

export async function fetchCommentRepliesRequest(
  payload: FetchCommentRepliesRequest,
): Promise<FetchCommentRepliesResponse> {
  const params = new URLSearchParams();
  if (payload.cursor) params.set("cursor", payload.cursor);
  if (payload.size) params.set("size", String(payload.size));
  if (payload.sort) params.set("sort", payload.sort);

  const query = params.toString();
  const response = await httpClient(
    `/open-api/comments/${payload.commentId}/replies${query ? `?${query}` : ""}`,
    {
      method: "GET",
    },
  );

  if (response.status === 404) {
    throw new CommentApiError("NOT_FOUND", {
      status: response.status,
    });
  }

  if (response.status === 400) {
    const body =
      (await parseJson(response).catch(() => null)) as
        | ValidationErrorApiResponse
        | FetchCommentRepliesResponse
        | null;
    throw new CommentApiError("BAD_REQUEST", {
      status: response.status,
      validationErrors: extractValidationErrors(body),
      message: "BAD_REQUEST",
    });
  }

  if (!response.ok) {
    throw new CommentApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  const result = await parseJson(response);
  return result as FetchCommentRepliesResponse;
}

export async function updateCommentLikeRequest(
  commentId: string,
  payload: UpdateCommentLikeRequest,
): Promise<UpdateCommentLikeResponse> {
  const response = await httpClient(`/api/comments/${commentId}/like`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new CommentApiError("UNAUTHORIZED", {
      status: response.status,
    });
  }

  if (response.status === 403) {
    throw new CommentApiError("FORBIDDEN", {
      status: response.status,
    });
  }

  if (response.status === 404) {
    throw new CommentApiError("NOT_FOUND", {
      status: response.status,
    });
  }

  if (response.status === 400) {
    const body = (await parseJson(response).catch(() => null)) as
      | ValidationErrorApiResponse
      | UpdateCommentLikeResponse
      | null;
    throw new CommentApiError("BAD_REQUEST", {
      status: response.status,
      validationErrors: extractValidationErrors(body),
      message: "BAD_REQUEST",
    });
  }

  if (!response.ok) {
    throw new CommentApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  const result = await parseJson(response);
  return result as UpdateCommentLikeResponse;
}
