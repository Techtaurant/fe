import { httpClient } from "@/app/utils/httpClient";
import { CommentApiError, ValidationErrors } from "./apiError";
import {
  CreateCommentRequest,
  CreateCommentResponse,
  FetchCommentsRequest,
  FetchCommentsResponse,
  ValidationErrorApiResponse,
} from "./types";

function isValidationErrors(
  value: unknown,
): value is ValidationErrors {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every((message) => typeof message === "string");
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

  if (response.status === 404) {
    throw new CommentApiError("NOT_FOUND", {
      status: response.status,
    });
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as
      | ValidationErrorApiResponse
      | CreateCommentResponse
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
      (await response.json().catch(() => null)) as
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

  return (await response.json()) as FetchCommentsResponse;
}
