"use client";

import { useTranslations } from "next-intl";
import {
  Eye,
  MessageCircle,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import ReadStatusToggleButton from "../ui/ReadStatusToggleButton";

type ReactionState = "like" | "dislike" | "none";

interface PostDetailActionBarProps {
  reactionState: ReactionState;
  isRead: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  formatCount: (count: number) => string;
  onLike: () => void;
  onDislike?: () => void;
  onToggleRead: () => void;
  onShare: () => void;
  onFocusComment: () => void;
  showReadToggle?: boolean;
}

const READ_TOGGLE_GUIDE_KEY = "post-detail-read-toggle-guide-seen";

export default function PostDetailActionBar({
  reactionState,
  isRead,
  likeCount,
  commentCount,
  viewCount,
  formatCount,
  onLike,
  onDislike,
  onToggleRead,
  onShare,
  onFocusComment,
  showReadToggle = true,
}: PostDetailActionBarProps) {
  const t = useTranslations("PostDetail");
  const isReadStatusLabel = isRead ? t("markRead") : t("markUnread");

  return (
    <div className="flex items-center justify-between py-3 border-t border-border mb-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-full bg-muted px-3 py-2 text-base font-semibold text-muted-foreground">
          <button
            onClick={onLike}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 cursor-pointer ${
              reactionState === "like"
                ? "bg-red-500/15 text-red-600 hover:bg-red-500/20"
                : "hover:text-foreground hover:bg-muted/80"
            }`}
            aria-label={t("ariaLike")}
          >
            <ThumbsUp className="w-5 h-5" />
          </button>
          <span className="px-1">{formatCount(likeCount)}</span>
          <button
            onClick={onDislike}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 cursor-pointer ${
              reactionState === "dislike"
                ? "bg-blue-500/15 text-blue-600 hover:bg-blue-500/20"
                : "hover:text-foreground hover:bg-muted/80"
            }`}
            aria-label={t("ariaDislike")}
          >
            <ThumbsDown className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onFocusComment}
          className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
        >
          <MessageCircle className="w-6 h-6" />
          <span>{formatCount(commentCount)}</span>
        </button>

        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-base font-semibold text-muted-foreground">
          <Eye className="w-6 h-6" />
          <span>{formatCount(viewCount)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showReadToggle && (
          <ReadStatusToggleButton
            isRead={isRead}
            label={isReadStatusLabel}
            markReadToast={t("markReadToast")}
            markUnreadToast={t("markUnreadToast")}
            guideLabel={t("readToggleGuide")}
            guideStorageKey={READ_TOGGLE_GUIDE_KEY}
            onToggleRead={onToggleRead}
          />
        )}

        <button
          onClick={onShare}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
