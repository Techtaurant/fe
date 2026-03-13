"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import FilterBar from "../components/FilterBar";
import CommunityFeedSection from "../components/feed/CommunityFeedSection";
import CompanyFeedSection from "../components/feed/CompanyFeedSection";
import { FEED_MODES } from "../constants/feed";
import { FeedMode } from "../types";
import { DUMMY_TECH_BLOGS } from "../data/dummyData";
import { useCompanyFeed } from "../hooks/useCompanyFeed";
import { useFeedFilters } from "../hooks/useFeedFilters";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useUser } from "../hooks/useUser";

function HomeContent({ initialMode }: { initialMode: FeedMode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useUser();
  const [readPostIdsByUser, setReadPostIdsByUser] = useState<Record<string, Set<string>>>(
    {},
  );

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

  const communityFeed = useCommunityFeed({
    enabled: filterState.mode === "user",
    period: communityPeriod,
    sort: communitySort,
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => setIsMobileSidebarOpen(true)}
        currentMode={filterState.mode}
        onModeChange={handleModeChange}
      />
      <div className="md:flex max-w-[1400px] mx-auto">
        <Sidebar
          mode={filterState.mode}
          filterState={filterState}
          onFilterChange={setFilterState}
          availableTags={[]}
          availableTechBlogs={DUMMY_TECH_BLOGS}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 md:max-w-[728px] mx-auto px-4 md:px-6 py-6">
          {filterState.mode === "user" && (
            <FilterBar
              filterState={filterState}
              onFilterChange={setFilterState}
            />
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
  const initialMode: FeedMode =
    modeParam === FEED_MODES.USER || modeParam === FEED_MODES.COMPANY
      ? modeParam
      : FEED_MODES.COMPANY;

  return <HomeContent key={initialMode} initialMode={initialMode} />;
}
