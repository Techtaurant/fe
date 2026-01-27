"use client";

import Link from "next/link";
import { FEED_MODES } from "../constants/feed";
import { FeedMode } from "../types";

interface MobileBottomNavProps {
  currentMode?: FeedMode;
  onHomeClick: () => void;
  onModeNavigate: (mode: FeedMode) => void;
}

export default function MobileBottomNav({
  currentMode = FEED_MODES.COMPANY,
  onHomeClick,
  onModeNavigate,
}: MobileBottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[350] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full">
        <div className="bg-background/95 backdrop-blur border-t border-border shadow-lg px-3 py-2">
          <div className="mx-auto max-w-[520px] flex items-center justify-between">
            <button
              type="button"
              onClick={onHomeClick}
              className="flex flex-col items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label="홈"
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
                  d="M3 10.5l9-7 9 7V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
                />
              </svg>
              <span>Home</span>
            </button>

            <Link
              href="/search"
              className="flex flex-col items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label="검색"
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
              <span>Search</span>
            </Link>

            <Link
              // TODO: 게시물 작성 페이지 이동
              href="/"
              className="flex flex-col items-center px-2 py-1"
              aria-label="UI"
            >
              <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
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
            </Link>

            <button
              type="button"
              onClick={() => onModeNavigate(FEED_MODES.COMPANY)}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[11px] transition-colors ${
                currentMode === FEED_MODES.COMPANY
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="기업 블로그"
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
              <span>기업블로그</span>
            </button>

            <button
              type="button"
              onClick={() => onModeNavigate(FEED_MODES.USER)}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[11px] transition-colors ${
                currentMode === FEED_MODES.USER
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="커뮤니티"
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
              <span>커뮤니티</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
