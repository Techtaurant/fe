import {
  fetchNotificationsRequest,
  fetchUnreadNotificationCountRequest,
  markNotificationsReadRequest,
} from "./client";
import {
  FetchNotificationsRequest,
  FetchNotificationsResponse,
  FetchUnreadNotificationCountResponse,
  MarkNotificationsReadResponse,
} from "./types";

function normalizeUnreadNotificationCount(
  response: FetchUnreadNotificationCountResponse,
): number {
  const { data } = response;

  if (typeof data === "number") {
    return data;
  }

  if (typeof data?.unreadCount === "number") {
    return data.unreadCount;
  }

  if (typeof data?.count === "number") {
    return data.count;
  }

  return 0;
}

export async function fetchNotifications(
  params?: FetchNotificationsRequest,
): Promise<FetchNotificationsResponse> {
  return fetchNotificationsRequest(params);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const response = await fetchUnreadNotificationCountRequest();
  return normalizeUnreadNotificationCount(response);
}

export async function markNotificationsRead(
  notificationIds: string[],
): Promise<MarkNotificationsReadResponse> {
  return markNotificationsReadRequest({ notificationIds });
}

export * from "./types";
