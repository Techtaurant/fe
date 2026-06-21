"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { queryKeys } from "../../lib/queryKeys";
import {
  fetchLinkReactionState,
  setLinkLike,
} from "../../services/links/client";
import type { LinkLikeStatus, LinkReactionState } from "../../services/links/types";

interface LinkReactionBarProps {
  linkId: string;
  initialLikeCount?: number;
  initialLikeStatus?: LinkLikeStatus;
}

function toReactionState(status: LinkLikeStatus): "like" | "dislike" | "none" {
  if (status === "LIKE") return "like";
  if (status === "DISLIKE") return "dislike";
  return "none";
}

function getNextLikeCount(
  currentCount: number | undefined,
  previousStatus: LinkLikeStatus,
  nextStatus: LinkLikeStatus,
): number | undefined {
  if (currentCount === undefined) {
    return undefined;
  }

  const reactionScore = {
    LIKE: 1,
    DISLIKE: -1,
    NONE: 0,
  } satisfies Record<LinkLikeStatus, number>;

  return (
    currentCount -
    reactionScore[previousStatus] +
    reactionScore[nextStatus]
  );
}

export default function LinkReactionBar({
  linkId,
  initialLikeCount,
  initialLikeStatus,
}: LinkReactionBarProps) {
  const t = useTranslations("LinkDetail");
  const queryClient = useQueryClient();
  const { user, isLoading } = useUser();
  const reactionQueryKey = queryKeys.links.reaction(linkId);
  const [likeStatus, setLikeStatus] = useState<LinkLikeStatus>(
    initialLikeStatus ?? "NONE",
  );
  const [likeCount, setLikeCount] = useState<number | undefined>(initialLikeCount);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const reactionQuery = useQuery({
    queryKey: reactionQueryKey,
    queryFn: () => fetchLinkReactionState(linkId),
    enabled: Boolean(user),
  });
  const isReactionLoading =
    Boolean(user) && (reactionQuery.isPending || reactionQuery.isFetching);
  const isReactionUnavailable = Boolean(user) && reactionQuery.isError;
  const statusMessage =
    message ?? (isReactionUnavailable ? t("reactionFailed") : null);
  const reactionState = toReactionState(likeStatus);

  useEffect(() => {
    setLikeStatus(initialLikeStatus ?? "NONE");
    setLikeCount(initialLikeCount);
  }, [initialLikeCount, initialLikeStatus, linkId]);

  useEffect(() => {
    if (!reactionQuery.data) {
      return;
    }

    setLikeStatus(reactionQuery.data.likeStatus);
    if (reactionQuery.data.likeCount !== undefined) {
      setLikeCount(reactionQuery.data.likeCount);
    }
  }, [reactionQuery.data]);

  const updateReaction = async (nextStatus: LinkLikeStatus) => {
    if (isLoading || isPending || isReactionLoading || isReactionUnavailable) return;

    if (!user) {
      setMessage(t("loginRequired"));
      return;
    }

    const previousStatus = likeStatus;
    const previousCount = likeCount;
    const optimisticCount = getNextLikeCount(
      likeCount,
      previousStatus,
      nextStatus,
    );

    setIsPending(true);
    setMessage(null);
    setLikeStatus(nextStatus);
    setLikeCount(optimisticCount);
    queryClient.setQueryData<LinkReactionState>(reactionQueryKey, {
      likeStatus: nextStatus,
      likeCount: optimisticCount,
    });

    try {
      await setLinkLike(linkId, nextStatus);
      setMessage(t("reactionSaved"));
    } catch (error) {
      setLikeStatus(previousStatus);
      setLikeCount(previousCount);
      queryClient.setQueryData<LinkReactionState>(reactionQueryKey, {
        likeStatus: previousStatus,
        likeCount: previousCount,
      });
      setMessage(
        error instanceof Error && error.message === "UNAUTHORIZED"
          ? t("loginRequired")
          : t("reactionFailed"),
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleLike = () => {
    void updateReaction(likeStatus === "LIKE" ? "NONE" : "LIKE");
  };

  const handleDislike = () => {
    void updateReaction(likeStatus === "DISLIKE" ? "NONE" : "DISLIKE");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-full bg-muted px-3 py-2 text-base font-semibold text-muted-foreground">
        <button
          type="button"
          onClick={handleLike}
          disabled={
            isPending || isLoading || isReactionLoading || isReactionUnavailable
          }
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 ${
            reactionState === "like"
              ? "bg-red-500/15 text-red-600 hover:bg-red-500/20"
              : "hover:bg-muted/80 hover:text-foreground"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={t("ariaLike")}
        >
          <ThumbsUp className="h-5 w-5" aria-hidden="true" />
        </button>
        {likeCount !== undefined ? (
          <span className="min-w-6 text-center">{likeCount}</span>
        ) : null}
        <button
          type="button"
          onClick={handleDislike}
          disabled={
            isPending || isLoading || isReactionLoading || isReactionUnavailable
          }
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 ${
            reactionState === "dislike"
              ? "bg-blue-500/15 text-blue-600 hover:bg-blue-500/20"
              : "hover:bg-muted/80 hover:text-foreground"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={t("ariaDislike")}
        >
          <ThumbsDown className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {statusMessage ? (
        <p className="text-center text-xs font-medium text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
