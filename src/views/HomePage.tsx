"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import FilterBar from "../components/FilterBar";
import CommunityFeedSection from "../components/feed/CommunityFeedSection";
import CompanyFeedSection from "../components/feed/CompanyFeedSection";
import { FEED_MODES } from "../constants/feed";
import { FeedMode, FilterState } from "../types";
import { DUMMY_TECH_BLOGS } from "../data/dummyData";
import { useCompanyFeed } from "../hooks/useCompanyFeed";
import { useFeedFilters } from "../hooks/useFeedFilters";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useTagNamesByIds } from "../hooks/useTagNamesByIds";
import { useUser } from "../hooks/useUser";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function HomeContent({
  initialMode,
}: {
  initialMode: FeedMode;
}) {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useUser();
  const [readPostIdsByUser, setReadPostIdsByUser] = useState<Record<string, Set<string>>>(
    {},
  );
  const selectedTagIdsFromUrl = useMemo(
    () =>
      searchParams
        .getAll("tagIds")
        .map((tagId) => tagId.trim().toLowerCase())
        .filter((tagId) => UUID_PATTERN.test(tagId)),
    [searchParams],
  );
  const modeParam = searchParams.get("mode");
  const modeFromUrl: FeedMode =
    selectedTagIdsFromUrl.length > 0
      ? FEED_MODES.USER
      : modeParam === FEED_MODES.USER || modeParam === FEED_MODES.COMPANY
        ? modeParam
        : FEED_MODES.COMPANY;

  const {
    filterState,
    setFilterState,
    handleModeChange,
    communityPeriod,
    communitySort,
    getVisiblePosts,
  } = useFeedFilters({
    initialMode,
  });

  const syncTagsToUrl = useCallback(
    (nextState: FilterState) => {
      const normalizedTagIds = Array.from(
        new Set(nextState.selectedTags.map((tagId) => tagId.toLowerCase())),
      );
      const hasSameTags =
        normalizedTagIds.length === selectedTagIdsFromUrl.length &&
        normalizedTagIds.every((tagId, index) => tagId === selectedTagIdsFromUrl[index]);

      if (hasSameTags && modeParam === nextState.mode) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("mode", nextState.mode);
      nextParams.delete("tagIds");

      if (nextState.mode === FEED_MODES.USER) {
        normalizedTagIds.forEach((tagId) => {
          nextParams.append("tagIds", tagId);
        });
      }

      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [modeParam, pathname, router, searchParams, selectedTagIdsFromUrl],
  );

  const handleFilterChange = useCallback(
    (nextState: FilterState) => {
      setFilterState({
        ...nextState,
        selectedTags: Array.from(
          new Set(nextState.selectedTags.map((tagId) => tagId.toLowerCase())),
        ),
      });
      syncTagsToUrl(nextState);
    },
    [setFilterState, syncTagsToUrl],
  );

  useEffect(() => {
    setFilterState((prev) => {
      const hasSameMode = prev.mode === modeFromUrl;
      const hasSameTags =
        prev.selectedTags.length === selectedTagIdsFromUrl.length &&
        prev.selectedTags.every((tagId, index) => tagId === selectedTagIdsFromUrl[index]);

      if (hasSameMode && hasSameTags) {
        return prev;
      }

      return {
        ...prev,
        mode: modeFromUrl,
        selectedTags: selectedTagIdsFromUrl,
      };
    });
  }, [modeFromUrl, selectedTagIdsFromUrl, setFilterState]);

  const communityFeed = useCommunityFeed({
    enabled: filterState.mode === "user",
    period: communityPeriod,
    sort: communitySort,
    tagIds: filterState.selectedTags,
    size: 20,
  });
  const companyFeed = useCompanyFeed({
    enabled: filterState.mode === FEED_MODES.COMPANY,
  });

  const handleReadStatusChange = (postId: string, isRead: boolean) => {
    if (!user?.id) return;

    setReadPostIdsByUser((prev) => {
      const userReadPosts = prev[user.id] ?? new Set<string>();
      const nextUserReadPosts = new Set(userReadPosts);

      if (isRead) {
        nextUserReadPosts.add(postId);
      } else {
        nextUserReadPosts.delete(postId);
      }

      return {
        ...prev,
        [user.id]: nextUserReadPosts,
      };
    });
  };

  const currentPosts =
    filterState.mode === FEED_MODES.COMPANY
      ? companyFeed.posts
      : communityFeed.posts;
  const visiblePosts = useMemo(() => {
    const currentUserReadPosts = user?.id ? readPostIdsByUser[user.id] : undefined;

    const mergedPosts = currentPosts.map((post) => ({
      ...post,
      isRead:
        Boolean(user?.id) &&
        (post.isRead || Boolean(currentUserReadPosts?.has(post.id))),
    }));

    return getVisiblePosts(mergedPosts);
  }, [currentPosts, getVisiblePosts, readPostIdsByUser, user?.id]);

  const { tagNameMap } = useTagNamesByIds(filterState.selectedTags);
  const selectedTagItems = useMemo(
    () =>
      filterState.selectedTags.map((tagId) => ({
        id: tagId,
        name: tagNameMap[tagId.toLowerCase()] ?? t("unknownTag"),
      })),
    [filterState.selectedTags, t, tagNameMap],
  );

  const selectedTagSummary = useMemo(() => {
    if (selectedTagItems.length === 0) return "";
    if (selectedTagItems.length === 1) return `#${selectedTagItems[0].name}`;

    return `#${selectedTagItems[0].name} ${t("andMore", {
      count: selectedTagItems.length - 1,
    })}`;
  }, [selectedTagItems, t]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header
        onMenuClick={() => setIsMobileSidebarOpen(true)}
        currentMode={filterState.mode}
        onModeChange={handleModeChange}
      />
      <div className="md:flex max-w-[1400px] mx-auto">
        <Sidebar
          key={filterState.mode}
          mode={filterState.mode}
          filterState={filterState}
          onFilterChange={handleFilterChange}
          availableTags={[]}
          availableTechBlogs={DUMMY_TECH_BLOGS}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 md:max-w-[728px] mx-auto px-4 md:px-6 py-6">
          {filterState.mode === "user" && (
            <>
              {selectedTagItems.length > 0 && (
                <section className="mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedTagSummary}
                  </p>
                </section>
              )}

              <FilterBar
                filterState={filterState}
                onFilterChange={handleFilterChange}
              />
            </>
          )}

          {filterState.mode === "user" ? (
            <CommunityFeedSection
              posts={visiblePosts}
              error={communityFeed.error}
              hasNext={communityFeed.hasNext}
              isLoading={communityFeed.isLoading}
              isLoadingMore={communityFeed.isLoadingMore}
              onLoadMore={communityFeed.loadMore}
              onReadStatusChange={handleReadStatusChange}
              currentUserId={user?.id}
            />
          ) : (
            <CompanyFeedSection
              posts={visiblePosts}
              isLoading={companyFeed.isLoading}
              onReadStatusChange={handleReadStatusChange}
              currentUserId={user?.id}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const initialTagIds = searchParams
    .getAll("tagIds")
    .map((tagId) => tagId.trim().toLowerCase())
    .filter((tagId) => UUID_PATTERN.test(tagId));

  const initialMode: FeedMode =
    initialTagIds.length > 0
      ? FEED_MODES.USER
      : modeParam === FEED_MODES.USER || modeParam === FEED_MODES.COMPANY
        ? modeParam
        : FEED_MODES.COMPANY;

  return (
    <HomeContent
      key={initialMode}
      initialMode={initialMode}
    />
  );
}
