"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUser } from "../../hooks/useUser";
import { queryKeys } from "../../lib/queryKeys";
import {
  fetchLinkViewerStates,
  saveLink,
  setLinkReadLog,
  unsaveLink,
} from "../../services/links/client";
import type { LinkViewerState } from "../../services/links/types";

interface LinkViewerStateBarProps {
  linkId: string;
  initialIsSaved?: boolean;
  initialIsRead?: boolean;
}

function getViewerState(
  linkId: string,
  isSaved: boolean,
  isRead: boolean,
): LinkViewerState {
  return {
    linkId,
    isSaved,
    isRead,
  };
}

export default function LinkViewerStateBar({
  linkId,
  initialIsSaved,
  initialIsRead,
}: LinkViewerStateBarProps) {
  const t = useTranslations("LinkDetail");
  const { user, isLoading } = useUser();
  const queryClient = useQueryClient();
  const viewerStateQueryKey = queryKeys.links.viewerStates([linkId]);
  const [isSaved, setIsSaved] = useState(Boolean(initialIsSaved));
  const [isRead, setIsRead] = useState(Boolean(initialIsRead));
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"save" | "read" | null>(null);

  const viewerStateQuery = useQuery({
    queryKey: viewerStateQueryKey,
    queryFn: () => fetchLinkViewerStates([linkId]),
    enabled: Boolean(user),
  });
  const isStateUnavailable = Boolean(user) && viewerStateQuery.isError;
  const statusMessage =
    message ?? (isStateUnavailable ? t("viewerStateFailed") : null);

  useEffect(() => {
    setIsSaved(Boolean(initialIsSaved));
    setIsRead(Boolean(initialIsRead));
  }, [initialIsRead, initialIsSaved, linkId]);

  useEffect(() => {
    const viewerState = viewerStateQuery.data?.find(
      (state) => state.linkId === linkId,
    );
    if (!viewerState) return;

    setIsSaved(viewerState.isSaved);
    setIsRead(viewerState.isRead);
  }, [linkId, viewerStateQuery.data]);

  const setViewerStateCache = (nextIsSaved: boolean, nextIsRead: boolean) => {
    queryClient.setQueryData<LinkViewerState[]>(viewerStateQueryKey, [
      getViewerState(linkId, nextIsSaved, nextIsRead),
    ]);
  };

  const handleToggleSave = async () => {
    if (isLoading || pendingAction || isStateUnavailable) return;

    if (!user) {
      setMessage(t("loginRequired"));
      return;
    }

    const previousSaved = isSaved;
    const nextSaved = !isSaved;

    setPendingAction("save");
    setMessage(null);
    setIsSaved(nextSaved);
    setViewerStateCache(nextSaved, isRead);

    try {
      if (nextSaved) {
        await saveLink(linkId);
      } else {
        await unsaveLink(linkId);
      }
      setMessage(nextSaved ? t("saveSucceeded") : t("unsaveSucceeded"));
    } catch (error) {
      setIsSaved(previousSaved);
      setViewerStateCache(previousSaved, isRead);
      setMessage(
        error instanceof Error && error.message === "UNAUTHORIZED"
          ? t("loginRequired")
          : t("saveFailed"),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggleRead = async () => {
    if (isLoading || pendingAction || isStateUnavailable) return;

    if (!user) {
      setMessage(t("loginRequired"));
      return;
    }

    const previousRead = isRead;
    const nextRead = !isRead;

    setPendingAction("read");
    setMessage(null);
    setIsRead(nextRead);
    setViewerStateCache(isSaved, nextRead);

    try {
      await setLinkReadLog(linkId, nextRead);
      setMessage(nextRead ? t("markReadSucceeded") : t("markUnreadSucceeded"));
    } catch (error) {
      setIsRead(previousRead);
      setViewerStateCache(isSaved, previousRead);
      setMessage(
        error instanceof Error && error.message === "UNAUTHORIZED"
          ? t("loginRequired")
          : t("readFailed"),
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSave}
          disabled={isLoading || pendingAction !== null || isStateUnavailable}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isSaved
              ? "bg-comment-submit-button text-white hover:bg-comment-submit-button-hover"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={isSaved}
        >
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          {isSaved ? t("saved") : t("save")}
        </button>
        <button
          type="button"
          onClick={handleToggleRead}
          disabled={isLoading || pendingAction !== null || isStateUnavailable}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isRead
              ? "bg-muted text-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={isRead}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {isRead ? t("markUnread") : t("markRead")}
        </button>
      </div>

      {statusMessage ? (
        <p className="text-xs font-medium text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
