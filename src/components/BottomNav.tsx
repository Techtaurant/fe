"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FEED_MODES } from "../constants/feed";
import { FeedMode } from "../types";

interface MobileBottomNavProps {
  currentMode?: FeedMode;
  onMyPostsClick: () => void;
  onModeNavigate: (mode: FeedMode) => void;
  onWritePost: () => void;
}

export default function MobileBottomNav({
  currentMode = FEED_MODES.COMPANY,
  onMyPostsClick,
  onModeNavigate,
  onWritePost,
}: MobileBottomNavProps) {
  const t = useTranslations("BottomNav");
  const locale = useLocale();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[350] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full">
        <div className="bg-background/95 backdrop-blur border-t border-border shadow-lg px-3 py-2">
          <div className="mx-auto max-w-[520px] flex items-center justify-between">
            <button
              type="button"
              onClick={() => onModeNavigate(FEED_MODES.COMPANY)}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[11px] transition-colors ${
                currentMode === FEED_MODES.COMPANY
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={t("companyBlogs")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7a2 2 0 012-2h8a2 2 0 012 2v12H6a2 2 0 01-2-2V7zM16 9h2a2 2 0 012 2v8a2 2 0 01-2 2h-2V9z"
                />
              </svg>
              <span>{t("companyBlogs")}</span>
            </button>

            <button
              type="button"
              onClick={() => onModeNavigate(FEED_MODES.USER)}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[11px] transition-colors ${
                currentMode === FEED_MODES.USER
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={t("community")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m14-8a4 4 0 10-8 0 4 4 0 008 0zm6 8v-2a4 4 0 00-3-3.87"
                />
              </svg>
              <span>{t("community")}</span>
            </button>

            <button
              type="button"
              onClick={onWritePost}
              className="flex flex-col items-center px-2 py-1"
              aria-label={t("newPost")}
            >
              <div className="w-11 h-11 rounded-full bg-comment-submit-button text-white flex items-center justify-center shadow-md transform-gpu transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-comment-submit-button-hover hover:shadow-xl hover:scale-105 active:scale-[0.97]">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v14m7-7H5"
                  />
                </svg>
              </div>
            </button>

            <Link
              href={`/${locale}/search`}
              className="flex flex-col items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("search")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>{t("search")}</span>
            </Link>

            <button
              type="button"
              onClick={onMyPostsClick}
              className="flex flex-col items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("myPosts")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 4a2 2 0 012 2v12a2 2 0 01-2 2h-1l-1 3H9l-1-3H5a2 2 0 01-2-2V6a2 2 0 012-2h11zm-5.5 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
                />
              </svg>
              <span>{t("myPosts")}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
