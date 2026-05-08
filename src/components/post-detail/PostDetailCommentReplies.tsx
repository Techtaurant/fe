'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';

import { queryKeys } from '../../lib/queryKeys';
import { fetchCommentReplies } from '../../services/comments';
import { resolveFetchCommentsError } from '../../services/comments/errors';
import { mapCommentListItemToComment } from '../../services/comments/mappers';
import { CommentSort } from '../../services/comments/types';
import PostDetailCommentItem from './PostDetailCommentItem';

interface PostDetailCommentRepliesProps {
  parentCommentId: string;
  parentSort: CommentSort;
  onLikeComment: (commentId: string) => void;
  onDislikeComment: (commentId: string) => void;
  onUpdateComment: (commentId: string, content: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  onBanCommentAuthor: (targetUserId: string) => Promise<boolean>;
  currentUserId?: string | null;
  postAuthorId?: string | null;
  updatingCommentId: string | null;
  deletingCommentId: string | null;
  banningCommentAuthorId: string | null;
  onShowError?: (message: string) => void;
}

const REPLIES_PAGE_SIZE = 20;

export default function PostDetailCommentReplies({
  parentCommentId,
  parentSort,
  onLikeComment,
  onDislikeComment,
  onUpdateComment,
  onDeleteComment,
  onBanCommentAuthor,
  currentUserId,
  postAuthorId,
  updatingCommentId,
  deletingCommentId,
  banningCommentAuthorId,
  onShowError,
}: PostDetailCommentRepliesProps) {
  const t = useTranslations('PostDetail');
  const repliesSort: CommentSort = parentSort === 'LIKE' ? 'LIKE' : 'LATEST';

  const repliesQuery = useInfiniteQuery({
    queryKey: queryKeys.comments.replies({
      commentId: parentCommentId,
      sort: repliesSort,
      size: REPLIES_PAGE_SIZE,
    }),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchCommentReplies({
        commentId: parentCommentId,
        size: REPLIES_PAGE_SIZE,
        sort: repliesSort,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
  });

  useEffect(() => {
    if (!repliesQuery.error) return;
    const resolved = resolveFetchCommentsError(repliesQuery.error);
    if (resolved.alertMessage) {
      onShowError?.(resolved.alertMessage);
    }
  }, [onShowError, repliesQuery.error]);

  const replies = useMemo(
    () =>
      (repliesQuery.data?.pages ?? [])
        .flatMap((page) => page.data.content)
        .map(mapCommentListItemToComment),
    [repliesQuery.data?.pages],
  );

  return (
    <div className="border-border/70 mt-3 ml-10 space-y-3 border-l pl-4">
      {repliesQuery.isPending && replies.length === 0 ? (
        <p className="text-muted-foreground py-1 text-xs">{t('loadingReplies')}</p>
      ) : replies.length > 0 ? (
        replies.map((reply) => {
          return (
            <PostDetailCommentItem
              key={reply.id}
              comment={reply}
              compact
              onLikeComment={onLikeComment}
              onDislikeComment={onDislikeComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onBanCommentAuthor={onBanCommentAuthor}
              currentUserId={currentUserId}
              postAuthorId={postAuthorId}
              updatingCommentId={updatingCommentId}
              deletingCommentId={deletingCommentId}
              banningCommentAuthorId={banningCommentAuthorId}
              onShowError={onShowError}
            />
          );
        })
      ) : (
        <p className="text-muted-foreground py-1 text-xs">{t('noReplies')}</p>
      )}

      {repliesQuery.hasNextPage ? (
        <div>
          <button
            type="button"
            onClick={() => {
              if (!repliesQuery.hasNextPage || repliesQuery.isFetchingNextPage) return;
              void repliesQuery.fetchNextPage();
            }}
            disabled={repliesQuery.isFetchingNextPage}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/85 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {repliesQuery.isFetchingNextPage ? t('loadingMore') : t('loadMoreReplies')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
