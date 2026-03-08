import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { fetchDraftPostDetail, fetchDraftPostList } from "@/app/services/posts";

interface UseDraftBootstrapParams {
  draftId: string | null;
  draftCountQueryKey: readonly unknown[];
  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  setCategoryPath: (value: string) => void;
  setTags: (value: string[]) => void;
}

export function useDraftBootstrap({
  draftId,
  draftCountQueryKey,
  setTitle,
  setContent,
  setCategoryPath,
  setTags,
}: UseDraftBootstrapParams) {
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

  useEffect(() => {
    if (!draftDetailQuery.data) return;
    if (hydratedDraftIdRef.current === draftId) return;

    setTitle(draftDetailQuery.data.post.title || "");
    setContent(draftDetailQuery.data.post.content || "");
    setCategoryPath(draftDetailQuery.data.categoryPath || "");
    setTags(draftDetailQuery.data.post.tags?.map((tag) => tag.name) ?? []);
    hydratedDraftIdRef.current = draftId;
  }, [
    draftId,
    draftDetailQuery.data,
    setCategoryPath,
    setContent,
    setTags,
    setTitle,
  ]);

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

  return {
    draftDetailQuery,
    draftCountQuery,
    isDraftLoading,
    draftErrorMessage,
    draftCountLabel,
  };
}
