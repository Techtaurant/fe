"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import FilterBar from "./components/FilterBar";
import CommunityFeedSection from "./components/feed/CommunityFeedSection";
import CompanyFeedSection from "./components/feed/CompanyFeedSection";
import { FEED_MODES } from "./constants/feed";
import { FeedMode } from "./types";
import { DUMMY_TECH_BLOGS } from "./data/dummyData";
import { useCommunityFeed } from "./hooks/useCommunityFeed";
import { useCompanyFeed } from "./hooks/useCompanyFeed";
import { useFeedFilters } from "./hooks/useFeedFilters";

function HomeContent({ initialMode }: { initialMode: FeedMode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // keep feed query synced to current filters
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
    if (filterState.mode === "company") {
      companyFeed.setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, isRead } : post)),
      );
    } else {
      communityFeed.setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, isRead } : post)),
      );
    }
  };

  const currentPosts =
    filterState.mode === FEED_MODES.COMPANY
      ? companyFeed.posts
      : communityFeed.posts;
  const visiblePosts = getVisiblePosts(currentPosts);

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
          {/* Community Mode일 때만 상단 필터 바 표시 */}
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
            />
          ) : (
            <CompanyFeedSection
              posts={visiblePosts}
              isLoading={companyFeed.isLoading}
              onReadStatusChange={handleReadStatusChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const initialMode: FeedMode =
    modeParam === FEED_MODES.USER || modeParam === FEED_MODES.COMPANY
      ? modeParam
      : FEED_MODES.COMPANY;

  return <HomeContent key={initialMode} initialMode={initialMode} />;
}
