"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Header from "../../components/Header";
import PostCard from "../../components/PostCard";
import { FEED_MODES } from "../../constants/feed";
import { DUMMY_USERS } from "../../data/dummyData";
import { Post, Tag, User, FeedMode } from "../../types";

interface Category {
  id: string;
  name: string;
  count: number;
  children?: Category[];
}

const DUMMY_CATEGORIES: Category[] = [
  { id: "all", name: "전체", count: 120 },
  {
    id: "tech",
    name: "기술",
    count: 85,
    children: [
      {
        id: "frontend",
        name: "프론트엔드",
        count: 45,
        children: [
          {
            id: "react",
            name: "React",
            count: 20,
            children: [
              {
                id: "react-hooks",
                name: "Hooks",
                count: 10,
                children: [
                  { id: "custom-hooks", name: "Custom Hooks", count: 5 },
                ],
              },
              { id: "react-state", name: "State Management", count: 8 },
            ],
          },
          { id: "vue", name: "Vue.js", count: 15 },
          { id: "nextjs", name: "Next.js", count: 10 },
        ],
      },
      {
        id: "backend",
        name: "백엔드",
        count: 40,
        children: [
          { id: "nodejs", name: "Node.js", count: 20 },
          { id: "python", name: "Python", count: 15 },
          { id: "java", name: "Java", count: 5 },
        ],
      },
    ],
  },
  {
    id: "career",
    name: "커리어",
    count: 25,
    children: [
      { id: "interview", name: "면접", count: 10 },
      { id: "resume", name: "이력서", count: 5 },
      {
        id: "life",
        name: "회사생활",
        count: 10,
        children: [{ id: "burnout", name: "번아웃 극복", count: 3 }],
      },
    ],
  },
  { id: "project", name: "프로젝트", count: 10 },
];

const DUMMY_USERS_BY_ID: Record<string, User> = Object.fromEntries(
  DUMMY_USERS.map((user) => [user.id, user]),
);

const DUMMY_USER_POSTS: Record<string, Post[]> = {
  u1: [
    {
      id: "p1",
      type: "community",
      title: "주니어 개발자의 이직 회고",
      viewCount: 1200,
      likeCount: 56,
      commentCount: 12,
      tags: [],
      author: DUMMY_USERS_BY_ID["u1"],
      isRead: false,
      publishedAt: "2025-01-16",
      url: "/post/p1",
    },
    {
      id: "p2",
      type: "community",
      title: "React 18 신기능 정리",
      viewCount: 890,
      likeCount: 34,
      commentCount: 8,
      tags: [],
      author: DUMMY_USERS_BY_ID["u1"],
      isRead: true,
      publishedAt: "2025-01-10",
      url: "/post/p2",
    },
    {
      id: "p3",
      type: "community",
      title: "TypeScript 5.0 마이그레이션 가이드",
      viewCount: 650,
      likeCount: 28,
      commentCount: 5,
      tags: [],
      author: DUMMY_USERS_BY_ID["u1"],
      isRead: false,
      publishedAt: "2025-01-05",
      url: "/post/p3",
    },
  ],
  u2: [
    {
      id: "p4",
      type: "community",
      title: "사이드 프로젝트 실패 경험담",
      viewCount: 2100,
      likeCount: 89,
      commentCount: 23,
      tags: [],
      author: DUMMY_USERS_BY_ID["u2"],
      isRead: false,
      publishedAt: "2025-01-14",
      url: "/post/p4",
    },
  ],
  u3: [
    {
      id: "p5",
      type: "community",
      title: "DevOps 입문하기",
      viewCount: 450,
      likeCount: 15,
      commentCount: 3,
      tags: [],
      author: DUMMY_USERS_BY_ID["u3"],
      isRead: false,
      publishedAt: "2025-01-12",
      url: "/post/p5",
    },
  ],
};

// 사용자별 태그 집계
function getUserTags(posts: Post[]): { tag: Tag; count: number }[] {
  const tagCounts = new Map<string, { tag: Tag; count: number }>();

  posts.forEach((post) => {
    post.tags?.forEach((tag) => {
      const existing = tagCounts.get(tag.id);
      if (existing) {
        existing.count++;
      } else {
        tagCounts.set(tag.id, { tag, count: 1 });
      }
    });
  });

  return Array.from(tagCounts.values()).sort((a, b) => b.count - a.count);
}

