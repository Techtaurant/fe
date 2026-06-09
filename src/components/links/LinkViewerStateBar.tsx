"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
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
import ReadStatusToggleButton from "../ui/ReadStatusToggleButton";

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
  const isViewerStateLoading =
    Boolean(user) && (viewerStateQuery.isPending || viewerStateQuery.isFetching);
  const isStateUnavailable = Boolean(user) && viewerStateQuery.isError;
  const isActionDisabled =
    isLoading || isViewerStateLoading || pendingAction !== null || isStateUnavailable;
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
    if (isActionDisabled) return;

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

  const handleToggleRead = async (nextRead: boolean) => {
    if (isActionDisabled) return;

    if (!user) {
      setMessage(t("loginRequired"));
      return;
    }

    const previousRead = isRead;

    setPendingAction("read");
    setMessage(null);
    setIsRead(nextRead);
    setViewerStateCache(isSaved, nextRead);

    try {
      await setLinkReadLog(linkId, nextRead);
      setMessage(null);
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

  const handleReadToggleRequest = (nextRead: boolean): boolean => {
    if (!user) {
      setMessage(t("loginRequired"));
      return false;
    }

    void handleToggleRead(nextRead);
    return true;
  };

  const readLabel = isRead ? t("markRead") : t("markUnread");

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggleSave}
          disabled={isActionDisabled}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
            isSaved
              ? "bg-comment-submit-button/15 text-comment-submit-button hover:bg-comment-submit-button/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={isSaved}
          aria-label={isSaved ? t("saved") : t("save")}
          title={isSaved ? t("saved") : t("save")}
        >
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{isSaved ? t("saved") : t("save")}</span>
        </button>
        <ReadStatusToggleButton
          isRead={isRead}
          label={readLabel}
          markReadToast={t("markReadToast")}
          markUnreadToast={t("markUnreadToast")}
          onToggleRead={handleReadToggleRequest}
          disabled={isActionDisabled}
        />
      </div>

      {statusMessage ? (
        <p className="max-w-48 text-right text-xs font-medium text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
