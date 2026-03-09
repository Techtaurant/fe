export const LOCAL_DRAFT_VERSION = 1 as const;
export const LOCAL_SAVE_DEBOUNCE_MS = 5000;
export const AUTO_SAVE_DEBOUNCE_MS = 30_000;
export const AUTO_SAVE_RETRY_BASE_MS = 5000;
export const AUTO_SAVE_RETRY_MAX_MS = 30000;
export const AUTH_PRECHECK_DEBOUNCE_MS = 15_000;
export const AUTH_HEARTBEAT_MS = 30_000;
export const PENDING_PUBLISH_VERSION = 1 as const;
export const PENDING_PUBLISH_STORAGE_KEY = "post:write:pendingPublish";
export const PENDING_PUBLISH_TTL_MS = 30 * 60 * 1000;
export const AUTH_RETURN_TO_STORAGE_KEY = "auth:returnTo";

export function getLocalDraftStorageKey(draftId: string | null) {
  return `post:write:autosave:${draftId ?? "new"}`;
}

export function createRequestId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