interface CategoryTreeItemProps {
  category: Category;
  depth: number;
  selectedId: string;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

function CategoryTreeItem({
  category,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}: CategoryTreeItemProps) {
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedId === category.id;
  const hasChildren = category.children && category.children.length > 0;

  // Max depth check to prevent infinite recursion issues if data was malformed, though 5 is requirement
  if (depth > 5) return null;

  return (
    <li className="flex flex-col">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(category.id);
          if (hasChildren) {
            onToggle(category.id);
          }
        }}
        className={`w-full flex items-center justify-between py-2 pr-2 rounded-[6px] text-[14px] transition-colors duration-200 group ${
          isSelected
            ? "bg-[#F7F7F7] text-black font-bold"
            : "text-[#757575] hover:bg-[#FAFAFA]"
        }`}
        style={{ paddingLeft: `${Math.max(4, depth * 12 + 4)}px` }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {hasChildren && (
            <span
              className={`transform transition-transform duration-200 flex-shrink-0 ${
                isExpanded ? "rotate-90" : ""
              }`}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 1.5L7.5 5L3.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
          {!hasChildren && <span className="w-[10px] flex-shrink-0" />}
          <span className="truncate">{category.name}</span>
        </div>
        <span
          className={`text-[12px] flex-shrink-0 ml-2 ${
            isSelected
              ? "text-black"
              : "text-[#999999] group-hover:text-[#757575]"
          }`}
        >
          {category.count}
        </span>
      </button>
      {hasChildren && isExpanded && (
        <ul className="flex flex-col mt-0.5">
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [currentMode, setCurrentMode] = useState<FeedMode>(FEED_MODES.USER);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["tech", "frontend"]), // Default expanded for demo
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagSearchTerm, setTagSearchTerm] = useState("");

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const user = DUMMY_USERS_BY_ID[userId];
  const userPosts = DUMMY_USER_POSTS[userId] || [];
  const userTags = getUserTags(userPosts);

  const totalViews = userPosts.reduce((sum, p) => sum + p.viewCount, 0);
  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
  const totalComments = userPosts.reduce(
    (sum, p) => sum + (p.commentCount || 0),
    0,
  );

  // 태그 검색 필터링
  const filteredTags = userTags.filter((tagItem) =>
    tagItem.tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()),
  );

  // 필터링된 게시물
  const filteredPosts = userPosts.filter((post) => {
    if (selectedTag) {
      return post.tags?.some((tag) => tag.id === selectedTag);
    }
    return true;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          onMenuClick={() => {}}
        />
        <div className="max-w-[728px] mx-auto px-6 py-12">
          <p className="text-center text-[#757575] font-kr-sans">
            사용자를 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#242424]">
      <Header
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onMenuClick={() => {}}
      />

      {/* Page Container: layout.containers.page */}
      <div className="max-w-[1400px] mx-auto px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Main Content Area: layout.containers.content */}
          {/* Note: In a typical blog layout, content is often on the left/center. 
              The design system definitions for 'sidebar' (230px) and 'content' (728px) 
              suggest a specific ratio. 
              Here we keep the sidebar on the left as per original, but adjust widths. */}

          {/* Sidebar */}
          <aside className="w-full md:w-[230px] flex-shrink-0 flex flex-col gap-8">
            {/* User Profile Section */}
            <div className="flex flex-col items-start text-left">
              {/* Avatar: avatar.sizes.xl (80px) */}
              <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden bg-[#F2F2F2] flex items-center justify-center mb-4">
                {user.profileImageUrl ? (
                  <Image
                    src={user.profileImageUrl}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-3xl font-kr-serif text-[#757575]">
                    {user.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Name: typography.styles.h2 (but used as main profile name here, so maybe larger?) 
                  Design system h1 is 40px serif. h2 is 24px serif. 
                  Let's match h2 for sidebar context or slightly larger. 
                  Let's use standard font-bold text-xl for now, but font-serif. */}
              <h1 className="font-kr-serif text-[24px] font-bold text-black leading-tight mb-2">
                {user.name}
              </h1>

              {/* Email/Meta: typography.styles.caption (sans, 14px, gray.600) */}
              <p className="font-kr-sans text-[14px] text-[#757575] mb-6">
                {user.email}
              </p>

              {/* Social Stats Row */}
              <div className="flex items-center gap-5 mb-6 px-1">
                <div className="flex items-center gap-1.5 cursor-pointer group">
                  <span className="font-kr-sans text-[15px] font-bold text-black group-hover:text-gray-700">
                    {(user.followerCount || 0).toLocaleString()}
                  </span>
                  <span className="font-kr-sans text-[14px] text-[#757575] group-hover:text-[#242424]">
                    팔로워
                  </span>
                </div>
                <div className="flex items-center gap-1.5 cursor-pointer group">
                  <span className="font-kr-sans text-[15px] font-bold text-black group-hover:text-gray-700">
                    {(user.followingCount || 0).toLocaleString()}
                  </span>
                  <span className="font-kr-sans text-[14px] text-[#757575] group-hover:text-[#242424]">
                    팔로잉
                  </span>
                </div>
              </div>

              {/* Activity Stats List */}
              <div className="flex flex-col gap-3 border-y border-[#F2F2F2] py-5 mb-6">
                <div className="flex justify-between items-center text-[13px] hover:bg-[#FAFAFA] px-1 py-1 rounded transition-colors">
                  <span className="text-[#757575]">총 게시물</span>
                  <span className="font-medium text-[#242424]">
                    {userPosts.length.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px] hover:bg-[#FAFAFA] px-1 py-1 rounded transition-colors">
                  <span className="text-[#757575]">총 조회수</span>
                  <span className="font-medium text-[#242424]">
                    {totalViews.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px] hover:bg-[#FAFAFA] px-1 py-1 rounded transition-colors">
                  <span className="text-[#757575]">받은 좋아요</span>
                  <span className="font-medium text-[#242424]">
                    {totalLikes.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px] hover:bg-[#FAFAFA] px-1 py-1 rounded transition-colors">
                  <span className="text-[#757575]">받은 댓글</span>
                  <span className="font-medium text-[#242424]">
                    {totalComments.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Navigation */}
            <div>
              {/* Header: typography.styles.h3 (sans, 16px, bold) */}
              <h3 className="font-kr-sans text-[16px] font-bold text-black mb-4">
                카테고리
              </h3>
              <ul className="flex flex-col gap-0.5">
                {DUMMY_CATEGORIES.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    depth={0}
                    selectedId={selectedCategory}
                    expandedIds={expandedCategories}
                    onSelect={(id) => {
                      setSelectedCategory(id);
                      setSelectedTag(null);
                    }}
                    onToggle={toggleCategory}
                  />
                ))}
              </ul>
            </div>

            {/* Tags Section */}
            <div>
              <h3 className="font-kr-sans text-[16px] font-bold text-black mb-4">
                태그
              </h3>

              {/* Tag Search Input */}
              <div className="mb-4 relative">
                <input
                  type="text"
                  placeholder="태그 검색..."
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#E6E6E6] rounded-[20px] py-2 px-4 pl-9 text-[13px] outline-none 
                           transition-colors focus:bg-white focus:border-black placeholder:text-[#999999]"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]"
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

              <div className="flex flex-wrap gap-2">
                {filteredTags.map(({ tag, count }) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setSelectedTag(selectedTag === tag.id ? null : tag.id)
                    }
                    className={`px-3 py-1.5 rounded-[4px] text-[13px] transition-colors duration-200 border ${
                      selectedTag === tag.id
                        ? "border-black bg-black text-white"
                        : "border-[#E6E6E6] bg-white text-[#757575] hover:border-[#999999]"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
                {filteredTags.length === 0 && (
                  <p className="text-[14px] text-[#999999]">태그가 없습니다.</p>
                )}
              </div>
            </div>
          </aside>

          {/* Main Feed Section */}
          <main className="flex-1 max-w-[728px]">
            {/* Header Area */}
            <div className="mb-8 border-b border-[#E6E6E6] pb-4">
              <h2 className="font-kr-serif text-[40px] font-bold text-black leading-tight">
                {user.name}의 글
              </h2>
              {selectedTag && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[14px] text-[#757575]">
                    filtered by
                  </span>
                  <span className="px-2 py-0.5 bg-[#F2F2F2] rounded-[4px] text-[13px] text-[#242424]">
                    #{userTags.find((t) => t.tag.id === selectedTag)?.tag.name}
                  </span>
                </div>
              )}
            </div>

            {/* Post Feed */}
            <div className="flex flex-col">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="py-12 text-center text-[#999999]">
                  게시물이 없습니다.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
