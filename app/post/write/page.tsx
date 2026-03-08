"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import {
  createPost,
  fetchDraftPostList,
  fetchDraftPostDetail,
  updatePost,
} from "@/app/services/posts";
import { httpClient } from "@/app/utils/httpClient";
import { useUser } from "@/app/hooks/useUser";
import { queryKeys } from "@/app/lib/queryKeys";
import { DraftPostListResult } from "@/app/services/posts/types";
import { CreatePostRequest, CreatePostResponse, PostStatus } from "@/app/types";

interface FieldErrors {
  title: boolean;
  content: boolean;
}

interface SavePostVariables {
  status: PostStatus;
  payload: CreatePostRequest;
  requestId: string;
  source: "manual" | "resume";
}

interface SavePostResult {
  result: CreatePostResponse;
  status: PostStatus;
  requestedDraftId: string | null;
  source: "manual" | "resume";
}

interface PendingPublishSnapshot {
  version: 1;
  createdAt: number;
  retried: boolean;
  requestId: string;
  path: string;
  draftId: string | null;
  status: "PUBLISHED" | "PRIVATE";
  payload: CreatePostRequest;
}

interface LocalDraftSnapshot {
  version: 1;
  savedAt: number;
  draftId: string | null;
  title: string;
  content: string;
  categoryPath: string;
  tags: string[];
}

const LOCAL_DRAFT_VERSION = 1 as const;
const LOCAL_SAVE_DEBOUNCE_MS = 5000;
const AUTO_SAVE_DEBOUNCE_MS = 30_000;
const AUTO_SAVE_RETRY_BASE_MS = 5000;
const AUTO_SAVE_RETRY_MAX_MS = 30000;
const AUTH_PRECHECK_DEBOUNCE_MS = 15_000;
const AUTH_HEARTBEAT_MS = 30_000;
const PENDING_PUBLISH_VERSION = 1 as const;
const PENDING_PUBLISH_STORAGE_KEY = "post:write:pendingPublish";
const PENDING_PUBLISH_TTL_MS = 30 * 60 * 1000;
const AUTH_RETURN_TO_STORAGE_KEY = "auth:returnTo";

function getLocalDraftStorageKey(draftId: string | null) {
  return `post:write:autosave:${draftId ?? "new"}`;
}

function createRequestId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 게시물 작성/수정 페이지
 * - 왼쪽: 마크다운 에디터
 * - 오른쪽: 실시간 프리뷰
 */
