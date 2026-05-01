"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FileText, LogOut, PenLine, Settings } from "lucide-react";
import { useUser } from "../hooks/useUser";
import { buildLogoutUrl, redirectToOAuthLogin } from "../lib/authRedirect";
import { queryKeys } from "../lib/queryKeys";
import { buildLocalizedUserPath } from "../lib/userRoute";
import { FEED_MODES } from "../constants/feed";
import { FeedMode } from "../types";
import MobileBottomNav from "./BottomNav";
import NotificationDropdown from "./header/NotificationDropdown";
import PrimaryRectButton from "./ui/PrimaryRectButton";
import SearchInput from "./SearchInput";
import SettingsModal from "./settings/SettingsModal";

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
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isSettingsModalOpen = searchParams.get("settings") === "open";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user, isLoading } = useUser();
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

  const replaceSettingsQueryState = (open: boolean) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (open) {
      nextParams.set("settings", "open");
    } else {
      nextParams.delete("settings");
    }
    const nextQuery = nextParams.toString();
    const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextPath, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    router.push(`/${locale}/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleModeNavigate = (mode: FeedMode) => {
    onModeChange?.(mode);
    router.push(`/${locale}?mode=${mode}`);
  };

  const handleAuthClick = () => {
    if (!isLoggedIn) {
      redirectToOAuthLogin({ redirectPath: `/${locale}` });
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleWritePostClick = () => {
    if (isLoggedIn) {
      router.push(`/${locale}/post/write`);
      return;
    }
    redirectToOAuthLogin({ redirectPath: `/${locale}/post/write` });
  };

  const handleMyPostsMenuClick = () => {
    if (!user) {
      redirectToOAuthLogin({ redirectPath: `/${locale}` });
      return;
    }

    router.push(buildLocalizedUserPath(locale, user.id));
    setIsDropdownOpen(false);
  };

  const handleSettingsMenuClick = () => {
    replaceSettingsQueryState(true);
    setIsDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch(buildLogoutUrl(), {
        method: "POST",
        credentials: "include",
      });
      setIsDropdownOpen(false);
      queryClient.setQueryData(queryKeys.user.me(), null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.user.all,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLogoClick = () => {
    window.location.href = `/${locale}`;
  };

  const handleMyPostsClick = () => {
    if (!user) {
      redirectToOAuthLogin({ redirectPath: `/${locale}` });
      return;
    }

    onModeChange?.(FEED_MODES.USER);
    router.push(buildLocalizedUserPath(locale, user.id));
  };

  return (
    <header
      data-app-header="true"
      className="sticky top-0 z-[300] bg-background border-b border-border"
    >
      <div className="h-16 max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* 햄버거 메뉴 버튼 (모바일만) */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors duration-200"
          aria-label={t("openMenu")}
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
            className="font-brand font-bold text-lg md:text-2xl tracking-tight
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
              {t("companyBlogs")}
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
              {t("community")}
            </button>
          </div>
        </div>

        {/* Search Bar (데스크탑만) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-[600px] mx-8 justify-center"
        >
          <SearchInput
            className="w-full"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Write Post Button (로그인 사용자만) */}
          {isLoggedIn && !isLoading && (
            <PrimaryRectButton
              onClick={handleWritePostClick}
              className="hidden md:inline-flex md:mr-2 h-9 min-w-[100px] px-3 items-center justify-center gap-2.5 whitespace-nowrap text-sm font-semibold"
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>{t("writePost")}</span>
            </PrimaryRectButton>
          )}

          {isLoggedIn && !isLoading && <NotificationDropdown />}

          {/* Auth Button / Profile */}
          {isLoading ? (
            <div className="w-8 h-8 rounded-full skeleton-bg animate-pulse" />
          ) : isLoggedIn && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleAuthClick}
                className="flex items-center gap-2 p-1 rounded-full
                        transition-opacity duration-200
                        hover:opacity-80"
              >
                {user.profileImageUrl ? (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={user.profileImageUrl}
                      alt={user.name || t("profile")}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {user.name?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
                <span className="hidden md:inline text-sm font-medium text-foreground">
                  {user.name}
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-popover text-popover-foreground rounded-md shadow-lg border border-border py-1 z-[400]">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleMyPostsMenuClick}
                    className="w-full whitespace-nowrap px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {t("myPosts")}
                    </span>
                  </button>
                  <button
                    onClick={handleSettingsMenuClick}
                    className="w-full whitespace-nowrap px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      {t("settings")}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full whitespace-nowrap px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                      {t("logout")}
                    </span>
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
              <span className="hidden md:inline">{t("login")}</span>
            </button>
          )}
        </div>
      </div>

      <MobileBottomNav
        currentMode={currentMode}
        onMyPostsClick={handleMyPostsClick}
        onModeNavigate={handleModeNavigate}
        onWritePost={handleWritePostClick}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          replaceSettingsQueryState(false);
        }}
      />
    </header>
  );
}
