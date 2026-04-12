import { CreatePostRequest } from "@/app/types";
import {
  LOCAL_DRAFT_VERSION,
  PENDING_PUBLISH_STORAGE_KEY,
  PENDING_PUBLISH_TTL_MS,
  PENDING_PUBLISH_VERSION,
  createRequestId,
} from "./constants";
import { LocalDraftSnapshot, PendingPublishSnapshot } from "./types";

export function writeLocalDraftSnapshot(
  localDraftStorageKey: string,
  values: {
    draftId: string | null;
    title: string;
    content: string;
    categoryPath: string;
    tags: string[];
    thumbnailAttachmentId: string | null;
  },
) {
  if (typeof window === "undefined") return;

  const snapshot: LocalDraftSnapshot = {
    version: LOCAL_DRAFT_VERSION,
    savedAt: Date.now(),
    draftId: values.draftId,
    title: values.title,
    content: values.content,
    categoryPath: values.categoryPath,
    tags: values.tags,
    thumbnailAttachmentId: values.thumbnailAttachmentId,
  };

  window.localStorage.setItem(localDraftStorageKey, JSON.stringify(snapshot));
}

export function clearLocalDraftSnapshot(localDraftStorageKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(localDraftStorageKey);
}

export function readPendingPublishSnapshot(): PendingPublishSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_PUBLISH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingPublishSnapshot>;
    if (
      parsed.version !== PENDING_PUBLISH_VERSION ||
      typeof parsed.createdAt !== "number" ||
      Date.now() - parsed.createdAt > PENDING_PUBLISH_TTL_MS
    ) {
      window.sessionStorage.removeItem(PENDING_PUBLISH_STORAGE_KEY);
      return null;
    }

    if (parsed.status !== "PUBLISHED" && parsed.status !== "PRIVATE") {
      window.sessionStorage.removeItem(PENDING_PUBLISH_STORAGE_KEY);
      return null;
    }

    if (!parsed.payload || typeof parsed.payload !== "object") {
      window.sessionStorage.removeItem(PENDING_PUBLISH_STORAGE_KEY);
      return null;
    }

    if (typeof parsed.path !== "string" || parsed.path.length === 0) {
      window.sessionStorage.removeItem(PENDING_PUBLISH_STORAGE_KEY);
      return null;
    }

    return {
      version: PENDING_PUBLISH_VERSION,
      createdAt: parsed.createdAt,
      retried: Boolean(parsed.retried),
      requestId:
        typeof parsed.requestId === "string" ? parsed.requestId : createRequestId(),
      path: parsed.path,
      draftId: typeof parsed.draftId === "string" ? parsed.draftId : null,
      status: parsed.status,
      payload: parsed.payload as CreatePostRequest,
    };
  } catch {
    window.sessionStorage.removeItem(PENDING_PUBLISH_STORAGE_KEY);
    return null;
  }
}

export function writePendingPublishSnapshot(snapshot: PendingPublishSnapshot) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    PENDING_PUBLISH_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
}

export function clearPendingPublishSnapshot() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_PUBLISH_STORAGE_KEY);
}
