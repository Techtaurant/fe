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
  return result as CreateCommentResponse;
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
