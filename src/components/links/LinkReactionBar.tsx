"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { setLinkLike } from "../../services/links/client";
import { LinkLikeStatus } from "../../services/links/types";

interface LinkReactionBarProps {
  linkId: string;
  initialLikeCount?: number;
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

  const previousLikeOffset = previousStatus === "LIKE" ? -1 : 0;
  const nextLikeOffset = nextStatus === "LIKE" ? 1 : 0;
  return Math.max(0, currentCount + previousLikeOffset + nextLikeOffset);
}

export default function LinkReactionBar({
  linkId,
  initialLikeCount,
}: LinkReactionBarProps) {
  const t = useTranslations("LinkDetail");
  const { user, isLoading } = useUser();
  const [likeStatus, setLikeStatus] = useState<LinkLikeStatus>("NONE");
  const [likeCount, setLikeCount] = useState<number | undefined>(initialLikeCount);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const reactionState = toReactionState(likeStatus);

  const updateReaction = async (nextStatus: LinkLikeStatus) => {
    if (isLoading || isPending) return;

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

    try {
      await setLinkLike(linkId, nextStatus);
      setMessage(t("reactionSaved"));
    } catch (error) {
      setLikeStatus(previousStatus);
      setLikeCount(previousCount);
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
          disabled={isPending || isLoading}
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
          disabled={isPending || isLoading}
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

      {message ? (
        <p className="text-center text-xs font-medium text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
