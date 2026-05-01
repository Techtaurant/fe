"use client";

import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  fetchNotifications,
  FetchNotificationsResponse,
  markNotificationsRead,
  NotificationListItem,
} from "../services/notifications";
import { queryKeys } from "../lib/queryKeys";

interface UseNotificationsOptions {
  enabled: boolean;
  size?: number;
}

function mergeNotifications(pages: FetchNotificationsResponse[]): NotificationListItem[] {
  const deduped = new Map<string, NotificationListItem>();

  pages
    .flatMap((page) => page.data.content)
    .forEach((notification) => {
      if (!deduped.has(notification.id)) {
        deduped.set(notification.id, notification);
      }
    });

  return Array.from(deduped.values());
}

function updateInfiniteNotifications(
  current:
    | InfiniteData<FetchNotificationsResponse, string | undefined>
    | undefined,
  updatedNotifications: NotificationListItem[],
): InfiniteData<FetchNotificationsResponse, string | undefined> | undefined {
  if (!current) {
    return current;
  }

  const updatedById = new Map(
    updatedNotifications.map((notification) => [notification.id, notification]),
  );

  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      data: {
        ...page.data,
        content: page.data.content.map((notification) => {
          const updated = updatedById.get(notification.id);
          return updated
            ? {
                ...notification,
                ...updated,
              }
            : notification;
        }),
      },
    })),
  };
}

export function useNotifications({
  enabled,
  size = 20,
}: UseNotificationsOptions) {
  const t = useTranslations("Header");
  const queryClient = useQueryClient();
  const queryKey = queryKeys.notifications.list({ size });

  const query = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchNotifications({
        cursor: pageParam,
        size,
      }),
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
  });

  const readMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (notificationIds.length === 0) {
        return [] as NotificationListItem[];
      }

      const result = await markNotificationsRead(notificationIds);
      return result.data.notifications;
    },
    onSuccess: (updatedNotifications) => {
      if (updatedNotifications.length === 0) {
        return;
      }

      queryClient.setQueryData<
        InfiniteData<FetchNotificationsResponse, string | undefined> | undefined
      >(queryKey, (current) =>
        updateInfiniteNotifications(current, updatedNotifications),
      );
    },
  });

  const notifications = useMemo(
    () => mergeNotifications(query.data?.pages ?? []),
    [query.data?.pages],
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications],
  );

  const unreadNotificationIds = useMemo(
    () => unreadNotifications.map((notification) => notification.id),
    [unreadNotifications],
  );

  const loadMore = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return;
    }

    await query.fetchNextPage();
  }, [query]);

  const markAllAsRead = useCallback(async () => {
    if (unreadNotificationIds.length === 0) {
      return [];
    }

    return readMutation.mutateAsync(unreadNotificationIds);
  }, [readMutation, unreadNotificationIds]);

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      const target = notifications.find(
        (notification) => notification.id === notificationId,
      );

      if (!target || target.isRead) {
        return [];
      }

      return readMutation.mutateAsync([notificationId]);
    },
    [notifications, readMutation],
  );

  const errorMessage = (() => {
    if (!query.error) return null;

    const message =
      query.error instanceof Error ? query.error.message : "UNKNOWN_ERROR";

    if (message === "UNAUTHORIZED") {
      return t("notificationsLoginRequired");
    }

    return t("notificationsLoadFailed");
  })();

  return {
    notifications,
    unreadCount: unreadNotifications.length,
    hasUnreadNotifications: unreadNotifications.length > 0,
    errorMessage,
    hasNext: Boolean(query.hasNextPage),
    isLoading: query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    isRefreshingReadState: readMutation.isPending,
    loadMore,
    markAllAsRead,
    markNotificationAsRead,
  };
}
