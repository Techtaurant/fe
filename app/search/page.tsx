"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import PostCard from "../components/PostCard";
import { FeedMode, Post } from "../types";
import {
  DUMMY_COMPANY_POSTS,
  DUMMY_COMMUNITY_POSTS,
} from "../data/dummyData";

function filterPosts(posts: Post[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return posts.filter((post) => {
    if (post.title.toLowerCase().includes(q)) return true;

    if (post.tags?.some((tag) => tag.name.toLowerCase().includes(q))) {
      return true;
    }

    if (post.techBlog?.name?.toLowerCase().includes(q)) return true;

    if (post.author?.name?.toLowerCase().includes(q)) return true;

    return false;
  });
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<FeedMode>("company");

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const posts = useMemo(() => {
    return mode === "company" ? DUMMY_COMPANY_POSTS : DUMMY_COMMUNITY_POSTS;
  }, [mode]);

  const results = useMemo(() => filterPosts(posts, query), [posts, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentMode={mode} onModeChange={setMode} />
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-6">
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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

        {!query.trim() ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              검색어를 입력하면 결과가 표시됩니다.
            </p>
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
              검색 결과가 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
