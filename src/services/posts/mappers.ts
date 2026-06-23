import { Post } from "../../types";
import { buildCommunityPostPath } from "../../lib/communityPostRoute";
import {
  normalizeEditablePostContent,
  normalizeEditablePostText,
} from "../../lib/post-write/editableContent";
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

function normalizePostTags(tags?: { id: string; name: string }[]) {
  return (tags ?? []).map((tag) => ({
    ...tag,
    name: normalizeEditablePostText(tag.name),
  }));
}

export function mapListItemToPost(item: PostListItem): Post {
  const resolvedPublishedAt = resolvePublishedAt(
    item.status,
    item.publishedAt,
    item.updatedAt,
    item.createdAt,
  );
  const rawCategoryPath = item.categoryPath ?? item.category?.path;
  const categoryPath = rawCategoryPath
    ? normalizeEditablePostText(rawCategoryPath)
    : undefined;
  const authorId = item.authorId ?? item.id;

  return {
    id: item.id,
    type: "community",
    status: item.status ?? "PUBLISHED",
    title: normalizeEditablePostText(item.title),
    content: item.content ? normalizeEditablePostContent(item.content) : undefined,
    categoryId: item.category?.id,
    viewCount: item.viewCount,
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount,
    tags: normalizePostTags(item.tags),
    author: {
      id: authorId,
      name: item.authorName,
      nickname: item.authorNickname,
      email: "",
      profileImageUrl: normalizeUrl(item.authorProfileImageUrl) || "",
      role: "USER",
    },
    categoryPath,
    isRead: item.isRead,
    publishedAt: resolvedPublishedAt,
    url: buildCommunityPostPath({
      nickname: item.authorNickname,
      fallbackName: item.authorName,
      categoryPath,
      postId: item.id,
    }),
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
  const categoryPath = detail.category?.path
    ? normalizeEditablePostText(detail.category.path)
    : undefined;

  return {
    id: detail.id,
    type: "community",
    status: detail.status ?? "PUBLISHED",
    title: detail.title ? normalizeEditablePostText(detail.title) : "새 게시물",
    content: normalizeEditablePostContent(detail.content || ""),
    viewCount: detail.viewCount ?? 0,
    likeCount: detail.likeCount ?? 0,
    likeStatus: detail.likeStatus ?? "NONE",
    commentCount: detail.commentCount ?? 0,
    tags: normalizePostTags(detail.tags),
    author: {
      id: detail.author.id,
      name: detail.author.name,
      nickname: detail.author.nickname,
      email: "",
      profileImageUrl: normalizeUrl(detail.author.profileImageUrl) || "",
      role: "USER",
    },
    categoryPath,
    isRead: Boolean(detail.isRead),
    attachmentPresignedUrls: detail.attachmentPresignedUrls,
    publishedAt: resolvedPublishedAt,
    url: buildCommunityPostPath({
      nickname: detail.author.nickname,
      fallbackName: detail.author.name,
      categoryPath,
      postId: detail.id,
    }),
  };
}
