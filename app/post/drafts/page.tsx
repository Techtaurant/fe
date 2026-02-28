"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { FEED_MODES } from "@/app/constants/feed";
import { useDraftPosts } from "@/app/hooks/useDraftPosts";
import { useUser } from "@/app/hooks/useUser";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DraftPostsPage() {
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
            <h1 className="text-2xl font-bold text-foreground">내 임시글</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              임시 저장한 게시물을 수정하거나 발행할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/post/write")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            새 글 작성
          </button>
        </div>

        {isUserLoading ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            사용자 정보를 불러오는 중입니다.
          </div>
        ) : !user ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">로그인 후 임시글을 조회할 수 있습니다.</p>
          </div>
        ) : null}

        {user && errorMessage && (
          <div className="mb-4 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
            {errorMessage}
          </div>
        )}

        {user && drafts.length === 0 && !isLoading ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
            임시 저장한 게시물이 없습니다.
          </div>
        ) : null}

        {user && drafts.length > 0 && (
          <ul className="space-y-3">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/post/write?draftId=${draft.id}`)}
                  className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <h2 className="line-clamp-1 text-base font-semibold text-foreground">
                    {draft.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {draft.contentPreview}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    최종 수정일: {formatDateTime(draft.updatedAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {user && <div ref={loadMoreTriggerRef} className="h-2 w-full" />}

        {user && isLoadingMore && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            임시글을 더 불러오는 중입니다...
          </div>
        )}

        {user && !hasNext && drafts.length > 0 && !isLoading && !isLoadingMore && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            마지막 임시글까지 모두 불러왔습니다.
          </div>
        )}
      </main>
    </div>
  );
}
