"use client";

import { useTranslations } from "next-intl";
import { Bookmark, Eye, MessageCircle, Share2, ThumbsDown, ThumbsUp } from "lucide-react";

type ReactionState = "like" | "dislike" | "none";

interface PostDetailActionBarProps {
  reactionState: ReactionState;
  isBookmarked: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  formatCount: (count: number) => string;
  onLike: () => void;
  onDislike?: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onFocusComment: () => void;
}

export default function PostDetailActionBar({
  reactionState,
  isBookmarked,
  likeCount,
  commentCount,
  viewCount,
  formatCount,
  onLike,
  onDislike,
  onBookmark,
  onShare,
  onFocusComment,
}: PostDetailActionBarProps) {
  const t = useTranslations("PostDetail");

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
        <button
          onClick={onBookmark}
          className={`p-3 rounded-full transition-colors duration-200 cursor-pointer ${
            isBookmarked
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark className="w-6 h-6" fill={isBookmarked ? "currentColor" : "none"} />
        </button>

        <button
          onClick={onShare}
          className="p-3 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
