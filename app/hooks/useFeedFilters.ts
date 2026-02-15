"use client";

import { useMemo, useState } from "react";
import { FEED_MODES } from "../constants/feed";
import { FeedMode, FilterState, Post } from "../types";
import { PostListPeriod, PostListSort } from "../services/posts/types";

interface UseFeedFiltersArgs {
  initialMode: FeedMode;
}

export function useFeedFilters({ initialMode }: UseFeedFiltersArgs) {
  const [filterState, setFilterState] = useState<FilterState>({
    mode: initialMode,
    dateRange: "all",
    sortBy: "latest",
    searchUser: "",
    hideReadPosts: false,
    selectedTags: [],
    selectedTechBlogs: [],
  });

  const handleModeChange = (mode: FeedMode) => {
    setFilterState((prev) => ({
      ...prev,
      mode,
      sortBy: "latest",
    }));
  };

  const communityPeriod = useMemo<PostListPeriod>(() => {
    if (filterState.dateRange === "7d") return "WEEK";
    if (filterState.dateRange === "30d") return "MONTH";
    if (filterState.dateRange === "365d") return "YEAR";
    return "ALL";
  }, [filterState.dateRange]);

  const communitySort = useMemo<PostListSort>(() => {
    if (filterState.sortBy === "likes") return "LIKE";
    if (filterState.sortBy === "comments") return "COMMENT";
    if (filterState.sortBy === "views" || filterState.sortBy === "popular") {
      return "VIEW";
    }
    return "LATEST";
  }, [filterState.sortBy]);

  const getVisiblePosts = (posts: Post[]) => {
    const filteredPosts = posts.filter((post) => {
      if (filterState.hideReadPosts && post.isRead) return false;

      if (
        filterState.selectedTags.length > 0 &&
        !post.tags?.some((tag) => filterState.selectedTags.includes(tag.id))
      ) {
        return false;
      }

      if (filterState.mode === FEED_MODES.COMPANY) {
        if (
          filterState.selectedTechBlogs.length > 0 &&
          post.techBlog &&
          !filterState.selectedTechBlogs.includes(post.techBlog.id)
        ) {
          return false;
        }
      } else {
        if (filterState.dateRange !== "all") {
          const postDate = new Date(post.publishedAt);
          const now = new Date();
          let days = 0;
          if (filterState.dateRange === "7d") days = 7;
          else if (filterState.dateRange === "30d") days = 30;
          else if (filterState.dateRange === "365d") days = 365;

          const diffTime = Math.abs(now.getTime() - postDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > days) return false;
        }

        if (filterState.searchUser && post.author) {
          if (
            !post.author.name
              .toLowerCase()
              .includes(filterState.searchUser.toLowerCase())
          ) {
            return false;
          }
        }
      }

      return true;
    });

    return [...filteredPosts].sort((a, b) => {
      switch (filterState.sortBy) {
        case "popular":
          return b.viewCount - a.viewCount;
        case "comments":
          return (b.commentCount || 0) - (a.commentCount || 0);
        case "views":
          return b.viewCount - a.viewCount;
        case "likes":
          return (b.likeCount || 0) - (a.likeCount || 0);
        case "latest":
        default:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });
  };

  return {
    filterState,
    setFilterState,
    handleModeChange,
    communityPeriod,
    communitySort,
    getVisiblePosts,
  };
}
