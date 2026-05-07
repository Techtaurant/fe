import { buildUserPath } from "./userRoute";
import {
  NotificationArgument,
  NotificationListItem,
  NotificationTargetType,
  NotificationType,
} from "../services/notifications";

function findTargetId(
  argumentsList: NotificationArgument[],
  targetType: NotificationTargetType,
): string | null {
  const target = argumentsList.find((argument) => argument.targetType === targetType);
  return target?.targetId ?? null;
}

function buildPostPath(postId: string): string {
  return `/post/${encodeURIComponent(postId.trim())}`;
}

function shouldRouteToPost(type: NotificationType): boolean {
  return type === "POST_COMMENT" || type === "COMMENT_REPLY" || type === "FOLLOWER_POST";
}

export function resolveNotificationHref(params: {
  notification: Pick<NotificationListItem, "type" | "arguments">;
}): string | null {
  const { notification } = params;

  if (notification.type === "FOLLOW") {
    const userId = findTargetId(notification.arguments, "USER");
    return userId ? buildUserPath(userId) : null;
  }

  if (shouldRouteToPost(notification.type)) {
    const postId = findTargetId(notification.arguments, "POST");
    if (!postId) {
      return null;
    }

    const commentId = findTargetId(notification.arguments, "COMMENT");
    const basePath = buildPostPath(postId);

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
