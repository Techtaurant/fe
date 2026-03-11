import { Post } from "@/app/types";
import { PostDetailResponse, PostListItem } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function normalizeUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url}`;
}

export function mapListItemToPost(item: PostListItem): Post {
  const resolvedPublishedAt =
    item.publishedAt || item.updatedAt || item.createdAt;

  return {
    id: item.id,
    type: "community",
    status: item.status ?? "PUBLISHED",
    title: item.title,
    viewCount: item.viewCount,
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount,
    tags: item.tags,
    author: {
      id: item.id,
      name: item.authorName,
      email: "",
      profileImageUrl: normalizeUrl(item.authorProfileImageUrl) || "",
      role: "USER",
    },
    isRead: item.isRead,
    publishedAt: resolvedPublishedAt.slice(0, 10),
    url: `/post/${item.id}`,
    thumbnailUrl: normalizeUrl(item.thumbnailUrl),
  };
}

export function mapDetailToPost(detail: PostDetailResponse["data"]): Post {
  const resolvedPublishedAt =
    detail.publishedAt || detail.updatedAt || detail.createdAt;

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
    isRead: false,
    publishedAt: resolvedPublishedAt.slice(0, 10),
    url: `/post/${detail.id}`,
  };
}
