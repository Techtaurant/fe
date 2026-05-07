"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import PostCard from "../components/PostCard";
import { FEED_MODES } from "../constants/feed";
import { FeedMode, Post } from "../types";
import { DUMMY_COMPANY_POSTS } from "../data/dummyData";
import { fetchCommunityPostList } from "../services/posts";

const SEARCH_COMMUNITY_FETCH_SIZE = 50;
const SEARCH_COMMUNITY_MAX_PAGES = 10;

async function fetchCommunityPostsForSearch(): Promise<Post[]> {
  const postsById = new Map<string, Post>();
  let cursor: string | undefined;

  for (let page = 0; page < SEARCH_COMMUNITY_MAX_PAGES; page += 1) {
    const result = await fetchCommunityPostList({
      cursor,
      size: SEARCH_COMMUNITY_FETCH_SIZE,
      period: "ALL",
      sort: "LATEST",
    });

    result.posts.forEach((post) => {
      postsById.set(post.id, post);
    });

    if (!result.nextCursor) {
      break;
    }

    cursor = result.nextCursor;
  }

  return Array.from(postsById.values());
}

function filterPosts(posts: Post[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return posts.filter((post) => {
    if (post.title.toLowerCase().includes(q)) return true;

    if (post.content?.toLowerCase().includes(q)) return true;

    if (post.tags?.some((tag) => tag.name.toLowerCase().includes(q))) {
      return true;
    }

    if (post.techBlog?.name?.toLowerCase().includes(q)) return true;

    if (post.author?.name?.toLowerCase().includes(q)) return true;

    return false;
  });
}

function SearchPageContent() {
  const t = useTranslations("SearchPage");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(initialQuery);
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const [mode, setMode] = useState<FeedMode>(FEED_MODES.COMPANY);

  useEffect(() => {
    setInputValue(initialQuery);
    setCommittedQuery(initialQuery);
  }, [initialQuery]);

  const communityPostsQuery = useQuery({
    queryKey: ["search", "community-posts"],
    queryFn: fetchCommunityPostsForSearch,
    staleTime: 1000 * 60 * 5,
  });

  const posts = useMemo(
    () => [...DUMMY_COMPANY_POSTS, ...(communityPostsQuery.data ?? [])],
    [communityPostsQuery.data],
  );

  const results = useMemo(
    () => filterPosts(posts, committedQuery),
    [posts, committedQuery]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      router.push(`/${locale}/search`);
      return;
    }
    router.push(`/${locale}/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentMode={mode} onModeChange={setMode} />
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-6">
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder={t("placeholder")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-muted border-none rounded-full
                       py-3 pl-11 pr-4 text-sm text-foreground
                       transition-colors duration-200
                       focus:bg-muted/70 focus:outline-none"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
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

        {!committedQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              {t("emptyPrompt")}
            </p>
          </div>
        ) : communityPostsQuery.isPending ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-col gap-6">
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              {t("noResults")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
