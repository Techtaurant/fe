export type NotificationType =
  | "POST_COMMENT"
  | "COMMENT_REPLY"
  | "FOLLOWER_POST"
  | "FOLLOW";

export type NotificationTargetType = "USER" | "POST" | "COMMENT";

export interface NotificationArgument {
  targetType: NotificationTargetType;
  targetId: string;
}

export interface NotificationListItem {
  id: string;
  type: NotificationType;
  payloadHtml: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  arguments: NotificationArgument[];
}

export interface CursorPageResponse<T> {
  content: T[];
  nextCursor: string | null;
  hasNext: boolean;
  size: number;
}

export interface FetchNotificationsResponse {
  status: number | Record<string, unknown>;
  data: CursorPageResponse<NotificationListItem>;
  message: string;
}

export interface FetchNotificationsRequest {
  cursor?: string;
  size?: number;
}

export interface MarkNotificationsReadRequest {
  notificationIds: string[];
}

export interface MarkNotificationsReadResponse {
  status: number | Record<string, unknown>;
  data: {
    notifications: NotificationListItem[];
  };
  message: string;
}
