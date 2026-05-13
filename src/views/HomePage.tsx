"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "../i18n/navigation";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import FilterBar from "../components/FilterBar";
import CommunityFeedSection from "../components/feed/CommunityFeedSection";
import { FEED_MODES } from "../constants/feed";
import { FilterState } from "../types";
import { useFeedFilters } from "../hooks/useFeedFilters";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useTagNamesByIds } from "../hooks/useTagNamesByIds";
import { useUser } from "../hooks/useUser";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function HomeContent() {
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
  const {
    filterState,
    setFilterState,
    communityPeriod,
    communitySort,
    getVisiblePosts,
  } = useFeedFilters({
    initialMode: FEED_MODES.USER,
    initialSelectedTags: selectedTagIdsFromUrl,
    initialDateRange: "7d",
    initialSortBy: "views",
  });

  const syncTagsToUrl = useCallback(
    (nextState: FilterState) => {
      const normalizedTagIds = Array.from(
        new Set(nextState.selectedTags.map((tagId) => tagId.toLowerCase())),
      );
      const hasSameTags =
        normalizedTagIds.length === selectedTagIdsFromUrl.length &&
        normalizedTagIds.every((tagId, index) => tagId === selectedTagIdsFromUrl[index]);

      if (hasSameTags && !searchParams.has("mode")) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("mode");
      nextParams.delete("tagIds");

      normalizedTagIds.forEach((tagId) => {
        nextParams.append("tagIds", tagId);
      });

      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, selectedTagIdsFromUrl],
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
      const hasSameTags =
        prev.selectedTags.length === selectedTagIdsFromUrl.length &&
        prev.selectedTags.every((tagId, index) => tagId === selectedTagIdsFromUrl[index]);

      if (prev.mode === FEED_MODES.USER && hasSameTags) {
        return prev;
      }

      return {
        ...prev,
        mode: FEED_MODES.USER,
        selectedTags: selectedTagIdsFromUrl,
      };
    });
  }, [selectedTagIdsFromUrl, setFilterState]);

  const communityFeed = useCommunityFeed({
    enabled: true,
    period: communityPeriod,
    sort: communitySort,
    tagIds: filterState.selectedTags,
    size: 20,
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

  const currentUserId = user?.id;
  const visiblePosts = useMemo(() => {
    const currentUserReadPosts = currentUserId
      ? readPostIdsByUser[currentUserId]
      : undefined;

    const mergedPosts = communityFeed.posts.map((post) => ({
      ...post,
      isRead:
        Boolean(currentUserId) &&
        (post.isRead || Boolean(currentUserReadPosts?.has(post.id))),
    }));

    return getVisiblePosts(mergedPosts);
  }, [communityFeed.posts, currentUserId, getVisiblePosts, readPostIdsByUser]);

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
      />
      <div className="md:flex max-w-[1400px] mx-auto">
        <Sidebar
          key={filterState.mode}
          mode={filterState.mode}
          filterState={filterState}
          onFilterChange={handleFilterChange}
          availableTags={[]}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 md:max-w-[728px] mx-auto px-4 md:px-6 py-6">
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

          <CommunityFeedSection
            posts={visiblePosts}
            error={communityFeed.error}
            hasNext={communityFeed.hasNext}
            isLoading={communityFeed.isLoading}
            isLoadingMore={communityFeed.isLoadingMore}
            onLoadMore={communityFeed.loadMore}
            onReadStatusChange={handleReadStatusChange}
            currentUserId={currentUserId}
          />
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
