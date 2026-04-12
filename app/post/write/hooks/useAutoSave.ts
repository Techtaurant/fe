import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/app/services/posts";
import { queryKeys } from "@/app/lib/queryKeys";
import { CreatePostRequest } from "@/app/types";
import {
  AUTO_SAVE_DEBOUNCE_MS,
  AUTO_SAVE_RETRY_BASE_MS,
  AUTO_SAVE_RETRY_MAX_MS,
  LOCAL_SAVE_DEBOUNCE_MS,
} from "../lib/constants";

interface UseAutoSaveParams {
  enabled?: boolean;
  user: unknown;
  draftId: string | null;
  draftDetailError: boolean;
  title: string;
  content: string;
  categoryPath: string;
  tags: string[];
  thumbnailAttachmentId: string | null;
  contentFingerprint: string;
  buildPostPayload: (status: "DRAFT") => CreatePostRequest;
  writeLocalDraftSnapshot: () => void;
  clearLocalDraftSnapshot: () => void;
  setAutoSaveNotice: (message: string | null) => void;
  queryClient: QueryClient;
  draftCountQueryKey: readonly unknown[];
  router: ReturnType<typeof useRouter>;
}

export function useAutoSave({
  enabled = true,
  user,
  draftId,
  draftDetailError,
  title,
  content,
  categoryPath,
  tags,
  thumbnailAttachmentId,
  contentFingerprint,
  buildPostPayload,
  writeLocalDraftSnapshot,
  clearLocalDraftSnapshot,
  setAutoSaveNotice,
  queryClient,
  draftCountQueryKey,
  router,
}: UseAutoSaveParams) {
  const t = useTranslations("WritePage.notice");
  const autoSaveDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localSaveDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveAbortControllerRef = useRef<AbortController | null>(null);
  const autoSaveRequestSequenceRef = useRef(0);
  const autoSaveAppliedSequenceRef = useRef(0);
  const autoSaveRetryDelayRef = useRef(AUTO_SAVE_RETRY_BASE_MS);
  const hasIncrementedDraftCountForCurrentCreateRef = useRef(false);
  const runAutoSaveRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    hasIncrementedDraftCountForCurrentCreateRef.current = false;
  }, [draftId]);

  const runAutoSave = useCallback(async () => {
    if (!enabled) return;
    if (!user) return;
    if (draftId && draftDetailError) return;
    if (
      !title.trim() &&
      !content.trim() &&
      !categoryPath.trim() &&
      tags.length === 0 &&
      !thumbnailAttachmentId
    ) {
      return;
    }

    if (autoSaveAbortControllerRef.current) {
      autoSaveAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    autoSaveAbortControllerRef.current = abortController;

    const requestSequence = ++autoSaveRequestSequenceRef.current;

    try {
      const payload = buildPostPayload("DRAFT");
      const result = draftId
        ? await updatePost(draftId, payload, abortController.signal)
        : await createPost(payload, abortController.signal);

      if (requestSequence < autoSaveAppliedSequenceRef.current) {
        return;
      }

      autoSaveAppliedSequenceRef.current = requestSequence;
      autoSaveRetryDelayRef.current = AUTO_SAVE_RETRY_BASE_MS;
      clearLocalDraftSnapshot();
      setAutoSaveNotice(t("autoSaved"));

      if (!draftId && !hasIncrementedDraftCountForCurrentCreateRef.current) {
        queryClient.setQueryData<number | null>(draftCountQueryKey, (current) => {
          if (typeof current !== "number") return current;
          return current + 1;
        });
        hasIncrementedDraftCountForCurrentCreateRef.current = true;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.posts.all, "drafts"] as const,
        }),
        queryClient.invalidateQueries({ queryKey: draftCountQueryKey }),
      ]);

      if (!draftId) {
        router.replace(`/post/write?draftId=${result.data.id}`);
      }
    } catch (saveError) {
      if (saveError instanceof DOMException && saveError.name === "AbortError") {
        return;
      }
      setAutoSaveNotice(t("autoSaveRetry"));
      if (autoSaveRetryTimerRef.current) {
        clearTimeout(autoSaveRetryTimerRef.current);
        autoSaveRetryTimerRef.current = null;
      }

      const retryDelay = autoSaveRetryDelayRef.current;
      autoSaveRetryDelayRef.current = Math.min(
        autoSaveRetryDelayRef.current * 2,
        AUTO_SAVE_RETRY_MAX_MS,
      );

      autoSaveRetryTimerRef.current = setTimeout(() => {
        void runAutoSaveRef.current();
      }, retryDelay);
    }
  }, [
    buildPostPayload,
    categoryPath,
    clearLocalDraftSnapshot,
    content,
    draftCountQueryKey,
    draftDetailError,
    draftId,
    queryClient,
    router,
    setAutoSaveNotice,
    tags.length,
    t,
    thumbnailAttachmentId,
    title,
    enabled,
    user,
  ]);

  useEffect(() => {
    runAutoSaveRef.current = runAutoSave;
  }, [runAutoSave]);

  useEffect(() => {
    if (!enabled) return;
    if (!title && !content && !categoryPath && tags.length === 0 && !thumbnailAttachmentId) return;

    if (localSaveDebounceTimerRef.current) {
      clearTimeout(localSaveDebounceTimerRef.current);
      localSaveDebounceTimerRef.current = null;
    }

    localSaveDebounceTimerRef.current = setTimeout(() => {
      writeLocalDraftSnapshot();
      setAutoSaveNotice(t("localSaved"));
    }, LOCAL_SAVE_DEBOUNCE_MS);

    if (autoSaveDebounceTimerRef.current) {
      clearTimeout(autoSaveDebounceTimerRef.current);
      autoSaveDebounceTimerRef.current = null;
    }

    if (autoSaveRetryTimerRef.current) {
      clearTimeout(autoSaveRetryTimerRef.current);
      autoSaveRetryTimerRef.current = null;
    }

    autoSaveDebounceTimerRef.current = setTimeout(() => {
      void runAutoSave();
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, [
    categoryPath,
    content,
    contentFingerprint,
    setAutoSaveNotice,
    tags.length,
    t,
    thumbnailAttachmentId,
    title,
    writeLocalDraftSnapshot,
    runAutoSave,
    enabled,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const flushAutoSave = () => {
      if (document.visibilityState === "hidden") {
        writeLocalDraftSnapshot();
        void runAutoSave();
      }
    };

    const flushBeforeUnload = () => {
      writeLocalDraftSnapshot();
      void runAutoSave();
    };

    document.addEventListener("visibilitychange", flushAutoSave);
    window.addEventListener("beforeunload", flushBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", flushAutoSave);
      window.removeEventListener("beforeunload", flushBeforeUnload);
    };
  }, [enabled, runAutoSave, writeLocalDraftSnapshot]);

  useEffect(() => {
    return () => {
      if (autoSaveDebounceTimerRef.current) clearTimeout(autoSaveDebounceTimerRef.current);
      if (localSaveDebounceTimerRef.current) clearTimeout(localSaveDebounceTimerRef.current);
      if (autoSaveRetryTimerRef.current) clearTimeout(autoSaveRetryTimerRef.current);
      if (autoSaveAbortControllerRef.current) autoSaveAbortControllerRef.current.abort();
    };
  }, []);
}
