import { Comment } from "@/app/types";
import { CommentListResponse, CreateCommentResponse } from "./types";

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
    replyCount: item.replyCount,
  };
}

export function mapCreatedCommentToComment(
  payload: CreateCommentResponse["data"],
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
    replyCount: 0,
  };
}
