'use client';

import { useQueryClient } from '@tanstack/react-query';
import { FileText, LogOut, PenLine, Settings } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { FEED_MODES } from '../constants/feed';
import { useUser } from '../hooks/useUser';
import { usePathname, useRouter } from '../i18n/navigation';
import { buildLogoutUrl, redirectToOAuthLogin } from '../lib/authRedirect';
import { queryKeys } from '../lib/queryKeys';
import { buildUserPath } from '../lib/userRoute';
import { FeedMode } from '../types';
import MobileBottomNav from './BottomNav';
import NotificationDropdown from './header/NotificationDropdown';
import SearchInput from './SearchInput';
import SettingsModal from './settings/SettingsModal';
import PrimaryRectButton from './ui/PrimaryRectButton';

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
  const t = useTranslations('Header');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isSettingsModalOpen = searchParams.get('settings') === 'open';
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user, isLoading } = useUser();
  const isLoggedIn = !!user;
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const replaceSettingsQueryState = (open: boolean) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (open) {
      nextParams.set('settings', 'open');
    } else {
      nextParams.delete('settings');
    }
    const nextQuery = nextParams.toString();
    const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextPath, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    router.push({
      pathname: '/search',
      query: { q: trimmedQuery },
    });
  };

  const handleModeNavigate = (mode: FeedMode) => {
    onModeChange?.(mode);
    router.push({
      pathname: '/',
      query: { mode },
    });
  };

  const handleAuthClick = () => {
    if (!isLoggedIn) {
      redirectToOAuthLogin({ redirectPath: '/' });
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleWritePostClick = () => {
    if (isLoggedIn) {
      router.push('/post/write');
      return;
    }
    redirectToOAuthLogin({ redirectPath: '/post/write' });
  };

  const handleMyPostsMenuClick = () => {
    if (!user) {
      redirectToOAuthLogin({ redirectPath: '/' });
      return;
    }

    router.push(buildUserPath(user.id));
    setIsDropdownOpen(false);
  };

  const handleSettingsMenuClick = () => {
    replaceSettingsQueryState(true);
    setIsDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch(buildLogoutUrl(), {
        method: 'POST',
        credentials: 'include',
      });
      setIsDropdownOpen(false);
      queryClient.setQueryData(queryKeys.user.me(), null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.user.all,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleMyPostsClick = () => {
    if (!user) {
      redirectToOAuthLogin({ redirectPath: '/' });
      return;
    }

    onModeChange?.(FEED_MODES.USER);
    router.push(buildUserPath(user.id));
  };

  return (
    <header
      data-app-header="true"
      className="bg-background border-border sticky top-0 z-[300] border-b"
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
        {/* 햄버거 메뉴 버튼 (모바일만) */}
        <button
          onClick={onMenuClick}
          className="hover:bg-muted rounded-md p-2 transition-colors duration-200 md:hidden"
          aria-label={t('openMenu')}
        >
          <svg
            className="text-foreground h-6 w-6"
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
        <div className="flex flex-1 items-center justify-center gap-6 md:flex-initial md:justify-start md:gap-8">
          <h1
            onClick={handleLogoClick}
            className="font-brand text-foreground cursor-pointer text-lg font-bold tracking-tight transition-opacity duration-200 hover:opacity-80 md:text-2xl"
          >
            Techtaurant
          </h1>

          {/* Mode Switcher (Desktop) */}
          <div className="hidden items-center gap-1 md:flex">
            <button
              onClick={() => handleModeNavigate(FEED_MODES.COMPANY)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentMode === FEED_MODES.COMPANY
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {t('companyBlogs')}
            </button>
            <button
              onClick={() => handleModeNavigate(FEED_MODES.USER)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentMode === FEED_MODES.USER
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {t('community')}
            </button>
          </div>
        </div>

        {/* Search Bar (데스크탑만) */}
        <form
          onSubmit={handleSearch}
          className="mx-8 hidden max-w-[600px] flex-1 justify-center md:flex"
        >
          <SearchInput
            className="w-full"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Write Post Button (로그인 사용자만) */}
          {isLoggedIn && !isLoading && (
            <PrimaryRectButton
              onClick={handleWritePostClick}
              className="hidden h-9 min-w-[100px] items-center justify-center gap-2.5 px-3 text-sm font-semibold whitespace-nowrap md:mr-2 md:inline-flex"
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>{t('writePost')}</span>
            </PrimaryRectButton>
          )}

          {/* Auth Button / Profile */}
          {isLoading ? (
            <div className="skeleton-bg h-8 w-8 animate-pulse rounded-full" />
          ) : isLoggedIn && user ? (
            <div className="flex items-center gap-1.5">
              <NotificationDropdown />

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleAuthClick}
                  className="flex items-center gap-2 rounded-full p-1 transition-opacity duration-200 hover:opacity-80"
                >
                  {user.profileImageUrl ? (
                    <div className="bg-muted relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={user.profileImageUrl}
                        alt={user.name || t('profile')}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted/80 flex h-8 w-8 items-center justify-center rounded-full">
                      <span className="text-muted-foreground text-xs font-medium">
                        {user.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <span className="text-foreground hidden text-sm font-medium md:inline">
                    {user.name}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="border-border bg-popover text-popover-foreground absolute right-0 z-[400] mt-2 w-52 rounded-md border py-1 shadow-lg">
                    <div className="border-border border-b px-3 py-2">
                      <p className="text-foreground truncate text-sm font-semibold">{user.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                    </div>
                    <button
                      onClick={handleMyPostsMenuClick}
                      className="text-foreground hover:bg-muted w-full px-3 py-2 text-left text-sm font-semibold whitespace-nowrap transition-colors"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileText className="text-muted-foreground h-4 w-4" />
                        {t('myPosts')}
                      </span>
                    </button>
                    <button
                      onClick={handleSettingsMenuClick}
                      className="text-foreground hover:bg-muted w-full px-3 py-2 text-left text-sm font-semibold whitespace-nowrap transition-colors"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Settings className="text-muted-foreground h-4 w-4" />
                        {t('settings')}
                      </span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-foreground hover:bg-muted w-full px-3 py-2 text-left text-sm font-semibold whitespace-nowrap transition-colors"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LogOut className="text-muted-foreground h-4 w-4" />
                        {t('logout')}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={handleAuthClick}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 md:px-4"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden md:inline">{t('login')}</span>
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
