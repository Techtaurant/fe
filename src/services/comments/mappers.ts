import { Comment } from "../../types";
import {
  CommentListResponse,
  CreateCommentResponse,
  UpdateCommentResponse,
} from "./types";

interface CommentPayload {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  depth: number;
  isDeleted: boolean;
  isBanned?: boolean;
  likeStatus?: "NONE" | "LIKE" | "DISLIKE";
  createdAt: string;
}

function normalizeComment(
  payload: CommentPayload & {
    parentId?: string | null;
  },
  profileImageUrl: string,
): Comment {
  return {
    id: payload.id,
    content: payload.content,
    author: {
      id: payload.authorId,
      name: payload.authorName,
      email: "",
      profileImageUrl,
      role: "USER",
    },
    createdAt: payload.createdAt,
    likeCount: 0,
    likeStatus: payload.likeStatus ?? "NONE",
    replyCount: 0,
    isDeleted: payload.isDeleted,
    isBanned: payload.isBanned ?? false,
    depth: payload.depth,
    parentId: payload.parentId ?? null,
  };
}

export function mapCommentListItemToComment(item: CommentListResponse): Comment {
  return {
    id: item.id,
    content: item.content,
    author: {
      id: item.authorId,
      name: item.authorName,
      email: "",
      profileImageUrl: item.authorProfileImageUrl || "",
      role: "USER",
    },
    createdAt: item.createdAt,
    likeCount: item.likeCount,
    likeStatus: item.likeStatus ?? "NONE",
    replyCount: item.replyCount,
    isDeleted: item.isDeleted,
    isBanned: item.isBanned ?? false,
    depth: item.depth,
    parentId: item.parentId ?? null,
  };
}

export function mapCreatedCommentToComment(
  payload: CreateCommentResponse["data"],
  profileImageUrl: string,
): Comment {
  return normalizeComment(payload, profileImageUrl);
}

export function mapUpdatedCommentToComment(
  payload: UpdateCommentResponse["data"],
  profileImageUrl: string,
): Comment {
  return normalizeComment(payload, profileImageUrl);
}
