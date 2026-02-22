import { createCommentRequest, fetchCommentsRequest } from "./client";
import {
  CreateCommentRequest,
  CreateCommentResponse,
  FetchCommentsRequest,
  FetchCommentsResponse,
} from "./types";

export async function createComment(
  payload: CreateCommentRequest,
): Promise<CreateCommentResponse> {
  return createCommentRequest(payload);
}

export async function fetchComments(
  payload: FetchCommentsRequest,
): Promise<FetchCommentsResponse> {
  return fetchCommentsRequest(payload);
}