export default function WritePostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const draftId = searchParams.get("draftId");
  const localDraftStorageKey = getLocalDraftStorageKey(draftId);
  const draftCountQueryKey = [...queryKeys.posts.all, "drafts-count"] as const;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryPath, setCategoryPath] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAuthExpiredModalOpen, setIsAuthExpiredModalOpen] = useState(false);
  const [autoSaveNotice, setAutoSaveNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    title: false,
    content: false,
  });
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const autoSaveDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localSaveDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authPrecheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authHeartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveAbortControllerRef = useRef<AbortController | null>(null);
  const isSessionRefreshInFlightRef = useRef(false);
  const autoSaveRequestSequenceRef = useRef(0);
  const autoSaveAppliedSequenceRef = useRef(0);
  const autoSaveRetryDelayRef = useRef(AUTO_SAVE_RETRY_BASE_MS);
  const hasIncrementedDraftCountForCurrentCreateRef = useRef(false);

  const draftDetailQuery = useQuery({
    queryKey: queryKeys.posts.draftDetail(draftId ?? ""),
    queryFn: () => fetchDraftPostDetail(draftId as string),
    enabled: Boolean(draftId),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const draftCountQuery = useQuery({
    queryKey: draftCountQueryKey,
    queryFn: async () => {
      try {
        const firstPage = await fetchDraftPostList({ size: 100 });
        if (typeof firstPage.totalCount === "number") {
          return firstPage.totalCount;
        }

        const draftIds = new Set<string>();
        firstPage.drafts.forEach((draft) => draftIds.add(draft.id));

        let hasNext = firstPage.hasNext;
        let cursor: string | undefined = firstPage.nextCursor ?? undefined;

        while (hasNext) {
          if (cursor === undefined || cursor === null) break;

          const nextPage = await fetchDraftPostList({ cursor, size: 100 });
          nextPage.drafts.forEach((draft) => draftIds.add(draft.id));
          hasNext = nextPage.hasNext;
          cursor = nextPage.nextCursor ?? undefined;
        }

        return draftIds.size;
      } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          return null;
        }
        throw error;
      }
    },
    staleTime: 30_000,
  });

  const contentFingerprint = useMemo(
    () =>
      JSON.stringify({
        title,
        content,
        categoryPath,
        tags,
      }),
    [categoryPath, content, tags, title],
  );

  const hasEditableContent =
    title.trim().length > 0 ||
    content.trim().length > 0 ||
    categoryPath.trim().length > 0 ||
    tags.length > 0;

  const openAuthExpiredModal = useCallback(() => {
    setIsPublishModalOpen(false);
    setError("세션이 만료되어 다시 로그인이 필요합니다.");
    setIsAuthExpiredModalOpen(true);
  }, []);

  const tryBackgroundSessionRefresh = useCallback(async () => {
    if (!user || !hasEditableContent || isAuthExpiredModalOpen) return;
    if (isSessionRefreshInFlightRef.current) return;

    isSessionRefreshInFlightRef.current = true;
    try {
      const sessionProbe = await httpClient("/api/users/me", {
        method: "GET",
      });

      if (sessionProbe.ok) {
        return;
      }

      if (sessionProbe.status === 401) {
        openAuthExpiredModal();
      }
    } finally {
      isSessionRefreshInFlightRef.current = false;
    }
  }, [hasEditableContent, isAuthExpiredModalOpen, openAuthExpiredModal, user]);

  useEffect(() => {
    hasIncrementedDraftCountForCurrentCreateRef.current = false;
    setHasHydratedDraft(false);
    setError(null);
    setSuccess(null);
  }, [draftId]);

  useEffect(() => {
    if (!draftDetailQuery.data || hasHydratedDraft) return;

    setTitle(draftDetailQuery.data.post.title || "");
    setContent(draftDetailQuery.data.post.content || "");
    setCategoryPath(draftDetailQuery.data.categoryPath || "");
    setTags(draftDetailQuery.data.post.tags?.map((tag) => tag.name) ?? []);
    setHasHydratedDraft(true);
  }, [draftDetailQuery.data, hasHydratedDraft]);

  const writeLocalDraftSnapshot = () => {
    if (typeof window === "undefined") return;
    const snapshot: LocalDraftSnapshot = {
      version: LOCAL_DRAFT_VERSION,
      savedAt: Date.now(),
      draftId,
      title,
      content,
      categoryPath,
      tags,
    };
    window.localStorage.setItem(localDraftStorageKey, JSON.stringify(snapshot));
  };

  const clearLocalDraftSnapshot = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(localDraftStorageKey);
  };

  const readPendingPublishSnapshot = (): PendingPublishSnapshot | null => {
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
      if (
        parsed.status !== "PUBLISHED" &&
        parsed.status !== "PRIVATE"
      ) {
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
  };

  const writePendingPublishSnapshot = (snapshot: PendingPublishSnapshot) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      PENDING_PUBLISH_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  };

  const clearPendingPublishSnapshot = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(PENDING_PUBLISH_STORAGE_KEY);
  };

  const scheduleAutoSaveRetry = () => {
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
      void runAutoSave();
    }, retryDelay);
  };

  const runAutoSave = async () => {
    if (!user) return;
    if (draftId && draftDetailQuery.isError) return;
    if (!title.trim() && !content.trim() && !categoryPath.trim() && tags.length === 0) return;

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
      setAutoSaveNotice("자동 저장되었습니다.");

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
      if (
        saveError instanceof DOMException &&
        saveError.name === "AbortError"
      ) {
        return;
      }
      setAutoSaveNotice(
        "네트워크 오류로 로컬에 임시 저장했습니다. 자동 재시도합니다.",
      );
      scheduleAutoSaveRetry();
    }
  };

  useEffect(() => {
    if (!title && !content && !categoryPath && tags.length === 0) return;

    if (localSaveDebounceTimerRef.current) {
      clearTimeout(localSaveDebounceTimerRef.current);
      localSaveDebounceTimerRef.current = null;
    }

    localSaveDebounceTimerRef.current = setTimeout(() => {
      writeLocalDraftSnapshot();
      setAutoSaveNotice("로컬 임시 저장됨");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentFingerprint]);

  useEffect(() => {
    if (!user || !hasEditableContent || isAuthExpiredModalOpen) {
      if (authPrecheckTimerRef.current) {
        clearTimeout(authPrecheckTimerRef.current);
        authPrecheckTimerRef.current = null;
      }
      return;
    }

    if (authPrecheckTimerRef.current) {
      clearTimeout(authPrecheckTimerRef.current);
      authPrecheckTimerRef.current = null;
    }

    authPrecheckTimerRef.current = setTimeout(() => {
      void tryBackgroundSessionRefresh();
    }, AUTH_PRECHECK_DEBOUNCE_MS);

    return () => {
      if (authPrecheckTimerRef.current) {
        clearTimeout(authPrecheckTimerRef.current);
        authPrecheckTimerRef.current = null;
      }
    };
  }, [
    contentFingerprint,
    hasEditableContent,
    isAuthExpiredModalOpen,
    tryBackgroundSessionRefresh,
    user,
  ]);

  useEffect(() => {
    if (!user || !hasEditableContent || isAuthExpiredModalOpen) {
      if (authHeartbeatTimerRef.current) {
        clearInterval(authHeartbeatTimerRef.current);
        authHeartbeatTimerRef.current = null;
      }
      return;
    }

    authHeartbeatTimerRef.current = setInterval(() => {
      void tryBackgroundSessionRefresh();
    }, AUTH_HEARTBEAT_MS);

    return () => {
      if (authHeartbeatTimerRef.current) {
        clearInterval(authHeartbeatTimerRef.current);
        authHeartbeatTimerRef.current = null;
      }
    };
  }, [
    hasEditableContent,
    isAuthExpiredModalOpen,
    tryBackgroundSessionRefresh,
    user,
  ]);

  useEffect(() => {
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
  });

  useEffect(() => {
    return () => {
      if (autoSaveDebounceTimerRef.current) {
        clearTimeout(autoSaveDebounceTimerRef.current);
      }
      if (localSaveDebounceTimerRef.current) {
        clearTimeout(localSaveDebounceTimerRef.current);
      }
      if (autoSaveRetryTimerRef.current) {
        clearTimeout(autoSaveRetryTimerRef.current);
      }
      if (authPrecheckTimerRef.current) {
        clearTimeout(authPrecheckTimerRef.current);
      }
      if (authHeartbeatTimerRef.current) {
        clearInterval(authHeartbeatTimerRef.current);
      }
      if (autoSaveAbortControllerRef.current) {
        autoSaveAbortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * 태그 추가 처리
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  /**
   * 태그 제거 처리
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  /**
   * Enter 키로 태그 추가
   */
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateRequiredFields = () => {
    const nextFieldErrors = {
      title: !title.trim(),
      content: !content.trim(),
    };

    if (nextFieldErrors.title || nextFieldErrors.content) {
      setError(null);
      setFieldErrors(nextFieldErrors);
      return false;
    }

    return true;
  };

  const buildPostPayload = (status: PostStatus): CreatePostRequest => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedCategory = categoryPath.trim();

    return {
      ...(trimmedTitle ? { title: trimmedTitle } : {}),
      ...(trimmedContent ? { content: trimmedContent } : {}),
      ...(trimmedCategory ? { categoryPath: trimmedCategory } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      status,
    };
  };

  const clearEditorState = () => {
    setTitle("");
    setContent("");
    setCategoryPath("");
    setTagInput("");
    setTags([]);
    setFieldErrors({ title: false, content: false });
  };

  const removeDraftFromLocalCaches = (targetDraftId: string) => {
    queryClient.setQueriesData<InfiniteData<DraftPostListResult>>(
      { queryKey: [...queryKeys.posts.all, "drafts"] as const },
      (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            drafts: page.drafts.filter((draft) => draft.id !== targetDraftId),
          })),
        };
      },
    );

    queryClient.setQueryData<number | null>(draftCountQueryKey, (current) => {
      if (typeof current !== "number") return current;
      return Math.max(0, current - 1);
    });
  };

  const resolveSaveErrorMessage = (saveError: unknown) => {
    const message = saveError instanceof Error ? saveError.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") {
      return "인증되지 않은 사용자입니다. 로그인 후 다시 시도해주세요.";
    }
    if (message === "NOT_FOUND") {
      return "대상 게시물을 찾을 수 없습니다.";
    }
    if (message === "BAD_REQUEST") {
      return "잘못된 요청입니다. 입력값을 확인해주세요.";
    }
    if (message.startsWith("HTTP_")) {
      return `요청에 실패했습니다. (${message.replace("HTTP_", "")})`;
    }
    return message || "게시물 저장 중 오류가 발생했습니다.";
  };

  const savePostMutation = useMutation<SavePostResult, Error, SavePostVariables>({
    mutationFn: async ({ status, payload, source }) => {
      const result = draftId
        ? await updatePost(draftId, payload)
        : await createPost(payload);
      return {
        result,
        status,
        requestedDraftId: draftId,
        source,
      };
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
      setAutoSaveNotice(null);
      setFieldErrors({ title: false, content: false });
    },
    onSuccess: async ({ result, status, requestedDraftId, source }) => {
      if (source === "resume") {
        setAutoSaveNotice("로그인 후 자동으로 발행을 다시 시도했습니다.");
      }
      setTitle(result.data.title ?? "");
      setContent(result.data.content ?? "");
      setTags(result.data.tags ?? []);
      setTagInput("");

      if (status === "DRAFT") {
        setSuccess("게시물이 임시저장되었습니다.");
        clearLocalDraftSnapshot();
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...queryKeys.posts.all, "drafts"] as const,
          }),
          queryClient.invalidateQueries({ queryKey: draftCountQueryKey }),
        ]);
        if (!requestedDraftId) {
          router.replace(`/post/write?draftId=${result.data.id}`);
        }
        return;
      }

      if (requestedDraftId) {
        removeDraftFromLocalCaches(requestedDraftId);
        queryClient.removeQueries({
          queryKey: queryKeys.posts.draftDetail(requestedDraftId),
        });
      }

      clearEditorState();
      clearLocalDraftSnapshot();
      clearPendingPublishSnapshot();
      setIsAuthExpiredModalOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.posts.all, "drafts"] as const,
        }),
        queryClient.invalidateQueries({ queryKey: draftCountQueryKey }),
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.posts.all, "community"] as const,
        }),
      ]);

      if (status === "PRIVATE") {
        setSuccess("게시물이 비공개로 저장되었습니다.");
      } else {
        setSuccess("게시물이 성공적으로 작성되었습니다!");
      }

      router.push("/?mode=user");
    },
    onError: (saveError, variables) => {
      const message = saveError instanceof Error ? saveError.message : "UNKNOWN";
      if (
        message === "UNAUTHORIZED" &&
        (variables.status === "PUBLISHED" || variables.status === "PRIVATE")
      ) {
        const pendingStatus: "PUBLISHED" | "PRIVATE" = variables.status;
        if (variables.source === "resume") {
          setIsAuthExpiredModalOpen(true);
          setError("로그인 이후 자동 발행 재시도에 실패했습니다. 다시 시도해주세요.");
          return;
        }
        if (typeof window !== "undefined") {
          const currentPath = `${window.location.pathname}${window.location.search}`;
          writePendingPublishSnapshot({
            version: PENDING_PUBLISH_VERSION,
            createdAt: Date.now(),
            retried: false,
            requestId: variables.requestId,
            path: currentPath,
            draftId,
            status: pendingStatus,
            payload: variables.payload,
          });
        }
        setIsAuthExpiredModalOpen(true);
        return;
      }
      setError(resolveSaveErrorMessage(saveError));
    },
  });

  /**
   * 게시물 작성/수정 제출
   */
  const handleSubmit = async (status: PostStatus) => {
    if (!validateRequiredFields()) return;
    if (draftId && draftDetailQuery.isError) return;
    const payload = buildPostPayload(status);
    await savePostMutation.mutateAsync({
      status,
      payload,
      requestId: createRequestId(),
      source: "manual",
    });
  };

  useEffect(() => {
    if (!user) return;
    const pending = readPendingPublishSnapshot();
    if (!pending) return;

    if (typeof window !== "undefined") {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (pending.path !== currentPath) {
        return;
      }
    }

    clearPendingPublishSnapshot();
    setIsAuthExpiredModalOpen(false);
    setAutoSaveNotice("로그인되었습니다. 발행 버튼을 눌러 게시를 완료해주세요.");
  }, [user]);

  const isDraftLoading = Boolean(draftId) && draftDetailQuery.isPending;
  const draftErrorMessage = (() => {
    if (!draftDetailQuery.error) return null;
    const message =
      draftDetailQuery.error instanceof Error
        ? draftDetailQuery.error.message
        : "UNKNOWN";
    if (message === "NOT_FOUND") {
      return "임시 저장 게시물을 찾을 수 없거나 접근 권한이 없습니다.";
    }
    if (message === "UNAUTHORIZED") {
      return "로그인 후 임시 저장 게시물을 조회할 수 있습니다.";
    }
    return "임시 저장 게시물을 불러오지 못했습니다.";
  })();

  const draftCountLabel = (() => {
    if (draftCountQuery.isPending) return "...";
    if (draftCountQuery.data === null) return "-";
    if (typeof draftCountQuery.data !== "number") return "0";
    return String(draftCountQuery.data);
  })();
  const isSubmitting = savePostMutation.isPending;
  const isPublishActionDisabled =
    isSubmitting ||
    isDraftLoading ||
    Boolean(draftErrorMessage) ||
    isAuthExpiredModalOpen;

  const handleGoToLogin = () => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    if (typeof window === "undefined") return;
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    window.sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, redirectPath);
    window.location.href = `${apiBaseUrl}/oauth2/authorization/google?origin=${encodeURIComponent(window.location.origin)}&redirect=${encodeURIComponent(redirectPath)}`;
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 md:px-4 md:py-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {draftId ? "임시글 수정 모드" : "새 글 작성 모드"}
          </p>
        </div>

        {isDraftLoading && (
          <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            임시글 정보를 불러오는 중입니다.
          </div>
        )}

        {draftErrorMessage && (
          <div className="mb-4 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
            {draftErrorMessage}
          </div>
        )}

        {autoSaveNotice && (
          <div className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            {autoSaveNotice}
          </div>
        )}

        {/* 입력 영역 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSubmitting) {
              if (validateRequiredFields()) setIsPublishModalOpen(true);
            }
          }}
          className="rounded-lg bg-card p-4 shadow-sm md:rounded-xl md:p-6 lg:p-8"
        >
          {/* 제목 */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-foreground">
              제목 <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: false }));
                }
              }}
              placeholder="게시물의 제목을 입력하세요"
              className={`w-full rounded-lg border bg-background px-4 py-3 text-base font-semibold text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:bg-card focus:outline-none ${
                fieldErrors.title
                  ? "border-red-500 focus:border-red-500"
                  : "border-border focus:border-primary"
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-2 text-sm font-medium text-red-600">제목을 입력해주세요.</p>
            )}
          </div>

          {/* 카테고리 */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-foreground">
              카테고리
            </label>
            <input
              id="category"
              type="text"
              value={categoryPath}
              onChange={(e) => {
                setCategoryPath(e.target.value);
              }}
              placeholder="예: java/spring/deepdive"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
            />
          </div>

          {/* 태그 */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="tags" className="mb-2 block text-sm font-semibold text-foreground">
              태그
            </label>
            <div className="flex flex-col gap-2 md:flex-row">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="태그를 입력하고 Enter를 누르세요"
                className="w-full flex-1 rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
              />
            </div>

            {/* 태그 목록 */}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="cursor-pointer border-0 bg-transparent p-0 text-lg text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`${tag} 제거`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 에러/성공 메시지 */}
          {error && !(fieldErrors.title || fieldErrors.content) && (
            <div className="mb-6 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg border border-[#cfc] bg-[#efe] p-4 text-sm font-medium text-[#3c3]">
              {success}
            </div>
          )}

          {/* 콘텐츠 에디터 */}
          <div className="mb-6 grid grid-cols-1 gap-0 lg:mb-8 lg:min-h-[500px] lg:grid-cols-2 lg:gap-6">
            <div className="flex min-h-[400px] flex-col overflow-hidden rounded-lg border border-border bg-background lg:min-h-0">
              <div className="border-b border-border bg-muted p-4">
                <h2 className="text-base font-semibold text-foreground">
                  마크다운 편집 <span className="text-red-600">*</span>
                </h2>
              </div>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (fieldErrors.content) {
                    setFieldErrors((prev) => ({ ...prev, content: false }));
                  }
                }}
                placeholder="마크다운 형식으로 내용을 입력하세요&#10;&#10;# 제목&#10;## 부제목&#10;&#10;**굵은 텍스트**&#10;*기울인 텍스트*&#10;&#10;- 리스트 항목&#10;&#10;```코드&#10;코드 블록&#10;```"
                className={`flex-1 resize-none border-0 bg-card p-4 font-mono text-base leading-relaxed text-foreground placeholder:text-muted-foreground placeholder:whitespace-pre focus:outline-none md:text-sm ${
                  fieldErrors.content ? "outline outline-1 outline-red-500" : ""
                }`}
              />
              {fieldErrors.content && (
                <p className="border-t border-border bg-background px-4 py-2 text-sm font-medium text-red-600">
                  내용을 입력해주세요.
                </p>
              )}
            </div>

            {/* 프리뷰 */}
            <div className="flex min-h-[400px] flex-col overflow-hidden rounded-lg border border-border border-t-0 bg-background lg:min-h-0 lg:border-t">
              <div className="border-b border-border bg-muted p-4">
                <h2 className="text-base font-semibold text-foreground">미리보기</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                    <p>마크다운 내용을 입력하면 여기에 미리보기가 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3">
            <div className="inline-flex overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                disabled={isPublishActionDisabled}
                onClick={() => handleSubmit("DRAFT")}
                className="px-5 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "저장 중..." : "임시저장"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/post/drafts")}
                className="min-w-14 border-l border-border px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                aria-label="임시저장 게시글 목록 보기"
              >
                {draftCountLabel}
              </button>
            </div>
            <button
              type="button"
              disabled={isPublishActionDisabled}
              onClick={() => {
                if (validateRequiredFields()) setIsPublishModalOpen(true);
              }}
              className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "발행 중..." : "발행하기"}
            </button>
          </div>
        </form>

        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-foreground">
                게시물 공개 설정
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                발행할 게시물의 공개 범위를 선택해주세요.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={isPublishActionDisabled}
                  onClick={() => {
                    setIsPublishModalOpen(false);
                    handleSubmit("PUBLISHED");
                  }}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  전체 공개로 발행
                </button>
                <button
                  type="button"
                  disabled={isPublishActionDisabled}
                  onClick={() => {
                    setIsPublishModalOpen(false);
                    handleSubmit("PRIVATE");
                  }}
                  className="w-full rounded-lg border border-border px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  비공개로 발행
                </button>
                <button
                  type="button"
                  disabled={isPublishActionDisabled}
                  onClick={() => setIsPublishModalOpen(false)}
                  className="w-full rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {isAuthExpiredModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-[620px] rounded-[28px] bg-[#f6f6f7] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <div className="mb-6 flex items-start justify-between">
                <h2 className="text-5xl font-bold leading-none text-[#101115] md:text-[44px]">
                  Login required
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearPendingPublishSnapshot();
                    setIsAuthExpiredModalOpen(false);
                  }}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ececee] text-3xl leading-none text-[#5c5f66] transition-colors hover:bg-[#e2e3e7]"
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>

              <div className="rounded-3xl bg-[#ececef] p-6">
                <p className="text-base leading-relaxed text-[#484b54]">
                  로그인 세션이 만료되었습니다.
                  <br />
                  작성 중이던 내용은 안전하게 저장되었습니다.
                  <br />
                  로그인 후 자동으로 발행이 다시 시도됩니다.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearPendingPublishSnapshot();
                    setIsAuthExpiredModalOpen(false);
                  }}
                  className="rounded-full border border-[#d2d5dc] bg-[#f6f6f7] px-7 py-3 text-2xl font-semibold text-[#17191f] transition-colors hover:bg-[#ececef]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="rounded-full bg-[#111217] px-7 py-3 text-2xl font-semibold text-white transition-opacity hover:opacity-90"
                >
                  로그인 하러가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
