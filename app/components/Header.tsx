"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "../hooks/useUser";
import { FEED_MODES } from "../constants/feed";
import { FeedMode } from "../types";
import ThemeModeDropdown from "./ThemeDropdown";
import MobileBottomNav from "./BottomNav";

interface HeaderProps {
  onMenuClick?: () => void;
  currentMode?: FeedMode;
  onModeChange?: (mode: FeedMode) => void;
}

export default function Header({
  onMenuClick,
  currentMode = FEED_MODES.COMPANY,
  onModeChange,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, refetch } = useUser();
  const isLoggedIn = !!user;
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleModeNavigate = (mode: FeedMode) => {
    onModeChange?.(mode);
    router.push(`/?mode=${mode}`);
  };

  const handleAuthClick = () => {
    if (!isLoggedIn) {
      // 백엔드로 직접 요청 (쿠키가 올바른 도메인에 설정됨)
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      console.warn(
        "Redirecting to OAuth URL:",
        `${apiBaseUrl}/oauth2/authorization/google`,
      );
      window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleLogout = async () => {
    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setIsDropdownOpen(false);
      refetch();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const handleLogoClick = () => {
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-[300] bg-background border-b border-border">
      <div className="h-16 max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* 햄버거 메뉴 버튼 (모바일만) */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors duration-200"
          aria-label="메뉴 열기"
        >
          <svg
            className="w-6 h-6 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo & Nav */}
        <div className="flex items-center gap-6 md:gap-8 flex-1 md:flex-initial justify-center md:justify-start">
          <h1
            onClick={handleLogoClick}
            className="font-[family-name:var(--font-montserrat)] font-bold text-lg md:text-2xl tracking-tight
                     cursor-pointer text-foreground transition-opacity duration-200
                     hover:opacity-80"
          >
            Techtaurant
          </h1>

          {/* Mode Switcher (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleModeNavigate(FEED_MODES.COMPANY)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  currentMode === FEED_MODES.COMPANY
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              기업 블로그
            </button>
            <button
              onClick={() => handleModeNavigate(FEED_MODES.USER)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  currentMode === FEED_MODES.USER
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              커뮤니티
            </button>
          </div>
        </div>

        {/* Search Bar (데스크탑만) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-[600px] mx-8 justify-center"
        >
          <div className="relative w-full">
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted border-none rounded-full
                       py-2 pl-10 pr-4 text-sm text-foreground
                       transition-colors duration-200
                       focus:bg-muted/70 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
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
          </div>
        </form>

        <div className="flex items-center gap-2">
          {/* Write Post Button (로그인 사용자만) */}
          {isLoggedIn && !isLoading && (
            <button
              onClick={() => router.push("/post/write")}
              className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 rounded-full
                     bg-secondary text-secondary-foreground text-sm font-medium
                     transition-colors duration-200
                     hover:bg-secondary/90"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>게시물 작성</span>
            </button>
          )}

          {/* Auth Button / Profile */}
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          ) : isLoggedIn && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleAuthClick}
                className="flex items-center gap-2 p-1 rounded-full
                       transition-opacity duration-200
                       hover:opacity-80"
              >
                {user.profileImageUrl ? (
                  <Image
                    src={user.profileImageUrl}
                    alt={user.name || "프로필"}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {user.name?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
                <span className="hidden md:inline text-sm font-medium text-foreground">
                  {user.name}
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-md shadow-lg border border-border py-1 z-[400]">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleAuthClick}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full
                     bg-primary text-primary-foreground text-sm font-medium
                     transition-colors duration-200
                     hover:bg-primary/90"
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden md:inline">로그인</span>
            </button>
          )}

          <ThemeModeDropdown />
        </div>
      </div>

      <MobileBottomNav
        currentMode={currentMode}
        onHomeClick={handleLogoClick}
        onModeNavigate={handleModeNavigate}
      />
    </header>
  );
}
