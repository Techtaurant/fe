import { httpClient } from "../../../utils/httpClient";
import { BanApiError } from "./apiError";
import { BanUserResponse, FetchMyBansResponse } from "./types";

async function parseJson(response: Response): Promise<unknown> {
  return response.json();
}

function extractMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

export async function banUserRequest(targetUserId: string): Promise<BanUserResponse> {
  const response = await httpClient(`/api/users/${targetUserId}/ban`, {
    method: "POST",
  });

  if (response.status === 401) {
    throw new BanApiError("UNAUTHORIZED", { status: response.status });
  }

  if (response.status === 400) {
    const body = await parseJson(response).catch(() => null);
    throw new BanApiError("BAD_REQUEST", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (response.status === 409) {
    const body = await parseJson(response).catch(() => null);
    throw new BanApiError("CONFLICT", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (!response.ok) {
    throw new BanApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  const result = await parseJson(response);
  return result as BanUserResponse;
}

export async function fetchMyBansRequest(): Promise<FetchMyBansResponse> {
  const response = await httpClient("/api/users/me/bans", {
    method: "GET",
  });

  if (response.status === 401) {
    throw new BanApiError("UNAUTHORIZED", { status: response.status });
  }

  if (!response.ok) {
    throw new BanApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  const result = await parseJson(response);
  return result as FetchMyBansResponse;
}

export async function unbanUserRequest(targetUserId: string): Promise<void> {
  const response = await httpClient(`/api/users/${targetUserId}/ban`, {
    method: "DELETE",
  });

  if (response.status === 401) {
    throw new BanApiError("UNAUTHORIZED", { status: response.status });
  }

  if (response.status === 400) {
    const body = await parseJson(response).catch(() => null);
    throw new BanApiError("BAD_REQUEST", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (response.status === 404) {
    const body = await parseJson(response).catch(() => null);
    throw new BanApiError("NOT_FOUND", {
      status: response.status,
      message: extractMessage(body),
    });
  }

  if (!response.ok) {
    throw new BanApiError("HTTP_ERROR", {
      status: response.status,
      message: `HTTP_${response.status}`,
    });
  }

  if (response.status === 204) {
    return;
  }

  await response.text();
}
