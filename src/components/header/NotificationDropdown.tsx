'use client';

import { Bell, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { startTransition, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

import { ALLOWED_HTML_TAGS } from '../../constants/markdownAllowedHtml';
import { useNotifications } from '../../hooks/useNotifications';
import { useRouter } from '../../i18n/navigation';
import { resolveNotificationHref } from '../../lib/notificationRoute';
import { NotificationListItem } from '../../services/notifications';
import { formatDisplayTime } from '../../utils';

const notificationSanitizedSchema = {
  ...defaultSchema,
  tagNames: ALLOWED_HTML_TAGS,
  attributes: {
    ...defaultSchema.attributes,
    a: ['href', 'title', 'target', 'rel'],
    div: ['className', 'title', ['align', 'left', 'center', 'right']],
    img: ['src', 'width', 'height', 'alt'],
    span: ['className', 'title'],
    p: [['align', 'left', 'center', 'right']],
    strong: ['className'],
  },
} as const;

function stripNotificationImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, '').trim();
}

function NotificationPayloadPreview({
  html,
  thumbnailUrl,
}: {
  html: string;
  thumbnailUrl?: string | null;
}) {
  const normalizedThumbnailUrl = typeof thumbnailUrl === 'string' ? thumbnailUrl.trim() : '';
  const hasThumbnail = normalizedThumbnailUrl.length > 0;
  const markdownSource = hasThumbnail ? stripNotificationImages(html) : html;

  return (
    <div className="notification-payload text-foreground flex max-h-[72px] items-start gap-2 overflow-hidden text-[12.5px] leading-[1.5]">
      {hasThumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={normalizedThumbnailUrl} alt="" className="notification-payload-thumbnail" />
      ) : null}

      <div className="notification-payload-body min-w-0 flex-1">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, [rehypeSanitize, notificationSanitizedSchema]]}
          components={{
            img: ({ src, alt, ...props }) => {
              if (typeof src !== 'string' || src.trim().length === 0) {
                return null;
              }

              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={alt ?? ''} {...props} />
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
  const t = useTranslations('Header');
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

  const unreadBadgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: NotificationListItem) => {
    const href = resolveNotificationHref({
      notification,
    });

    if (!href) {
      return;
    }

    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
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
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          isOpen
            ? 'border-border bg-muted/80 text-foreground'
            : 'border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground'
        }`}
        aria-label={isOpen ? t('notificationsClose') : t('notificationsOpen')}
      >
        <Bell className="h-[17px] w-[17px]" strokeWidth={2.1} />
        {hasUnreadNotifications ? (
          <span className="bg-primary text-primary-foreground ring-background absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ring-2">
            {unreadBadgeLabel}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="border-border/80 bg-background text-foreground absolute top-[calc(100%+0.625rem)] right-0 z-[420] w-[338px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[28px] border shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="border-border/70 flex items-center justify-between border-b px-4 pt-4 pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <p className="text-foreground truncate text-[15px] font-semibold tracking-[-0.01em]">
                {t('notifications')}
              </p>
              <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold">
                {unreadCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleMarkAllAsRead();
              }}
              disabled={!hasUnreadNotifications || isRefreshingReadState}
              className="text-muted-foreground hover:bg-muted/70 hover:text-foreground rounded-full px-2 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('notificationsMarkAllRead')}
            </button>
          </div>

          <div className="max-h-[372px] overflow-y-auto px-2 pt-2 pb-3">
            {isLoading ? (
              <div className="text-muted-foreground px-4 py-12 text-center text-sm">
                {t('notificationsLoading')}
              </div>
            ) : errorMessage && notifications.length === 0 ? (
              <div className="text-muted-foreground px-4 py-12 text-center text-sm">
                {errorMessage}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-muted-foreground px-4 py-12 text-center text-sm">
                {t('notificationsEmpty')}
              </div>
            ) : (
              <div className="divide-border/60 divide-y">
                {notifications.map((notification) => {
                  const href = resolveNotificationHref({
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
                      aria-label={t('notificationsNavigateLabel')}
                    >
                      <div
                        className={`group-hover:bg-muted/50 group-focus-visible:bg-muted/60 flex items-start gap-3 rounded-[16px] px-3 py-2 transition-colors ${
                          notification.isRead ? 'bg-transparent' : 'bg-muted/25'
                        }`}
                      >
                        <div className="relative min-w-0 flex-1">
                          {!notification.isRead ? (
                            <span className="absolute top-1.5 -left-3 block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          ) : null}
                          <NotificationPayloadPreview
                            html={notification.payloadHtml}
                            thumbnailUrl={notification.thumbnailUrl}
                          />
                          <p className="text-muted-foreground mt-2 text-[11px] font-medium">
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
            <div className="border-border/70 border-t px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  void loadMore();
                }}
                disabled={isLoadingMore}
                className="border-border/80 bg-background text-foreground hover:bg-muted/60 mx-auto inline-flex min-w-[118px] items-center justify-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? t('notificationsLoading') : t('notificationsLoadMore')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
