import { httpClient } from "@/app/utils/httpClient";
import {
  FetchNotificationsRequest,
  FetchNotificationsResponse,
  FetchUnreadNotificationCountResponse,
  MarkNotificationsReadRequest,
  MarkNotificationsReadResponse,
} from "./types";

function extractMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

async function parseJson(response: Response): Promise<unknown> {
  return response.json();
}

function buildNotificationsPath(params?: FetchNotificationsRequest): string {
  const searchParams = new URLSearchParams();

  if (params?.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  if (typeof params?.size === "number") {
    searchParams.set("size", String(params.size));
  }

  const query = searchParams.toString();
  return query ? `/api/notifications?${query}` : "/api/notifications";
}

export async function fetchNotificationsRequest(
  params?: FetchNotificationsRequest,
): Promise<FetchNotificationsResponse> {
  const response = await httpClient(buildNotificationsPath(params), {
    method: "GET",
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 400) {
    const body = await parseJson(response).catch(() => null);
    throw new Error(extractMessage(body) || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  const result = await parseJson(response);
  return result as FetchNotificationsResponse;
}

export async function fetchUnreadNotificationCountRequest(): Promise<FetchUnreadNotificationCountResponse> {
  const response = await httpClient("/api/notifications/unread-count", {
    method: "GET",
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 400) {
    const body = await parseJson(response).catch(() => null);
    throw new Error(extractMessage(body) || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  const result = await parseJson(response);
  return result as FetchUnreadNotificationCountResponse;
}

export async function markNotificationsReadRequest(
  payload: MarkNotificationsReadRequest,
): Promise<MarkNotificationsReadResponse> {
  const response = await httpClient("/api/notifications/read", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 400) {
    const body = await parseJson(response).catch(() => null);
    throw new Error(extractMessage(body) || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  const result = await parseJson(response);
  return result as MarkNotificationsReadResponse;
}
