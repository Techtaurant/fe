"use client";

import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import Header from "../../components/Header";
import CommunityFeedSection from "../../components/feed/CommunityFeedSection";
import { FEED_MODES } from "../../constants/feed";
import { FeedMode } from "../../types";
import { PostListPeriod, PostListSort, UserCategory } from "../../services/posts/types";
import { useUserCategories } from "../../hooks/useUserCategories";
import { useUserCommunityFeed } from "../../hooks/useUserCommunityFeed";
import {
  UNCATEGORIZED_CATEGORY_ID,
  UNCATEGORIZED_CATEGORY_PATH,
  useUserCategoryPostCounts,
} from "../../hooks/useUserCategoryPostCounts";
import { useUser } from "../../hooks/useUser";

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
    const parentPath = node.path.split("/").slice(0, -1).join("/");
    const parent = parentPath ? nodesByPath.get(parentPath) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

function buildCategoryFilters(
  categories: UserCategory[],
  countsByCategoryId: Record<string, number>,
): CategoryFilter[] {
  return categories
    .map((category) => ({
      id: category.id,
      path: category.path,
      label: category.name,
      depth: Math.max(category.depth - 1, 0),
      count: countsByCategoryId[category.id] ?? 0,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function renderCategoryList(params: {
  nodes: CategoryTreeNode[];
  selectedCategoryPath: string | null;
  expandedCategoryIds: Record<string, boolean>;
  onSelectCategory: (path: string) => void;
  onToggleCategory: (categoryId: string) => void;
}) {
  const {
    nodes,
    selectedCategoryPath,
    expandedCategoryIds,
    onSelectCategory,
    onToggleCategory,
  } = params;

  const renderList = (children: CategoryTreeNode[]): ReactNode[] =>
    children.flatMap((node) => {
      const hasChildren = node.children.length > 0;
      const shouldAutoExpand =
        selectedCategoryPath !== null &&
        (node.path === selectedCategoryPath || selectedCategoryPath.startsWith(`${node.path}/`));
      const isExpanded = expandedCategoryIds[node.id] ?? shouldAutoExpand;
      const isSelected = selectedCategoryPath === node.path;

      const renderedChildren: ReactNode[] = isExpanded ? renderList(node.children) : [];

      return [
        <div
          key={node.id}
          className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
            isSelected
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          } cursor-pointer`}
          style={{ paddingLeft: `${16 + node.depth * 12}px` }}
          role="button"
          tabIndex={0}
          onClick={() => onSelectCategory(node.path)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectCategory(node.path);
            }
          }}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleCategory(node.id);
                }}
                className="h-4 w-4 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center transition-colors"
                aria-label={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="h-4 w-4" />
            )}

            <span className="whitespace-nowrap">{node.label}</span>
            <span className="ml-1 inline-flex text-xs text-muted-foreground">({node.count})</span>
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
      className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
        isSelected
          ? "bg-muted text-foreground font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } cursor-pointer`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="whitespace-nowrap">{item.label}</span>
        {item.count !== null ? <span className="text-xs text-muted-foreground">({item.count})</span> : null}
      </div>
    </button>
  );
}

export default function UserDetailPage() {
  const t = useTranslations("UserPage");
  const params = useParams();
  const userId = typeof params.id === "string" ? params.id : "";
  const [currentMode, setCurrentMode] = useState<FeedMode>(FEED_MODES.USER);

  const [period, setPeriod] = useState<PostListPeriod>("ALL");
  const [sort, setSort] = useState<PostListSort>("LATEST");
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  const hasUserId = Boolean(userId);
  const { user: currentUser } = useUser();
  const includePrivatePosts = Boolean(currentUser && currentUser.id === userId);

  const { categories } = useUserCategories({
    enabled: hasUserId,
    userId,
  });

  const { countsByCategoryId } = useUserCategoryPostCounts({
    enabled: hasUserId,
    userId,
    categories,
    includePrivatePosts,
  });

  const categoryFilters = useMemo(
    () => buildCategoryFilters(categories, countsByCategoryId),
    [categories, countsByCategoryId],
  );

  const uncategorizedCategoryFilter = useMemo(
    () => ({
      id: UNCATEGORIZED_CATEGORY_ID,
      path: UNCATEGORIZED_CATEGORY_PATH,
      label: t("categories.uncategorized"),
      count: countsByCategoryId[UNCATEGORIZED_CATEGORY_ID] ?? 0,
    }),
    [countsByCategoryId, t],
  );

  const categoryActionItems = useMemo(
    () => [
      {
        id: "all",
        path: null as null,
        label: t("categories.all"),
        count: null,
      },
      {
        ...uncategorizedCategoryFilter,
        path: UNCATEGORIZED_CATEGORY_PATH,
      },
    ],
    [t, uncategorizedCategoryFilter],
  );

  const categoryTree = useMemo(() => buildCategoryTree(categoryFilters), [categoryFilters]);

  const periodOptions = useMemo(
    () =>
      [
        { value: "ALL", label: t("period.all") },
        { value: "WEEK", label: t("period.week") },
        { value: "MONTH", label: t("period.month") },
        { value: "YEAR", label: t("period.year") },
      ] as const,
    [t],
  );

  const sortOptions = useMemo(
    () =>
      [
        { value: "LATEST", label: t("sort.latest") },
        { value: "LIKE", label: t("sort.like") },
        { value: "COMMENT", label: t("sort.comment") },
        { value: "VIEW", label: t("sort.view") },
      ] as const,
    [t],
  );

  const handleCategorySelect = useCallback((path: string) => {
    setSelectedCategoryPath(path);
  }, []);

  const activeCategoryPath = useMemo(() => {
    if (selectedCategoryPath === null) {
      return null;
    }

    if (selectedCategoryPath === UNCATEGORIZED_CATEGORY_PATH) {
      return UNCATEGORIZED_CATEGORY_PATH;
    }

    return categoryFilters.some((category) => category.path === selectedCategoryPath)
      ? selectedCategoryPath
      : null;
  }, [categoryFilters, selectedCategoryPath]);

  const selectedCategoryIds = useMemo(() => {
    if (!activeCategoryPath) {
      return [] as string[];
    }

    if (activeCategoryPath === UNCATEGORIZED_CATEGORY_PATH) {
      return [UNCATEGORIZED_CATEGORY_ID];
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
    const firstPostWithAuthor = postsByAuthor.posts.find((post) => post.author?.name);
    return {
      profileName: firstPostWithAuthor?.author?.name || userId,
      profileImageUrl: firstPostWithAuthor?.author?.profileImageUrl || "",
    };
  }, [postsByAuthor.posts, userId]);

  const { profileName, profileImageUrl } = profileAuthor;

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setExpandedCategoryIds((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  }, []);

  const renderedCategoryRows = useMemo(
    () =>
      renderCategoryList({
        nodes: categoryTree,
        selectedCategoryPath: activeCategoryPath,
        expandedCategoryIds,
        onSelectCategory: handleCategorySelect,
        onToggleCategory: handleCategoryToggle,
      }),
    [
      categoryTree,
      expandedCategoryIds,
      handleCategorySelect,
      handleCategoryToggle,
      activeCategoryPath,
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onMenuClick={() => {}}
      />

      <div className="md:flex max-w-[1280px] mx-auto px-4 md:px-6 py-6 gap-6">
        <aside className="hidden md:block w-[250px] shrink-0">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 px-1 text-sm font-semibold text-foreground">
              {t("categories.title")}
            </div>

            <div className="mt-2 flex flex-col gap-1">{renderedCategoryActionRows}</div>

            {categoryTree.length > 0 ? (
              <div className="mt-2 flex flex-col gap-1">{renderedCategoryRows}</div>
            ) : null}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="md:hidden mb-4 rounded-xl border border-border bg-card p-3">
            <div className="mb-3 px-1 text-sm font-semibold text-foreground">
              {t("categories.title")}
            </div>

            <div className="mt-2 flex flex-col gap-1">{renderedCategoryActionRows}</div>

            {categoryTree.length > 0 ? (
              <div className="mt-2 flex flex-col gap-1">{renderedCategoryRows}</div>
            ) : null}
          </div>

          <div className="mb-6 flex items-center gap-4 px-1">
            <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt={profileName}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">
                  {(profileName || "?").charAt(0)}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground truncate">{profileName}</h1>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 mb-4 border-b border-border">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {periodOptions.map((option) => {
                const isActive = period === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriod(option.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-sm overflow-x-auto no-scrollbar">
              {sortOptions.map((option) => {
                const isActive = sort === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSort(option.value)}
                    className={`whitespace-nowrap transition-colors ${
                      isActive
                        ? "font-bold text-foreground"
                        : "font-medium text-muted-foreground hover:text-foreground"
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

          {( !hasUserId
            || (!postsByAuthor.isLoading && postsByAuthor.posts.length === 0 && !postsByAuthor.hasNext)
          ) ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
