import { createCommentRequest, fetchCommentsRequest } from "./client";
import {
  CreateCommentRequest,
  CreateCommentResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
  FetchCommentsRequest,
  FetchCommentsResponse,
} from "./types";
import { deleteCommentRequest, updateCommentRequest } from "./client";

export async function createComment(
  payload: CreateCommentRequest,
): Promise<CreateCommentResponse> {
  return createCommentRequest(payload);
}

export async function updateComment(
  commentId: string,
  payload: UpdateCommentRequest,
): Promise<UpdateCommentResponse> {
  return updateCommentRequest(commentId, payload);
}

export async function deleteComment(commentId: string): Promise<void> {
  return deleteCommentRequest(commentId);
}

export async function fetchComments(
  payload: FetchCommentsRequest,
): Promise<FetchCommentsResponse> {
  return fetchCommentsRequest(payload);
}
