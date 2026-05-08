'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Folder, FolderOpen, PencilLine, UserX } from 'lucide-react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import CommunityFeedSection from '../components/feed/CommunityFeedSection';
import Header from '../components/Header';
import PostDetailConfirmDialog, {
  DELETE_CONFIRM_BUTTON_CLASS_NAME,
} from '../components/post-detail/PostDetailConfirmDialog';
import ActionSnackbar from '../components/ui/ActionSnackbar';
import PrimaryRectButton from '../components/ui/PrimaryRectButton';
import BlockedProfileState from '../components/user/BlockedProfileState';
import ProfileEditModal from '../components/user/ProfileEditModal';
import UserFollowListModal, { FollowListTab } from '../components/user/UserFollowListModal';
import { FEED_MODES } from '../constants/feed';
import { useActionSnackbar } from '../hooks/useActionSnackbar';
import { useFollowActions } from '../hooks/useFollowActions';
import { useUser } from '../hooks/useUser';
import { useUserBlockActions } from '../hooks/useUserBlockActions';
import { useUserCategories } from '../hooks/useUserCategories';
import { useUserCommunityFeed } from '../hooks/useUserCommunityFeed';
import { redirectToOAuthLogin } from '../lib/authRedirect';
import { queryKeys } from '../lib/queryKeys';
import { PostListPeriod, PostListSort, UserCategory } from '../services/posts/types';
import { fetchMyBans, isBanApiError } from '../services/users/ban';
import {
  fetchUserFollowCounts,
  fetchUserFollowers,
  fetchUserFollowings,
} from '../services/users/follow';
import { FeedMode } from '../types';

type CategoryFilter = {
  id: string;
  path: string;
  label: string;
  depth: number;
  count: number;
};

type CategoryTreeNode = CategoryFilter & {
  children: CategoryTreeNode[];
};

function buildCategoryTree(filters: CategoryFilter[]): CategoryTreeNode[] {
  const sorted = [...filters].sort((a, b) => a.path.localeCompare(b.path));
  const nodesByPath = new Map<string, CategoryTreeNode>();
  const rootNodes: CategoryTreeNode[] = [];

  for (const category of sorted) {
    nodesByPath.set(category.path, { ...category, children: [] });
  }

  for (const node of nodesByPath.values()) {
    const parentPath = node.path.split('/').slice(0, -1).join('/');
    const parent = parentPath ? nodesByPath.get(parentPath) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

function buildCategoryFilters(categories: UserCategory[]): CategoryFilter[] {
  return categories
    .map((category) => ({
      id: category.id,
      path: category.path,
      label: category.name,
      depth: Math.max(category.depth - 1, 0),
      count: category.postCount ?? 0,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function renderCategoryList(params: {
  nodes: CategoryTreeNode[];
  selectedCategoryPath: string | null;
  expandedCategoryIds: Record<string, boolean>;
  onSelectCategory: (path: string) => void;
  onToggleCategory: (categoryId: string) => void;
  collapseAriaLabel: string;
  expandAriaLabel: string;
  toggleOnRowClick?: boolean;
  openOnlyOnRowClick?: boolean;
}) {
  const {
    nodes,
    selectedCategoryPath,
    expandedCategoryIds,
    onSelectCategory,
    onToggleCategory,
    collapseAriaLabel,
    expandAriaLabel,
    toggleOnRowClick = true,
    openOnlyOnRowClick = false,
  } = params;

  const renderList = (children: CategoryTreeNode[]): ReactNode[] =>
    children.flatMap((node) => {
      const hasChildren = node.children.length > 0;
      const shouldAutoExpand = Boolean(
        hasChildren &&
        selectedCategoryPath &&
        (selectedCategoryPath === node.path || selectedCategoryPath.startsWith(`${node.path}/`)),
      );
      const isExpanded = expandedCategoryIds[node.id] ?? shouldAutoExpand;
      const isSelected = selectedCategoryPath === node.path;

      const renderedChildren: ReactNode[] = isExpanded ? renderList(node.children) : [];

      return [
        <div
          key={node.id}
          className={`w-full rounded-md py-2 pr-2 text-left text-sm transition-colors ${
            isSelected
              ? 'bg-muted font-bold'
              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
          } cursor-pointer`}
          style={{
            paddingLeft: `${10 + node.depth * 16}px`,
            ...(isSelected ? { color: 'var(--color-blue-500)' } : {}),
          }}
          role="button"
          tabIndex={0}
          onClick={() => {
            onSelectCategory(node.path);
            if (toggleOnRowClick && hasChildren) {
              if (!openOnlyOnRowClick || !isExpanded) {
                onToggleCategory(node.id);
              }
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectCategory(node.path);
              if (toggleOnRowClick && hasChildren) {
                if (!openOnlyOnRowClick || !isExpanded) {
                  onToggleCategory(node.id);
                }
              }
            }
          }}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Folder className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
              )
            ) : isSelected ? (
              <FolderOpen className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Folder className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
            )}

            <span className="whitespace-nowrap">{node.label}</span>
            <span className="border-border bg-background text-muted-foreground ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[11px] leading-none">
              {node.count}
            </span>

            {hasChildren ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleCategory(node.id);
                }}
                className="bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground ml-auto inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors"
                aria-label={isExpanded ? collapseAriaLabel : expandAriaLabel}
              >
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            ) : null}
          </div>
        </div>,
        ...renderedChildren,
      ];
    });

  return renderList(nodes);
}

