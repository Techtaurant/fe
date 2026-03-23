import {
  createCommentRequest,
  fetchCommentsRequest,
  fetchCommentRepliesRequest,
  updateCommentLikeRequest,
} from "./client";
import {
  CreateCommentRequest,
  CreateCommentResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
  UpdateCommentLikeRequest,
  UpdateCommentLikeResponse,
  FetchCommentsRequest,
  FetchCommentsResponse,
  FetchCommentRepliesRequest,
  FetchCommentRepliesResponse,
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

export async function fetchCommentReplies(
  payload: FetchCommentRepliesRequest,
): Promise<FetchCommentRepliesResponse> {
  return fetchCommentRepliesRequest(payload);
}

export async function updateCommentLike(
  commentId: string,
  payload: UpdateCommentLikeRequest,
): Promise<UpdateCommentLikeResponse> {
  return updateCommentLikeRequest(commentId, payload);
}
