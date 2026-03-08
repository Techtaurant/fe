import { useEffect } from "react";
import { InfiniteData, QueryClient, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/app/services/posts";
import { queryKeys } from "@/app/lib/queryKeys";
import { DraftPostListResult } from "@/app/services/posts/types";
import { CreatePostRequest, PostStatus } from "@/app/types";
import { AUTH_RETURN_TO_STORAGE_KEY, PENDING_PUBLISH_VERSION, createRequestId } from "../lib/constants";
import {
  clearPendingPublishSnapshot,
  readPendingPublishSnapshot,
  writePendingPublishSnapshot,
} from "../lib/storage";
import { SavePostResult, SavePostVariables } from "../lib/types";

interface UsePublishFlowParams {
  user: unknown;
  draftId: string | null;
  draftDetailHasError: boolean;
  queryClient: QueryClient;
  draftCountQueryKey: readonly unknown[];
  validateRequiredFields: () => boolean;
  buildPostPayload: (status: PostStatus) => CreatePostRequest;
  clearEditorState: () => void;
  clearLocalDraftSnapshot: () => void;
  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  setTags: (value: string[]) => void;
  setTagInput: (value: string) => void;
  setError: (value: string | null) => void;
  setSuccess: (value: string | null) => void;
  setAutoSaveNotice: (value: string | null) => void;
  setFieldErrors: (value: { title: boolean; content: boolean }) => void;
  setIsAuthExpiredModalOpen: (value: boolean) => void;
  setIsPublishModalOpen: (value: boolean) => void;
}

export function usePublishFlow({
  user,
  draftId,
  draftDetailHasError,
  queryClient,
  draftCountQueryKey,
  validateRequiredFields,
  buildPostPayload,
  clearEditorState,
  clearLocalDraftSnapshot,
  setTitle,
  setContent,
  setTags,
  setTagInput,
  setError,
  setSuccess,
  setAutoSaveNotice,
  setFieldErrors,
  setIsAuthExpiredModalOpen,
  setIsPublishModalOpen,
}: UsePublishFlowParams) {
  const router = useRouter();
  const tPublish = useTranslations("WritePage.publish");
  const tNotice = useTranslations("WritePage.notice");
  const tError = useTranslations("WritePage.errors");

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
      return tError("unauthorized");
    }
    if (message === "NOT_FOUND") {
      return tError("notFound");
    }
    if (message === "BAD_REQUEST") {
      return tError("badRequest");
    }
    if (message.startsWith("HTTP_")) {
      return tError("http", { code: message.replace("HTTP_", "") });
    }
    return message || tError("saveFailed");
  };

  const savePostMutation = useMutation<SavePostResult, Error, SavePostVariables>({
    mutationFn: async ({ status, payload, source }) => {
      const result = draftId ? await updatePost(draftId, payload) : await createPost(payload);
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
        setAutoSaveNotice(tNotice("resumedPublish"));
      }
      setTitle(result.data.title ?? "");
      setContent(result.data.content ?? "");
      setTags(result.data.tags ?? []);
      setTagInput("");

      if (status === "DRAFT") {
        setSuccess(tPublish("draftSaved"));
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
        setSuccess(tPublish("privateSaved"));
      } else {
        setSuccess(tPublish("published"));
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
          setError(tError("resumeFailed"));
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

  const handleSubmit = async (status: PostStatus) => {
    if (!validateRequiredFields()) return;
    if (draftId && draftDetailHasError) return;
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
    setAutoSaveNotice(tNotice("signedInContinue"));
  }, [setAutoSaveNotice, setIsAuthExpiredModalOpen, tNotice, user]);

  const handleGoToLogin = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    if (typeof window === "undefined") return;
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    window.sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, redirectPath);
    window.location.href = `${apiBaseUrl}/oauth2/authorization/google?origin=${encodeURIComponent(window.location.origin)}&redirect=${encodeURIComponent(redirectPath)}`;
  };

  const openPublishModal = () => {
    if (validateRequiredFields()) {
      setIsPublishModalOpen(true);
    }
  };

  return {
    savePostMutation,
    handleSubmit,
    handleGoToLogin,
    openPublishModal,
    isSubmitting: savePostMutation.isPending,
  };
}
