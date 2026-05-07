import { httpClient } from "../../../utils/httpClient";
import { FollowApiError } from "./apiError";
import {
  FollowCountsResponse,
  FollowUserResponse,
  FollowUsersListResponse,
} from "./types";

async function parseJson(response: Response): Promise<unknown> {
  return response.json();
}

function extractMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

function throwHttpError(response: Response): never {
  throw new FollowApiError("HTTP_ERROR", {
    status: response.status,
    message: `HTTP_${response.status}`,
  });
}

export async function followUserRequest(targetUserId: string): Promise<FollowUserResponse> {
  const response = await httpClient(`/api/users/${targetUserId}/follow`, {
    method: "POST",
  });

  if (response.status === 401) {
    throw new FollowApiError("UNAUTHORIZED", { status: response.status });
  }

  if (response.status === 400) {
    const body = await parseJson(response).catch(() => null);
    throw new FollowApiError("BAD_REQUEST", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (response.status === 404) {
    const body = await parseJson(response).catch(() => null);
    throw new FollowApiError("NOT_FOUND", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (response.status === 409) {
    const body = await parseJson(response).catch(() => null);
    throw new FollowApiError("CONFLICT", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (!response.ok) {
    throwHttpError(response);
  }

  const result = await parseJson(response);
  return result as FollowUserResponse;
}

export async function unfollowUserRequest(targetUserId: string): Promise<void> {
  const response = await httpClient(`/api/users/${targetUserId}/follow`, {
    method: "DELETE",
  });

  if (response.status === 401) {
    throw new FollowApiError("UNAUTHORIZED", { status: response.status });
  }

  if (response.status === 400) {
    const body = await parseJson(response).catch(() => null);
    throw new FollowApiError("BAD_REQUEST", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (response.status === 404) {
    const body = await parseJson(response).catch(() => null);
    throw new FollowApiError("NOT_FOUND", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (!response.ok) {
    throwHttpError(response);
  }
}

export async function fetchUserFollowCountsRequest(userId: string): Promise<FollowCountsResponse> {
  const response = await httpClient(`/open-api/users/${userId}/follow-counts`, {
    method: "GET",
  });

  if (response.status === 404) {
    const body = await parseJson(response).catch(() => null);
    throw new FollowApiError("NOT_FOUND", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (!response.ok) {
    throwHttpError(response);
  }

  const result = await parseJson(response);
  return result as FollowCountsResponse;
}

export async function fetchUserFollowersRequest(userId: string): Promise<FollowUsersListResponse> {
  const response = await httpClient(`/open-api/users/${userId}/followers`, {
    method: "GET",
  });

  if (response.status === 404) {
    const body = await parseJson(response).catch(() => null);
    throw new FollowApiError("NOT_FOUND", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (!response.ok) {
    throwHttpError(response);
  }

  const result = await parseJson(response);
  return result as FollowUsersListResponse;
}

export async function fetchUserFollowingsRequest(userId: string): Promise<FollowUsersListResponse> {
  const response = await httpClient(`/open-api/users/${userId}/followings`, {
    method: "GET",
  });

  if (response.status === 404) {
    const body = await parseJson(response).catch(() => null);
    throw new FollowApiError("NOT_FOUND", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (!response.ok) {
    throwHttpError(response);
  }

  const result = await parseJson(response);
  return result as FollowUsersListResponse;
}
