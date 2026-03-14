import { Post } from "@/app/types";
import { PostDetailResponse, PostListItem } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function normalizeUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url}`;
}

function resolvePublishedAt(
  status: PostListItem["status"] | PostDetailResponse["data"]["status"],
  publishedAt?: string,
  updatedAt?: string,
  createdAt?: string,
): string {
  if (status === "DRAFT") {
    return updatedAt || createdAt || "";
  }

  return publishedAt || updatedAt || createdAt || "";
}

export function mapListItemToPost(item: PostListItem): Post {
  const resolvedPublishedAt = resolvePublishedAt(
    item.status,
    item.publishedAt,
    item.updatedAt,
    item.createdAt,
  );
  const categoryPath = item.categoryPath ?? item.category?.path;

  const authorId = item.authorId ?? item.id;

  return {
    id: item.id,
    type: "community",
    status: item.status ?? "PUBLISHED",
    title: item.title,
    content: item.content,
    categoryId: item.category?.id,
    viewCount: item.viewCount,
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount,
    tags: item.tags,
    author: {
      id: authorId,
      name: item.authorName,
      email: "",
      profileImageUrl: normalizeUrl(item.authorProfileImageUrl) || "",
      role: "USER",
    },
    categoryPath,
    isRead: item.isRead,
    publishedAt: resolvedPublishedAt,
    url: `/post/${item.id}`,
    thumbnailUrl: normalizeUrl(item.thumbnailUrl),
  };
}

export function mapDetailToPost(detail: PostDetailResponse["data"]): Post {
  const resolvedPublishedAt = resolvePublishedAt(
    detail.status,
    detail.publishedAt,
    detail.updatedAt,
    detail.createdAt,
  );
  const categoryPath = detail.category?.path;

  return {
    id: detail.id,
    type: "community",
    status: detail.status ?? "PUBLISHED",
    title: detail.title || "새 게시물",
    content: detail.content || "",
    viewCount: detail.viewCount ?? 0,
    likeCount: detail.likeCount ?? 0,
    commentCount: detail.commentCount ?? 0,
    tags: detail.tags ?? [],
    author: {
      id: detail.author.id,
      name: detail.author.name,
      email: "",
      profileImageUrl: normalizeUrl(detail.author.profileImageUrl) || "",
      role: "USER",
    },
    categoryPath,
    isRead: Boolean(detail.isRead),
    publishedAt: resolvedPublishedAt,
    url: `/post/${detail.id}`,
  };
}
