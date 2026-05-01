import {
  fetchNotificationsRequest,
  markNotificationsReadRequest,
} from "./client";
import {
  FetchNotificationsRequest,
  FetchNotificationsResponse,
  MarkNotificationsReadResponse,
} from "./types";

export async function fetchNotifications(
  params?: FetchNotificationsRequest,
): Promise<FetchNotificationsResponse> {
  return fetchNotificationsRequest(params);
}

export async function markNotificationsRead(
  notificationIds: string[],
): Promise<MarkNotificationsReadResponse> {
  return markNotificationsReadRequest({ notificationIds });
}

export * from "./types";
