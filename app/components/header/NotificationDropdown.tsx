"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useNotifications } from "@/app/hooks/useNotifications";
import { resolveNotificationHref } from "@/app/lib/notificationRoute";
import { ALLOWED_HTML_TAGS } from "@/app/constants/markdownAllowedHtml";
import { NotificationListItem } from "@/app/services/notifications";
import { formatDisplayTime } from "@/app/utils";

const notificationSanitizedSchema = {
  ...defaultSchema,
  tagNames: ALLOWED_HTML_TAGS,
  attributes: {
    ...defaultSchema.attributes,
    a: ["href", "title", "target", "rel"],
    div: ["className", "title", ["align", "left", "center", "right"]],
    img: ["src", "width", "height", "alt"],
    span: ["className", "title"],
    p: [["align", "left", "center", "right"]],
    strong: ["className"],
  },
} as const;

function NotificationPayloadPreview({ html }: { html: string }) {
  return (
    <div className="notification-payload max-h-[76px] overflow-hidden text-[13px] leading-[1.45] text-foreground">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, [rehypeSanitize, notificationSanitizedSchema]]}
        components={{
          img: ({ src, alt, ...props }) => {
            if (typeof src !== "string" || src.trim().length === 0) {
              return null;
            }

            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt ?? ""}
                {...props}
              />
            );
          },
        }}
      >
        {html}
      </ReactMarkdown>

      <style jsx global>{`
        .notification-payload > div:first-child {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .notification-payload img {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 9999px;
          object-fit: cover;
          background: var(--muted);
        }

        .notification-payload p,
        .notification-payload div,
        .notification-payload span {
          margin: 0;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .notification-payload a {
          color: inherit;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}

export default function NotificationDropdown() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    hasUnreadNotifications,
    errorMessage,
    hasNext,
    isLoading,
    isLoadingMore,
    isRefreshingReadState,
    loadMore,
    markAllAsRead,
    markNotificationAsRead,
  } = useNotifications({
    enabled: true,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: NotificationListItem) => {
    const href = resolveNotificationHref({
      locale,
      notification,
    });

    if (!href) {
      return;
    }

    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    setIsOpen(false);
    startTransition(() => {
      router.push(href);
    });
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={isOpen ? t("notificationsClose") : t("notificationsOpen")}
      >
        <Bell className="h-5 w-5" />
        {hasUnreadNotifications ? (
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[0_20px_60px_rgba(15,23,42,0.18)] z-[420]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t("notifications")}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasUnreadNotifications
                  ? `${unreadCount}`
                  : "0"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleMarkAllAsRead();
              }}
              disabled={!hasUnreadNotifications || isRefreshingReadState}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notificationsMarkAllRead")}
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("notificationsLoading")}
              </div>
            ) : errorMessage && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {errorMessage}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("notificationsEmpty")}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const href = resolveNotificationHref({
                    locale,
                    notification,
                  });

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        void handleNotificationClick(notification);
                      }}
                      disabled={!href}
                      className={`block w-full px-4 py-3 text-left transition-colors hover:bg-muted/70 disabled:cursor-default ${
                        notification.isRead
                          ? "bg-popover"
                          : "bg-sky-50/70 dark:bg-sky-500/10"
                      }`}
                      aria-label={t("notificationsNavigateLabel")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <span
                            className={`block h-2.5 w-2.5 rounded-full ${
                              notification.isRead ? "bg-transparent" : "bg-sky-500"
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <NotificationPayloadPreview html={notification.payloadHtml} />
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDisplayTime(notification.createdAt, locale)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {hasNext ? (
            <div className="border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  void loadMore();
                }}
                disabled={isLoadingMore}
                className="w-full rounded-xl bg-muted px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? t("notificationsLoading") : t("notificationsLoadMore")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
