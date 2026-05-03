import { buildLocalizedUserPath } from "./userRoute";
import {
  NotificationArgument,
  NotificationListItem,
  NotificationTargetType,
  NotificationType,
} from "../services/notifications";

function encodePathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

function findTargetId(
  argumentsList: NotificationArgument[],
  targetType: NotificationTargetType,
): string | null {
  const target = argumentsList.find((argument) => argument.targetType === targetType);
  return target?.targetId ?? null;
}

function buildLocalizedPostPath(locale: string, postId: string): string {
  return `/${encodePathSegment(locale)}/post/${encodePathSegment(postId)}`;
}

function shouldRouteToPost(type: NotificationType): boolean {
  return type === "POST_COMMENT" || type === "COMMENT_REPLY" || type === "FOLLOWER_POST";
}

export function resolveNotificationHref(params: {
  locale: string;
  notification: Pick<NotificationListItem, "type" | "arguments">;
}): string | null {
  const { locale, notification } = params;

  if (notification.type === "FOLLOW") {
    const userId = findTargetId(notification.arguments, "USER");
    return userId ? buildLocalizedUserPath(locale, userId) : null;
  }

  if (shouldRouteToPost(notification.type)) {
    const postId = findTargetId(notification.arguments, "POST");
    if (!postId) {
      return null;
    }

    const commentId = findTargetId(notification.arguments, "COMMENT");
    const basePath = buildLocalizedPostPath(locale, postId);

    if (!commentId) {
      return basePath;
    }

    const searchParams = new URLSearchParams({
      commentId,
    });

    return `${basePath}?${searchParams.toString()}`;
  }

  return null;
}
