"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MoreVertical, Pencil, ThumbsDown, ThumbsUp, Trash2, UserX } from "lucide-react";
import { useRouter } from "../../i18n/navigation";
import { Comment } from "../../types";
import { buildUserPath } from "../../lib/userRoute";
import { formatDisplayTime } from "../../utils";
import PostDetailConfirmDialog, {
  CANCEL_CONFIRM_BUTTON_CLASS_NAME,
  DELETE_CONFIRM_BUTTON_CLASS_NAME,
} from "./PostDetailConfirmDialog";
import PostDetailMenuItemButton from "./PostDetailMenuItemButton";

interface PostDetailCommentItemProps {
  comment: Comment;
  currentUserId?: string | null;
  postAuthorId?: string | null;
  updatingCommentId: string | null;
  deletingCommentId: string | null;
  banningCommentAuthorId: string | null;
  onUpdateComment: (commentId: string, content: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  onBanCommentAuthor: (targetUserId: string) => Promise<boolean>;
  onLikeComment: (commentId: string) => void;
  onDislikeComment: (commentId: string) => void;
  extraActions?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
  onShowError?: (message: string) => void;
}

export default function PostDetailCommentItem({
  comment,
  currentUserId,
  postAuthorId,
  updatingCommentId,
  deletingCommentId,
  banningCommentAuthorId,
  onUpdateComment,
  onDeleteComment,
  onBanCommentAuthor,
  onLikeComment,
  onDislikeComment,
  extraActions,
  children,
  compact = false,
  onShowError,
}: PostDetailCommentItemProps) {
  const t = useTranslations("PostDetail");
  const locale = useLocale();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeMenu, setActiveMenu] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActionsBelow, setIsEditingActionsBelow] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);

  const isPostAuthor = Boolean(postAuthorId && comment.author.id === postAuthorId);
  const isBannedComment = Boolean(comment.isBanned);
  const canOpenMenu = !comment.isDeleted && !isBannedComment && Boolean(currentUserId);
  const isOwnComment = currentUserId === comment.author.id;
  const commentReactionState =
    comment.likeStatus === "LIKE" ? "like" : comment.likeStatus === "DISLIKE" ? "dislike" : "none";
  const isReactionDisabled = comment.isDeleted || isBannedComment;
  const shouldShowInteractionRow = !comment.isDeleted && !isBannedComment;
  const hasAuthorPage = !isBannedComment && Boolean(comment.author.id);

  const handleAuthorClick = () => {
    if (!hasAuthorPage) return;
    void router.push(buildUserPath(comment.author.id));
  };

  const resizeEditingTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    setIsEditingActionsBelow(textarea.scrollHeight > 40);
  };

  const beginEdit = () => {
    if (comment.isDeleted) return;
    setActiveMenu(false);
    setIsEditingActionsBelow(false);
    setIsEditing(true);
    setEditingValue(comment.content);
    setTimeout(() => {
      const textarea = editingTextareaRef.current;
      if (!textarea) return;
      resizeEditingTextarea(textarea);
      textarea.focus();
    }, 0);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingValue("");
    setIsEditingActionsBelow(false);
  };

  const handleUpdate = async () => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      onShowError?.(t("commentContentRequired"));
      return;
    }

    const updated = await onUpdateComment(comment.id, trimmed);
    if (updated) {
      cancelEdit();
    }
  };

  const handleDelete = async () => {
    const deleted = await onDeleteComment(comment.id);
    if (deleted) {
      if (isEditing) cancelEdit();
      setIsDeleteDialogOpen(false);
    }
  };

  const handleBan = async () => {
    const banned = await onBanCommentAuthor(comment.author.id);
    if (banned) {
      setIsBanDialogOpen(false);
    }
  };

  useEffect(() => {
    if (!activeMenu) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const currentMenu = menuRef.current;
      if (!currentMenu) return;

      if (!currentMenu.contains(event.target as Node)) {
        setActiveMenu(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [activeMenu]);

  return (
    <div className={compact ? "flex gap-2.5" : "flex gap-3"}>
      {hasAuthorPage ? (
        <button
          type="button"
          onClick={handleAuthorClick}
          className={`relative rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center transition-all duration-150 hover:bg-muted/25 hover:brightness-95 ${
            compact ? "w-7 h-7" : "w-[30px] h-[30px]"
          }`}
          aria-label={`Go to ${comment.author.name || "author"} page`}
        >
          {comment.author.profileImageUrl ? (
            <Image
              src={comment.author.profileImageUrl}
              alt={comment.author.name}
              fill
              className="object-cover"
            />
          ) : (
            <span className={`${compact ? "text-xs" : "text-sm"} font-bold text-muted-foreground`}>
              {comment.author.name.charAt(0)}
            </span>
          )}
        </button>
      ) : (
        <div
          className={`relative rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center ${
            compact ? "w-7 h-7" : "w-[30px] h-[30px]"
          }`}
        >
          {isBannedComment ? (
            <UserX className={compact ? "h-3.5 w-3.5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
          ) : comment.author.profileImageUrl ? (
            <Image
              src={comment.author.profileImageUrl}
              alt={comment.author.name}
              fill
              className="object-cover"
            />
          ) : (
            <span className={`${compact ? "text-xs" : "text-sm"} font-bold text-muted-foreground`}>
              {comment.author.name.charAt(0)}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className={`flex items-center justify-between gap-2 ${compact ? "mb-0.5" : "mb-1"}`}>
          <div className="flex items-center gap-1.5">
            {hasAuthorPage ? (
              <button
                type="button"
                onClick={handleAuthorClick}
                className={`font-semibold text-foreground hover:underline underline-offset-4 ${compact ? "text-xs" : "text-sm"}`}
                aria-label={`Go to ${comment.author.name || "author"} page`}
              >
                {comment.author.name}
              </button>
            ) : (
              <span className={`font-semibold ${compact ? "text-xs" : "text-sm"} text-foreground`}>
                {isBannedComment ? t("commentBannedAuthor") : comment.author.name}
              </span>
            )}
            {isPostAuthor ? <span className="comment-author-badge">{t("commentAuthorBadge")}</span> : null}
            <span className={`${compact ? "text-[11px]" : "text-xs"} text-muted-foreground`}>
              {formatDisplayTime(comment.createdAt, locale)}
            </span>
          </div>
          {canOpenMenu && !isEditing ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label={t("menuOpen")}
                onClick={() => setActiveMenu((prev) => !prev)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200"
                disabled={Boolean(updatingCommentId || deletingCommentId)}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {activeMenu ? (
                <div className="absolute right-0 top-7 z-20 min-w-[120px] rounded-xl border border-border bg-background p-1 shadow-lg">
                  {isOwnComment ? (
                    <>
                      <PostDetailMenuItemButton
                        onClick={beginEdit}
                        icon={<Pencil className="w-3.5 h-3.5 text-foreground" />}
                        disabled={Boolean(updatingCommentId || deletingCommentId)}
                      >
                        {t("commentEdit")}
                      </PostDetailMenuItemButton>
                      <PostDetailMenuItemButton
                        onClick={() => {
                          setActiveMenu(false);
                          setIsDeleteDialogOpen(true);
                        }}
                        icon={<Trash2 className="w-3.5 h-3.5 text-foreground" />}
                        disabled={deletingCommentId === comment.id || updatingCommentId === comment.id}
                      >
                        {t("commentDelete")}
                      </PostDetailMenuItemButton>
                    </>
                  ) : (
                    <PostDetailMenuItemButton
                      onClick={() => {
                        setActiveMenu(false);
                        setIsBanDialogOpen(true);
                      }}
                      icon={<UserX className="w-3.5 h-3.5 text-foreground" />}
                      disabled={
                        banningCommentAuthorId === comment.author.id ||
                        Boolean(updatingCommentId || deletingCommentId)
                      }
                    >
                      {t("commentBan")}
                    </PostDetailMenuItemButton>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {isEditing ? (
          <div className="relative">
            <textarea
              ref={editingTextareaRef}
              value={editingValue}
              onChange={(event) => setEditingValue(event.target.value)}
              className={`w-full min-h-9 rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none hover:bg-comment-input-hover focus:bg-comment-input-hover active:bg-comment-input-hover focus:border-border ${
                isEditingActionsBelow ? "pr-3" : "pr-24"
              }`}
              rows={1}
              onInput={(event) => {
                resizeEditingTextarea(event.currentTarget);
              }}
              disabled={updatingCommentId === comment.id}
            />
            <div
              className={
                isEditingActionsBelow
                  ? "mt-2 flex items-center justify-end gap-2"
                  : "absolute right-2 top-[6px] flex items-center gap-2"
              }
            >
              <button
                type="button"
                onClick={cancelEdit}
                disabled={updatingCommentId === comment.id}
                className="min-w-[37px] h-6 px-2 rounded-md border border-border text-[11px] leading-none font-semibold whitespace-nowrap flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/85 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleUpdate();
                }}
                disabled={updatingCommentId === comment.id}
                className="min-w-[37px] h-6 px-2 rounded-md text-[11px] leading-none font-bold whitespace-nowrap flex items-center justify-center save-action-button disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("commentSave")}
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`whitespace-pre-wrap break-words leading-relaxed text-foreground ${
              compact ? "text-xs" : "mb-2 text-sm"
            }`}
          >
            {comment.isDeleted
              ? t("commentDeleted")
              : isBannedComment
                ? t("commentBannedContent")
                : comment.content}
          </p>
        )}

        {shouldShowInteractionRow ? (
          <div className={`flex items-center ${compact ? "gap-3 mt-1.5" : "gap-4"}`}>
            <div className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-1.5 py-1 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => onLikeComment(comment.id)}
                disabled={isReactionDisabled}
                className={`rounded-full p-1 transition-colors ${
                  commentReactionState === "like"
                    ? "bg-red-500/15 text-red-600 hover:bg-red-500/20"
                    : "hover:bg-muted hover:text-foreground"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label={t("ariaLike")}
              >
                <ThumbsUp className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              </button>
              <span className="px-0.5 text-[11px] font-semibold">{comment.likeCount}</span>
              <button
                type="button"
                onClick={() => onDislikeComment(comment.id)}
                disabled={isReactionDisabled}
                className={`rounded-full p-1 transition-colors ${
                  commentReactionState === "dislike"
                    ? "bg-blue-500/15 text-blue-600 hover:bg-blue-500/20"
                    : "hover:bg-muted hover:text-foreground"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label={t("ariaDislike")}
              >
                <ThumbsDown className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              </button>
            </div>
            {extraActions}
          </div>
        ) : null}

        {children}
      </div>

      <PostDetailConfirmDialog
        isOpen={isDeleteDialogOpen}
        title={t("commentDeleteConfirm")}
        description={t("deleteConfirmDescription")}
        cancelLabel={t("close")}
        confirmLabel={t("deleteConfirmAction")}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
        }}
        onConfirm={async () => {
          await handleDelete();
        }}
        isConfirming={deletingCommentId === comment.id}
        cancelButtonClassName={CANCEL_CONFIRM_BUTTON_CLASS_NAME}
        confirmButtonClassName={DELETE_CONFIRM_BUTTON_CLASS_NAME}
      />

      <PostDetailConfirmDialog
        isOpen={isBanDialogOpen}
        title={t("commentBanConfirmTitle")}
        description={t("reportConfirmDescription")}
        cancelLabel={t("close")}
        confirmLabel={t("reportConfirmAction")}
        onCancel={() => {
          setIsBanDialogOpen(false);
        }}
        onConfirm={async () => {
          await handleBan();
        }}
        isConfirming={banningCommentAuthorId === comment.author.id}
      />
    </div>
  );
}