type CategoryActionButton = {
  id: string;
  path: string | null;
  label: string;
  count: number | null;
};

function renderCategoryFilterButton(params: {
  item: CategoryActionButton;
  isSelected: boolean;
  onSelectCategory: (path: string | null) => void;
}) {
  const { item, isSelected, onSelectCategory } = params;

  return (
    <button
      key={item.id}
      type="button"
      onClick={() => onSelectCategory(item.path)}
      className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
        isSelected
          ? 'bg-muted text-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      } cursor-pointer`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="whitespace-nowrap">{item.label}</span>
        {item.count !== null ? (
          <span className="border-border bg-background text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[11px] leading-none">
            {item.count}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function CategoryFilterPanelContent(params: {
  title: string;
  actionRows: ReactNode[];
  categoryRows: ReactNode[];
}) {
  const { title, actionRows, categoryRows } = params;

  return (
    <>
      {title ? (
        <div className="text-foreground mb-3 px-1 text-sm font-semibold">{title}</div>
      ) : null}
      <div className="mt-2 flex flex-col gap-1">{actionRows}</div>
      {categoryRows.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1">{categoryRows}</div>
      ) : null}
    </>
  );
}

function UserDetailPageContent() {
  const t = useTranslations('UserPage');
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = typeof params.id === 'string' ? params.id : '';
  const isBlockedIntent = searchParams.get('blocked') === '1';
  const requestedCategoryPath = searchParams.get('categoryPath')?.trim() || null;
  const [currentMode, setCurrentMode] = useState<FeedMode>(FEED_MODES.USER);

  const [period, setPeriod] = useState<PostListPeriod>('ALL');
  const [sort, setSort] = useState<PostListSort>('LATEST');
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [blockedProfileOverride, setBlockedProfileOverride] = useState<boolean | null>(
    isBlockedIntent ? true : null,
  );
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [followListTab, setFollowListTab] = useState<FollowListTab>('followers');
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string | null>(
    requestedCategoryPath,
  );
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [isMobileCategorySidebarOpen, setIsMobileCategorySidebarOpen] = useState(false);

  const { snackbar, showSnackbar } = useActionSnackbar();
  const hasUserId = Boolean(userId);
  const { user: currentUser, isLoading: isCurrentUserLoading } = useUser();
  const currentUserId = currentUser?.id ?? null;
  const { toggleFollow, isPending: isFollowToggling } = useFollowActions();
  const { blockUser, unblockUser, isBlocking, isUnblocking } = useUserBlockActions(currentUserId);
  const includePrivatePosts = Boolean(currentUser && currentUser.id === userId);

  const followCountsQuery = useQuery({
    queryKey: queryKeys.user.followCounts(userId),
    queryFn: () => fetchUserFollowCounts(userId),
    enabled: hasUserId,
  });

  const myFollowingsQuery = useQuery({
    queryKey: queryKeys.user.followings(currentUserId ?? ''),
    queryFn: () => fetchUserFollowings(currentUserId ?? ''),
    enabled: Boolean(currentUserId),
  });

  const myBansQuery = useQuery({
    queryKey: queryKeys.user.bans(),
    queryFn: fetchMyBans,
    enabled: Boolean(currentUserId),
  });

  const followersQuery = useQuery({
    queryKey: queryKeys.user.followers(userId),
    queryFn: () => fetchUserFollowers(userId),
    enabled: hasUserId && isFollowListModalOpen && followListTab === 'followers',
  });

  const followingsQuery = useQuery({
    queryKey: queryKeys.user.followings(userId),
    queryFn: () => fetchUserFollowings(userId),
    enabled: hasUserId && isFollowListModalOpen && followListTab === 'followings',
  });

  const { categories } = useUserCategories({
    enabled: hasUserId,
    userId,
  });

  const categoryFilters = useMemo(() => buildCategoryFilters(categories), [categories]);

  const categoryTree = useMemo(() => buildCategoryTree(categoryFilters), [categoryFilters]);

  const periodOptions = useMemo(
    () =>
      [
        { value: 'ALL', label: t('period.all') },
        { value: 'WEEK', label: t('period.week') },
        { value: 'MONTH', label: t('period.month') },
        { value: 'YEAR', label: t('period.year') },
      ] as const,
    [t],
  );

  const sortOptions = useMemo(
    () =>
      [
        { value: 'LATEST', label: t('sort.latest') },
        { value: 'LIKE', label: t('sort.like') },
        { value: 'COMMENT', label: t('sort.comment') },
        { value: 'VIEW', label: t('sort.view') },
      ] as const,
    [t],
  );

  const handleCategorySelect = useCallback((path: string) => {
    setSelectedCategoryPath(path);
  }, []);

  const handleMobileCategorySelect = useCallback((path: string) => {
    setSelectedCategoryPath(path);
  }, []);

  const handleMobileActionCategorySelect = useCallback((path: string | null) => {
    setSelectedCategoryPath(path);
  }, []);

  useEffect(() => {
    setSelectedCategoryPath(requestedCategoryPath);
  }, [requestedCategoryPath]);

  useEffect(() => {
    if (!requestedCategoryPath) {
      return;
    }

    setExpandedCategoryIds((current) => {
      let changed = false;
      const next = { ...current };

      for (const category of categoryFilters) {
        if (
          requestedCategoryPath === category.path ||
          requestedCategoryPath.startsWith(`${category.path}/`)
        ) {
          if (!next[category.id]) {
            next[category.id] = true;
            changed = true;
          }
        }
      }

      return changed ? next : current;
    });
  }, [categoryFilters, requestedCategoryPath]);

  const activeCategoryPath = useMemo(() => {
    if (selectedCategoryPath === null) {
      return null;
    }

    return categoryFilters.some((category) => category.path === selectedCategoryPath)
      ? selectedCategoryPath
      : null;
  }, [categoryFilters, selectedCategoryPath]);

  const selectedCategoryIds = useMemo(() => {
    if (!activeCategoryPath) {
      return [] as string[];
    }

    return categories
      .filter(
        (category) =>
          category.path === activeCategoryPath ||
          category.path.startsWith(`${activeCategoryPath}/`),
      )
      .map((category) => category.id);
  }, [categories, activeCategoryPath]);

  const postsByAuthor = useUserCommunityFeed({
    enabled: hasUserId,
    userId,
    period,
    sort,
    categoryIds: selectedCategoryIds,
    includePrivatePosts,
  });

  const profileAuthor = useMemo(() => {
    const isCurrentUserPage = currentUser?.id === userId;
    if (isCurrentUserPage) {
      return {
        profileName: currentUser?.name || '',
        profileImageUrl: currentUser?.profileImageUrl || '',
      };
    }

    const firstPostWithAuthor = postsByAuthor.posts.find((post) => post.author?.name);
    return {
      profileName: firstPostWithAuthor?.author?.name || '',
      profileImageUrl: firstPostWithAuthor?.author?.profileImageUrl || '',
    };
  }, [
    currentUser?.id,
    currentUser?.name,
    currentUser?.profileImageUrl,
    postsByAuthor.posts,
    userId,
  ]);

  const { profileName, profileImageUrl } = profileAuthor;
  const isCurrentUserPage = currentUser?.id === userId;
  const showProfileActions = Boolean(hasUserId && !isCurrentUserLoading && !isCurrentUserPage);
  const isProfileLoading = hasUserId
    ? isCurrentUserPage
      ? isCurrentUserLoading
      : postsByAuthor.isLoading
    : false;
  const numberFormatter = useMemo(() => new Intl.NumberFormat(), []);
  const postCount = postsByAuthor.posts.length;
  const categoryActionItems = useMemo(
    () => [
      {
        id: 'all',
        path: null as null,
        label: t('categories.all'),
        count: postCount,
      },
    ],
    [postCount, t],
  );
  const followerCount = followCountsQuery.data?.data.followerCount ?? null;
  const followingCount = followCountsQuery.data?.data.followingCount ?? null;
  const myFollowingUserIdSet = useMemo(
    () => new Set((myFollowingsQuery.data?.data ?? []).map((user) => user.userId)),
    [myFollowingsQuery.data?.data],
  );
  const isFollowed = Boolean(currentUserId && myFollowingUserIdSet.has(userId));
  const activeFollowList =
    followListTab === 'followers'
      ? (followersQuery.data?.data ?? [])
      : (followingsQuery.data?.data ?? []);
  const isFollowListLoading =
    followListTab === 'followers'
      ? followersQuery.isLoading || followersQuery.isFetching
      : followingsQuery.isLoading || followingsQuery.isFetching;
  const formatCount = useCallback(
    (value: number | null) => (value === null ? '-' : numberFormatter.format(value)),
    [numberFormatter],
  );
  const profileStatsText = `${t('stats.posts')} ${formatCount(postCount)}`;
  const displayProfileName = profileName || t('unknownAuthor');
  const blockedUserName =
    myBansQuery.data?.data.find((item) => item.userId === userId)?.name || displayProfileName;
  const unblockToastTargetName = snackbar?.type === 'blocked' ? snackbar.name : blockedUserName;
  const isTargetUserBanned = Boolean(myBansQuery.data?.data.some((item) => item.userId === userId));
  const isBlockedProfile = blockedProfileOverride ?? isTargetUserBanned;

  const handleToggleFollow = useCallback(
    async (targetUserId: string, isCurrentlyFollowing: boolean, targetUserName?: string) => {
      const result = await toggleFollow({
        actorUserId: currentUser?.id ?? null,
        targetUserId,
        isCurrentlyFollowing,
        targetUserName,
        fallbackName: displayProfileName,
      });

      if (!result.ok) {
        if (result.reason === 'unauthorized') {
          redirectToOAuthLogin();
          return;
        }

        if (result.reason === 'self') {
          return;
        }

        const fallbackMessage = isCurrentlyFollowing
          ? t('actions.unfollowFailed')
          : t('actions.followFailed');
        showSnackbar({ type: 'error', message: result.message || fallbackMessage });
        return;
      }

      if (result.action === 'followed') {
        showSnackbar({ type: 'followed', name: result.name });
      } else {
        showSnackbar({ type: 'unfollowed', name: result.name });
      }
    },
    [currentUser?.id, displayProfileName, showSnackbar, t, toggleFollow],
  );

  const openFollowList = useCallback((tab: FollowListTab) => {
    setFollowListTab(tab);
    setIsFollowListModalOpen(true);
  }, []);

  const handleBlockUser = useCallback(async () => {
    if (!userId || isBlocking) {
      return;
    }

    if (!currentUser) {
      redirectToOAuthLogin();
      return;
    }

    if (currentUser.id === userId) {
      return;
    }

    try {
      const result = await blockUser(userId);
      setBlockedProfileOverride(true);
      showSnackbar({ type: 'blocked', name: displayProfileName });

      if (result === 'alreadyBlocked') {
        showSnackbar({ type: 'error', message: t('actions.alreadyBlocked') });
      }
    } catch (error: unknown) {
      if (isBanApiError(error)) {
        if (error.code === 'UNAUTHORIZED') {
          redirectToOAuthLogin();
          return;
        }

        showSnackbar({ type: 'error', message: error.message || t('actions.blockFailed') });
        return;
      }

      showSnackbar({ type: 'error', message: t('actions.blockFailed') });
    }
  }, [blockUser, currentUser, displayProfileName, isBlocking, showSnackbar, t, userId]);

  const handleBlockButtonClick = useCallback(() => {
    if (!userId) {
      return;
    }

    if (!currentUser) {
      redirectToOAuthLogin();
      return;
    }

    if (currentUser.id === userId) {
      return;
    }

    setIsBlockConfirmOpen(true);
  }, [currentUser, userId]);

  const handleConfirmBlock = useCallback(async () => {
    await handleBlockUser();
    setIsBlockConfirmOpen(false);
  }, [handleBlockUser]);

  const handleUnblockUser = useCallback(async () => {
    if (!userId || isUnblocking) {
      return;
    }

    if (!currentUser) {
      redirectToOAuthLogin();
      return;
    }

    try {
      await unblockUser(userId);

      setBlockedProfileOverride(false);
      showSnackbar({ type: 'unblocked', name: unblockToastTargetName });
    } catch (error: unknown) {
      if (isBanApiError(error) && error.code === 'UNAUTHORIZED') {
        redirectToOAuthLogin();
        return;
      }

      showSnackbar({ type: 'error', message: t('actions.unblockFailed') });
    }
  }, [currentUser, isUnblocking, showSnackbar, t, unblockToastTargetName, unblockUser, userId]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setExpandedCategoryIds((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  }, []);

  useEffect(() => {
    if (!isMobileCategorySidebarOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileCategorySidebarOpen]);

  const renderedCategoryRows = useMemo(
    () =>
      renderCategoryList({
        nodes: categoryTree,
        selectedCategoryPath: activeCategoryPath,
        expandedCategoryIds,
        onSelectCategory: handleCategorySelect,
        onToggleCategory: handleCategoryToggle,
        collapseAriaLabel: t('categories.collapseSubcategories'),
        expandAriaLabel: t('categories.expandSubcategories'),
      }),
    [
      categoryTree,
      expandedCategoryIds,
      handleCategorySelect,
      handleCategoryToggle,
      activeCategoryPath,
      t,
    ],
  );

  const renderedMobileCategoryRows = useMemo(
    () =>
      renderCategoryList({
        nodes: categoryTree,
        selectedCategoryPath: activeCategoryPath,
        expandedCategoryIds,
        onSelectCategory: handleMobileCategorySelect,
        onToggleCategory: handleCategoryToggle,
        collapseAriaLabel: t('categories.collapseSubcategories'),
        expandAriaLabel: t('categories.expandSubcategories'),
        toggleOnRowClick: true,
      }),
    [
      categoryTree,
      activeCategoryPath,
      expandedCategoryIds,
      handleMobileCategorySelect,
      handleCategoryToggle,
      t,
    ],
  );

  const renderedCategoryActionRows = useMemo(
    () =>
      categoryActionItems.map((item) =>
        renderCategoryFilterButton({
          item,
          isSelected:
            item.path === null ? activeCategoryPath === null : activeCategoryPath === item.path,
          onSelectCategory: setSelectedCategoryPath,
        }),
      ),
    [activeCategoryPath, categoryActionItems],
  );

  const renderedMobileCategoryActionRows = useMemo(
    () =>
      categoryActionItems.map((item) =>
        renderCategoryFilterButton({
          item,
          isSelected:
            item.path === null ? activeCategoryPath === null : activeCategoryPath === item.path,
          onSelectCategory: handleMobileActionCategorySelect,
        }),
      ),
    [activeCategoryPath, categoryActionItems, handleMobileActionCategorySelect],
  );

  return (
    <div className="bg-background min-h-screen">
      <Header
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onMenuClick={() => setIsMobileCategorySidebarOpen(true)}
      />

      <ActionSnackbar
        isOpen={Boolean(snackbar)}
        variant={snackbar?.type ?? 'unblocked'}
        message={
          snackbar?.message
            ? snackbar.message
            : snackbar
              ? snackbar.type === 'blocked'
                ? t('actions.blockedWithName', { name: snackbar.name ?? '' })
                : snackbar.type === 'unblocked'
                  ? t('actions.unblockedWithName', { name: snackbar.name ?? '' })
                  : snackbar.type === 'followed'
                    ? t('actions.followedWithName', { name: snackbar.name ?? '' })
                    : snackbar.type === 'unfollowed'
                      ? t('actions.unfollowedWithName', { name: snackbar.name ?? '' })
                      : ''
              : ''
        }
        undoLabel={t('actions.cancel')}
        onUndo={
          snackbar?.type === 'blocked'
            ? () => {
                void handleUnblockUser();
              }
            : undefined
        }
        isUndoPending={isUnblocking}
      />

      {isBlockedProfile ? (
        <BlockedProfileState
          title={t('blockedState.title', { blockerName: currentUser?.name ?? t('unknownAuthor') })}
          description={t('blockedState.description', { blockedName: blockedUserName })}
          unblockLabel={t('actions.unblock')}
          onUnblock={() => {
            void handleUnblockUser();
          }}
          isUnblocking={isUnblocking}
        />
      ) : (
        <div className="mx-auto max-w-[1400px] md:flex">
          {isMobileCategorySidebarOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-[350] bg-black/45 md:hidden"
              aria-label={t('categories.closeSidebar')}
              onClick={() => setIsMobileCategorySidebarOpen(false)}
            />
          ) : null}

          <aside
            className={[
              'fixed top-0 left-0 h-full md:static md:h-auto',
              'w-[280px] max-w-[85vw] shrink-0',
              'border-border overflow-y-auto border-r',
              'bg-sidebar p-6',
              'z-[400] shadow-2xl md:z-auto md:shadow-none',
              'transition-transform duration-300 ease-in-out',
              isMobileCategorySidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            ].join(' ')}
          >
            <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
              <div className="text-foreground text-sm font-semibold">
                {t('categories.mobileSectionTitle')}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCategorySidebarOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors"
                aria-label={t('categories.closeSidebar')}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            <div className="hidden md:block">
              <CategoryFilterPanelContent
                title={t('categories.title')}
                actionRows={renderedCategoryActionRows}
                categoryRows={renderedCategoryRows}
              />
            </div>

            <div className="md:hidden">
              <CategoryFilterPanelContent
                title=""
                actionRows={renderedMobileCategoryActionRows}
                categoryRows={renderedMobileCategoryRows}
              />
            </div>
          </aside>

          <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
            <div className="mb-6 flex flex-col gap-4 px-1 md:flex-row md:items-center md:justify-between">
              {isProfileLoading ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="bg-muted h-[52px] w-[52px] shrink-0 animate-pulse rounded-full" />
                    <div className="space-y-2">
                      <div className="bg-muted h-9 w-40 max-w-[65vw] animate-pulse rounded-md" />
                      <div className="bg-muted h-5 w-64 max-w-[75vw] animate-pulse rounded-md" />
                    </div>
                  </div>
                  {showProfileActions ? (
                    <div className="flex items-center gap-3">
                      <div className="btn-rect bg-muted h-10 w-[120px] animate-pulse" />
                      <div className="btn-rect bg-muted h-10 w-10 animate-pulse" />
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="bg-muted relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full">
                      {profileImageUrl ? (
                        <Image
                          src={profileImageUrl}
                          alt={displayProfileName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-xl font-bold">
                          {(displayProfileName || '?').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h1 className="text-foreground truncate text-[20px] font-bold">
                          {displayProfileName}
                        </h1>
                        {isCurrentUserPage ? (
                          <button
                            type="button"
                            onClick={() => setIsProfileEditModalOpen(true)}
                            className="border-border bg-background text-foreground hover:bg-muted inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-sm font-semibold transition-colors"
                          >
                            <PencilLine className="h-4 w-4" />
                            {t('profileEdit.open')}
                          </button>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-medium">
                        <span className="truncate">{profileStatsText}</span>
                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => openFollowList('followers')}
                          className="hover:text-foreground truncate transition-colors"
                        >
                          {t('stats.followers')} {formatCount(followerCount)}
                        </button>
                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => openFollowList('followings')}
                          className="hover:text-foreground truncate transition-colors"
                        >
                          {t('stats.following')} {formatCount(followingCount)}
                        </button>
                      </div>
                    </div>
                  </div>
                  {showProfileActions ? (
                    <div className="flex items-center gap-3 md:shrink-0">
                      {isFollowed ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleToggleFollow(userId, isFollowed, displayProfileName);
                          }}
                          disabled={isFollowToggling}
                          className="btn-rect btn-neutral-surface text-muted-foreground h-10 min-w-[120px] px-5 text-[15px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60"
                        >
                          {t('actions.following')}
                        </button>
                      ) : (
                        <PrimaryRectButton
                          onClick={() => {
                            void handleToggleFollow(userId, isFollowed, displayProfileName);
                          }}
                          disabled={isFollowToggling}
                          className="h-10 min-w-[120px] px-5 text-[15px] font-semibold whitespace-nowrap"
                        >
                          {t('actions.follow')}
                        </PrimaryRectButton>
                      )}
                      <button
                        type="button"
                        onClick={handleBlockButtonClick}
                        disabled={isBlocking}
                        className="btn-rect btn-neutral-surface text-muted-foreground inline-flex h-10 min-w-10 items-center justify-center px-2 transition-colors disabled:opacity-60"
                        aria-label={t('actions.block')}
                      >
                        <UserX className="h-5 w-5" />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <PostDetailConfirmDialog
              isOpen={isBlockConfirmOpen}
              title={t('actions.blockConfirmTitle')}
              description={t('actions.blockConfirmDescription')}
              cancelLabel={t('actions.cancel')}
              confirmLabel={t('actions.confirm')}
              onCancel={() => setIsBlockConfirmOpen(false)}
              onConfirm={handleConfirmBlock}
              isConfirming={isBlocking}
              confirmButtonClassName={DELETE_CONFIRM_BUTTON_CLASS_NAME}
            />

            {isCurrentUserPage && currentUser && isProfileEditModalOpen ? (
              <ProfileEditModal
                isOpen={isProfileEditModalOpen}
                user={currentUser}
                onClose={() => setIsProfileEditModalOpen(false)}
              />
            ) : null}

            <UserFollowListModal
              isOpen={isFollowListModalOpen}
              isLoading={isFollowListLoading}
              activeTab={followListTab}
              users={activeFollowList}
              currentUserId={currentUserId}
              followingUserIdSet={myFollowingUserIdSet}
              followerCount={followerCount}
              followingCount={followingCount}
              onClose={() => setIsFollowListModalOpen(false)}
              onTabChange={setFollowListTab}
              onToggleFollow={handleToggleFollow}
            />

            <div className="border-border mb-4 flex flex-col justify-between gap-3 border-b py-3 md:flex-row md:items-center">
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
                {periodOptions.map((option) => {
                  const isActive = period === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPeriod(option.value)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/70'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="no-scrollbar flex items-center gap-3 overflow-x-auto text-sm">
                {sortOptions.map((option) => {
                  const isActive = sort === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSort(option.value)}
                      className={`whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground font-medium'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasUserId ? (
              <CommunityFeedSection
                posts={postsByAuthor.posts}
                error={postsByAuthor.error}
                hasNext={postsByAuthor.hasNext}
                isLoading={postsByAuthor.isLoading}
                isLoadingMore={postsByAuthor.isLoadingMore}
                onLoadMore={postsByAuthor.loadMore}
                onReadStatusChange={() => {}}
                currentUserId={currentUser?.id}
              />
            ) : null}

            {!hasUserId ||
            (!postsByAuthor.isLoading &&
              postsByAuthor.posts.length === 0 &&
              !postsByAuthor.hasNext) ? (
              <div className="border-border bg-card text-muted-foreground rounded-lg border p-8 text-center text-sm">
                {t('empty')}
              </div>
            ) : null}
          </main>
        </div>
      )}
    </div>
  );
}

export default function UserDetailPage() {
  return (
    <Suspense fallback={null}>
      <UserDetailPageContent />
    </Suspense>
  );
}
