"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Header from "../components/Header";
import { FEED_MODES } from "../constants/feed";
import { useDraftPosts } from "../hooks/useDraftPosts";
import { useUser } from "../hooks/useUser";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DraftPostsPage() {
  const t = useTranslations("DraftsPage");
  const locale = useLocale();
  const router = useRouter();
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const { user, isLoading: isUserLoading } = useUser();
  const {
    drafts,
    errorMessage,
    isLoading,
    isLoadingMore,
    hasNext,
    loadMore,
  } = useDraftPosts({
    enabled: Boolean(user),
    size: 20,
  });

  useEffect(() => {
    const target = loadMoreTriggerRef.current;
    if (!target || !user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        void loadMore();
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, user]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => {}}
        currentMode={FEED_MODES.USER}
        onModeChange={() => {}}
      />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/post/write`)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("newPost")}
          </button>
        </div>

        {isUserLoading ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            {t("loadingUser")}
          </div>
        ) : !user ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t("signInRequired")}</p>
          </div>
        ) : null}

        {user && errorMessage && (
          <div className="mb-4 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
            {errorMessage}
          </div>
        )}

        {user && drafts.length === 0 && !isLoading ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
            {t("empty")}
          </div>
        ) : null}

        {user && drafts.length > 0 && (
          <ul className="space-y-3">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <button
                   type="button"
                   onClick={() => router.push(`/${locale}/post/write?draftId=${draft.id}`)}
                   className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                 >
                  <h2 className="line-clamp-1 text-base font-semibold text-foreground">
                    {draft.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {draft.contentPreview}
                  </p>
                   <p className="mt-3 text-xs text-muted-foreground">
                     {t("updatedAt")}: {formatDateTime(draft.updatedAt)}
                   </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {user && <div ref={loadMoreTriggerRef} className="h-2 w-full" />}

        {user && isLoadingMore && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {t("loadingMore")}
          </div>
        )}

        {user && !hasNext && drafts.length > 0 && !isLoading && !isLoadingMore && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {t("reachedEnd")}
          </div>
        )}
      </main>
    </div>
  );
}
