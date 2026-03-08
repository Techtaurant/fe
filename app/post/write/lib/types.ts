import { CreatePostRequest, CreatePostResponse, PostStatus } from "@/app/types";

export interface FieldErrors {
  title: boolean;
  content: boolean;
}

export interface SavePostVariables {
  status: PostStatus;
  payload: CreatePostRequest;
  requestId: string;
  source: "manual" | "resume";
}

export interface SavePostResult {
  result: CreatePostResponse;
  status: PostStatus;
  requestedDraftId: string | null;
  source: "manual" | "resume";
}

export interface PendingPublishSnapshot {
  version: 1;
  createdAt: number;
  retried: boolean;
  requestId: string;
  path: string;
  draftId: string | null;
  status: "PUBLISHED" | "PRIVATE";
  payload: CreatePostRequest;
}

export interface LocalDraftSnapshot {
  version: 1;
  savedAt: number;
  draftId: string | null;
  title: string;
  content: string;
  categoryPath: string;
  tags: string[];
}
