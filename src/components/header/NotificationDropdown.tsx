"use client";

import { Bell, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useRouter } from "../../i18n/navigation";
import { useNotifications } from "../../hooks/useNotifications";
import { resolveNotificationHref } from "../../lib/notificationRoute";
import { ALLOWED_HTML_TAGS } from "../../constants/markdownAllowedHtml";
import { NotificationListItem } from "../../services/notifications";
import { formatDisplayTime } from "../../utils";

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

function stripNotificationImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, "").trim();
}

function NotificationPayloadPreview({
  html,
  thumbnailUrl,
}: {
  html: string;
  thumbnailUrl?: string | null;
}) {
  const normalizedThumbnailUrl =
    typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : "";
  const hasThumbnail = normalizedThumbnailUrl.length > 0;
  const markdownSource = hasThumbnail ? stripNotificationImages(html) : html;

  return (
    <div className="notification-payload flex max-h-[72px] items-start gap-2 overflow-hidden text-[12.5px] leading-[1.5] text-foreground">
      {hasThumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={normalizedThumbnailUrl}
          alt=""
          className="notification-payload-thumbnail"
        />
      ) : null}

      <div className="notification-payload-body min-w-0 flex-1">
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
          {markdownSource}
        </ReactMarkdown>
      </div>

      <style jsx global>{`
        .notification-payload-thumbnail {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 9999px;
          object-fit: cover;
          background: var(--muted);
        }

        .notification-payload-body > div:first-child {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .notification-payload-body > div:first-child > :not(img) {
          flex: 1 1 auto;
          min-width: 0;
        }

        .notification-payload-body img {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 9999px;
          object-fit: cover;
          background: var(--muted);
        }

        .notification-payload-body p,
        .notification-payload-body div,
        .notification-payload-body span {
          margin: 0;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .notification-payload-body a {
          color: inherit;
          text-decoration: none;
        }

        .notification-payload-body strong {
          font-weight: 600;
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
    listEnabled: isOpen,
  });

  const unreadBadgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

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
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          isOpen
            ? "border-border bg-muted/80 text-foreground"
            : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
        }`}
        aria-label={isOpen ? t("notificationsClose") : t("notificationsOpen")}
      >
        <Bell className="h-[17px] w-[17px]" strokeWidth={2.1} />
        {hasUnreadNotifications ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background">
            {unreadBadgeLabel}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.625rem)] z-[420] w-[338px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[28px] border border-border/80 bg-background text-foreground shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between border-b border-border/70 px-4 pb-3 pt-4">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                {t("notifications")}
              </p>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleMarkAllAsRead();
              }}
              disabled={!hasUnreadNotifications || isRefreshingReadState}
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("notificationsMarkAllRead")}
            </button>
          </div>

          <div className="max-h-[372px] overflow-y-auto px-2 pb-3 pt-2">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                {t("notificationsLoading")}
              </div>
            ) : errorMessage && notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                {errorMessage}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                {t("notificationsEmpty")}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
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
                      className="group block w-full rounded-[18px] px-0 py-1 text-left transition-colors focus-visible:outline-none disabled:cursor-default"
                      aria-label={t("notificationsNavigateLabel")}
                    >
                      <div
                        className={`flex items-start gap-3 rounded-[16px] px-3 py-2 transition-colors group-hover:bg-muted/50 group-focus-visible:bg-muted/60 ${
                          notification.isRead ? "bg-transparent" : "bg-muted/25"
                        }`}
                      >
                        <div className="relative min-w-0 flex-1">
                          {!notification.isRead ? (
                            <span className="absolute -left-3 top-1.5 block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          ) : null}
                          <NotificationPayloadPreview
                            html={notification.payloadHtml}
                            thumbnailUrl={notification.thumbnailUrl}
                          />
                          <p className="mt-2 text-[11px] font-medium text-muted-foreground">
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
            <div className="border-t border-border/70 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  void loadMore();
                }}
                disabled={isLoadingMore}
                className="mx-auto inline-flex min-w-[118px] items-center justify-center gap-1 rounded-full border border-border/80 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? t("notificationsLoading") : t("notificationsLoadMore")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
