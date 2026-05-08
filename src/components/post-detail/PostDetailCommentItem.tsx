'use client';

import { MoreVertical, Pencil, ThumbsDown, ThumbsUp, Trash2, UserX } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { useRouter } from '../../i18n/navigation';
import { buildUserPath } from '../../lib/userRoute';
import { Comment } from '../../types';
import { formatDisplayTime } from '../../utils';
import PostDetailConfirmDialog, {
  CANCEL_CONFIRM_BUTTON_CLASS_NAME,
  DELETE_CONFIRM_BUTTON_CLASS_NAME,
} from './PostDetailConfirmDialog';
import PostDetailMenuItemButton from './PostDetailMenuItemButton';

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
  const t = useTranslations('PostDetail');
  const locale = useLocale();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeMenu, setActiveMenu] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActionsBelow, setIsEditingActionsBelow] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);

  const isPostAuthor = Boolean(postAuthorId && comment.author.id === postAuthorId);
  const isBannedComment = Boolean(comment.isBanned);
  const canOpenMenu = !comment.isDeleted && !isBannedComment && Boolean(currentUserId);
  const isOwnComment = currentUserId === comment.author.id;
  const commentReactionState =
    comment.likeStatus === 'LIKE' ? 'like' : comment.likeStatus === 'DISLIKE' ? 'dislike' : 'none';
  const isReactionDisabled = comment.isDeleted || isBannedComment;
  const shouldShowInteractionRow = !comment.isDeleted && !isBannedComment;
  const hasAuthorPage = !isBannedComment && Boolean(comment.author.id);

  const handleAuthorClick = () => {
    if (!hasAuthorPage) return;
    void router.push(buildUserPath(comment.author.id));
  };

  const resizeEditingTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
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
    setEditingValue('');
    setIsEditingActionsBelow(false);
  };

  const handleUpdate = async () => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      onShowError?.(t('commentContentRequired'));
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

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [activeMenu]);

  return (
    <div className={compact ? 'flex gap-2.5' : 'flex gap-3'}>
      {hasAuthorPage ? (
        <button
          type="button"
          onClick={handleAuthorClick}
          className={`bg-muted hover:bg-muted/25 relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-150 hover:brightness-95 ${
            compact ? 'h-7 w-7' : 'h-[30px] w-[30px]'
          }`}
          aria-label={`Go to ${comment.author.name || 'author'} page`}
        >
          {comment.author.profileImageUrl ? (
            <Image
              src={comment.author.profileImageUrl}
              alt={comment.author.name}
              fill
              className="object-cover"
            />
          ) : (
            <span className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground font-bold`}>
              {comment.author.name.charAt(0)}
            </span>
          )}
        </button>
      ) : (
        <div
          className={`bg-muted relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${
            compact ? 'h-7 w-7' : 'h-[30px] w-[30px]'
          }`}
        >
          {isBannedComment ? (
            <UserX
              className={
                compact ? 'text-muted-foreground h-3.5 w-3.5' : 'text-muted-foreground h-4 w-4'
              }
            />
          ) : comment.author.profileImageUrl ? (
            <Image
              src={comment.author.profileImageUrl}
              alt={comment.author.name}
              fill
              className="object-cover"
            />
          ) : (
            <span className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground font-bold`}>
              {comment.author.name.charAt(0)}
            </span>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className={`flex items-center justify-between gap-2 ${compact ? 'mb-0.5' : 'mb-1'}`}>
          <div className="flex items-center gap-1.5">
            {hasAuthorPage ? (
              <button
                type="button"
                onClick={handleAuthorClick}
                className={`text-foreground font-semibold underline-offset-4 hover:underline ${compact ? 'text-xs' : 'text-sm'}`}
                aria-label={`Go to ${comment.author.name || 'author'} page`}
              >
                {comment.author.name}
              </button>
            ) : (
              <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} text-foreground`}>
                {isBannedComment ? t('commentBannedAuthor') : comment.author.name}
              </span>
            )}
            {isPostAuthor ? (
              <span className="comment-author-badge">{t('commentAuthorBadge')}</span>
            ) : null}
            <span className={`${compact ? 'text-[11px]' : 'text-xs'} text-muted-foreground`}>
              {formatDisplayTime(comment.createdAt, locale)}
            </span>
          </div>
          {canOpenMenu && !isEditing ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label={t('menuOpen')}
                onClick={() => setActiveMenu((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors duration-200"
                disabled={Boolean(updatingCommentId || deletingCommentId)}
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {activeMenu ? (
                <div className="border-border bg-background absolute top-7 right-0 z-20 min-w-[120px] rounded-xl border p-1 shadow-lg">
                  {isOwnComment ? (
                    <>
                      <PostDetailMenuItemButton
                        onClick={beginEdit}
                        icon={<Pencil className="text-foreground h-3.5 w-3.5" />}
                        disabled={Boolean(updatingCommentId || deletingCommentId)}
                      >
                        {t('commentEdit')}
                      </PostDetailMenuItemButton>
                      <PostDetailMenuItemButton
                        onClick={() => {
                          setActiveMenu(false);
                          setIsDeleteDialogOpen(true);
                        }}
                        icon={<Trash2 className="text-foreground h-3.5 w-3.5" />}
                        disabled={
                          deletingCommentId === comment.id || updatingCommentId === comment.id
                        }
                      >
                        {t('commentDelete')}
                      </PostDetailMenuItemButton>
                    </>
                  ) : (
                    <PostDetailMenuItemButton
                      onClick={() => {
                        setActiveMenu(false);
                        setIsBanDialogOpen(true);
                      }}
                      icon={<UserX className="text-foreground h-3.5 w-3.5" />}
                      disabled={
                        banningCommentAuthorId === comment.author.id ||
                        Boolean(updatingCommentId || deletingCommentId)
                      }
                    >
                      {t('commentBan')}
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
              className={`border-border bg-background hover:bg-comment-input-hover focus:bg-comment-input-hover active:bg-comment-input-hover focus:border-border min-h-9 w-full resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none ${
                isEditingActionsBelow ? 'pr-3' : 'pr-24'
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
                  ? 'mt-2 flex items-center justify-end gap-2'
                  : 'absolute top-[6px] right-2 flex items-center gap-2'
              }
            >
              <button
                type="button"
                onClick={cancelEdit}
                disabled={updatingCommentId === comment.id}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/85 flex h-6 min-w-[37px] items-center justify-center rounded-md border px-2 text-[11px] leading-none font-semibold whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleUpdate();
                }}
                disabled={updatingCommentId === comment.id}
                className="save-action-button flex h-6 min-w-[37px] items-center justify-center rounded-md px-2 text-[11px] leading-none font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('commentSave')}
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`text-foreground leading-relaxed break-words whitespace-pre-wrap ${
              compact ? 'text-xs' : 'mb-2 text-sm'
            }`}
          >
            {comment.isDeleted
              ? t('commentDeleted')
              : isBannedComment
                ? t('commentBannedContent')
                : comment.content}
          </p>
        )}

        {shouldShowInteractionRow ? (
          <div className={`flex items-center ${compact ? 'mt-1.5 gap-3' : 'gap-4'}`}>
            <div className="bg-muted/70 text-muted-foreground inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xs">
              <button
                type="button"
                onClick={() => onLikeComment(comment.id)}
                disabled={isReactionDisabled}
                className={`rounded-full p-1 transition-colors ${
                  commentReactionState === 'like'
                    ? 'bg-red-500/15 text-red-600 hover:bg-red-500/20'
                    : 'hover:bg-muted hover:text-foreground'
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label={t('ariaLike')}
              >
                <ThumbsUp className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              </button>
              <span className="px-0.5 text-[11px] font-semibold">{comment.likeCount}</span>
              <button
                type="button"
                onClick={() => onDislikeComment(comment.id)}
                disabled={isReactionDisabled}
                className={`rounded-full p-1 transition-colors ${
                  commentReactionState === 'dislike'
                    ? 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/20'
                    : 'hover:bg-muted hover:text-foreground'
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label={t('ariaDislike')}
              >
                <ThumbsDown className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              </button>
            </div>
            {extraActions}
          </div>
        ) : null}

        {children}
      </div>

      <PostDetailConfirmDialog
        isOpen={isDeleteDialogOpen}
        title={t('commentDeleteConfirm')}
        description={t('deleteConfirmDescription')}
        cancelLabel={t('close')}
        confirmLabel={t('deleteConfirmAction')}
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
        title={t('commentBanConfirmTitle')}
        description={t('reportConfirmDescription')}
        cancelLabel={t('close')}
        confirmLabel={t('reportConfirmAction')}
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
