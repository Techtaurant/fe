import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { queryKeys } from "@/app/lib/queryKeys";
import {
  fetchDraftPostDetail,
  fetchDraftPostList,
  fetchPostDetailWithMeta,
} from "@/app/services/posts";

interface UseDraftBootstrapParams {
  draftId: string | null;
  postId: string | null;
  draftCountQueryKey: readonly unknown[];
  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  setCategoryPath: (value: string) => void;
  setTags: (value: string[]) => void;
  setThumbnailAttachmentId: (value: string | null) => void;
  setThumbnailPreviewUrl: (value: string | null) => void;
}

export function useDraftBootstrap({
  draftId,
  postId,
  draftCountQueryKey,
  setTitle,
  setContent,
  setCategoryPath,
  setTags,
  setThumbnailAttachmentId,
  setThumbnailPreviewUrl,
}: UseDraftBootstrapParams) {
  const t = useTranslations("WritePage.draft");
  const hydratedDraftIdRef = useRef<string | null>(null);

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

  const postDetailQuery = useQuery({
    queryKey: queryKeys.posts.detail(postId ?? ""),
    queryFn: () => fetchPostDetailWithMeta(postId as string),
    enabled: !draftId && Boolean(postId),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const draftCountQuery = useQuery({
    queryKey: draftCountQueryKey,
    enabled: !postId,
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

  useEffect(() => {
    const activeId = draftId ?? postId;
    if (!activeId) return;
    if (hydratedDraftIdRef.current === activeId) return;

    if (draftId && draftDetailQuery.data) {
      setTitle(draftDetailQuery.data.post.title || "");
      setContent(draftDetailQuery.data.post.content || "");
      setCategoryPath(draftDetailQuery.data.categoryPath || "");
      setTags(draftDetailQuery.data.post.tags?.map((tag) => tag.name) ?? []);
      setThumbnailPreviewUrl(null);
      setThumbnailAttachmentId(draftDetailQuery.data.thumbnailAttachmentId ?? null);
      hydratedDraftIdRef.current = activeId;
      return;
    }

    if (!draftId && postId && postDetailQuery.data) {
      setTitle(postDetailQuery.data.post.title || "");
      setContent(postDetailQuery.data.post.content || "");
      setCategoryPath(postDetailQuery.data.post.categoryPath || "");
      setTags(postDetailQuery.data.post.tags?.map((tag) => tag.name) ?? []);
      setThumbnailPreviewUrl(null);
      setThumbnailAttachmentId(postDetailQuery.data.thumbnailAttachmentId ?? null);
      hydratedDraftIdRef.current = activeId;
    }
  }, [
    draftId,
    postId,
    draftDetailQuery.data,
    postDetailQuery.data,
    setCategoryPath,
    setContent,
    setThumbnailAttachmentId,
    setThumbnailPreviewUrl,
    setTags,
    setTitle,
  ]);

  const isDraftLoading =
    (Boolean(draftId) && draftDetailQuery.isPending) ||
    (!draftId && Boolean(postId) && postDetailQuery.isPending);
  const draftErrorMessage = (() => {
    const activeError = draftId ? draftDetailQuery.error : postDetailQuery.error;
    if (!activeError) return null;
    const message =
      activeError instanceof Error
        ? activeError.message
        : "UNKNOWN";
    if (message === "NOT_FOUND") {
      return t("notFound");
    }
    if (message === "UNAUTHORIZED") {
      return t("unauthorized");
    }
    return t("loadFailed");
  })();

  const draftCountLabel = (() => {
    if (draftCountQuery.isPending) return "...";
    if (draftCountQuery.data === null) return "-";
    if (typeof draftCountQuery.data !== "number") return "0";
    return String(draftCountQuery.data);
  })();

  return {
    draftDetailQuery,
    postDetailQuery,
    draftCountQuery,
    isDraftLoading,
    draftErrorMessage,
    detailHasError: Boolean(draftErrorMessage),
    draftCountLabel,
  };
}
