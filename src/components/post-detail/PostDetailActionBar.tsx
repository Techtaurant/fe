'use client';

import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { Eye, MessageCircle, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import readCheckAnimation from '../../assets/animations/read-check-success.json';

type ReactionState = 'like' | 'dislike' | 'none';

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

const READ_TOGGLE_GUIDE_KEY = 'post-detail-read-toggle-guide-seen';

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
  const t = useTranslations('PostDetail');
  const isReadStatusLabel = isRead ? t('markRead') : t('markUnread');
  const [isPressing, setIsPressing] = useState(false);
  const [readToggleToast, setReadToggleToast] = useState<string | null>(null);
  const showReadCheckedIconRef = useRef(isRead);
  const [isReadGuideVisible, setIsReadGuideVisible] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return window.localStorage.getItem(READ_TOGGLE_GUIDE_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const handleReadCheckAnimationComplete = useCallback(() => {
    if (isRead) {
      showReadCheckedIconRef.current = true;
    }
  }, [isRead]);

  const syncLottieToReadState = useCallback((nextState: boolean) => {
    if (!lottieRef.current) {
      return;
    }

    if (!nextState) {
      lottieRef.current.goToAndStop(0, true);
      return;
    }

    if (showReadCheckedIconRef.current) {
      const finalFrame = lottieRef.current.getDuration(true);
      lottieRef.current.goToAndStop(typeof finalFrame === 'number' ? finalFrame : 0, true);
      return;
    }

    lottieRef.current.goToAndStop(0, true);
    lottieRef.current.play();
  }, []);

  useEffect(() => {
    if (!isRead) {
      showReadCheckedIconRef.current = false;
    }

    syncLottieToReadState(isRead);
  }, [isRead, syncLottieToReadState]);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (guideTimerRef.current) {
        clearTimeout(guideTimerRef.current);
      }
    };
  }, []);

  const showReadToggleToast = (nextState: boolean) => {
    const message = nextState ? t('markReadToast') : t('markUnreadToast');
    setReadToggleToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setReadToggleToast(null);
    }, 1100);
  };

  const dismissReadGuide = () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (guideTimerRef.current) {
      clearTimeout(guideTimerRef.current);
      guideTimerRef.current = null;
    }

    try {
      window.localStorage.setItem(READ_TOGGLE_GUIDE_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setIsReadGuideVisible(false);
  };

  const handleToggleRead = () => {
    const nextState = !isRead;
    if (nextState) {
      showReadCheckedIconRef.current = false;
    }
    setIsPressing(true);
    if (isReadGuideVisible) {
      dismissReadGuide();
    }

    showReadToggleToast(nextState);

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    pressTimerRef.current = setTimeout(() => {
      setIsPressing(false);
    }, 320);

    onToggleRead();
  };

  const handlePointerDown = () => {
    setIsPressing(true);

    if (!isReadGuideVisible) {
      return;
    }

    if (guideTimerRef.current) {
      clearTimeout(guideTimerRef.current);
    }

    guideTimerRef.current = setTimeout(() => {
      dismissReadGuide();
    }, 2000);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    if (guideTimerRef.current) {
      clearTimeout(guideTimerRef.current);
      guideTimerRef.current = null;
    }

    setIsPressing(false);
  };

  const readButtonStyle = {
    transform: isPressing ? 'scale(0.94)' : 'scale(1)',
  };

  const statusAnimationStyle = {
    transform: isPressing ? 'translateY(1px) scale(0.98)' : 'translateY(1px) scale(1)',
    display: 'block',
    opacity: isRead ? 1 : 0.55,
    filter: isRead ? 'none' : 'grayscale(1)',
  };

  return (
    <div className="border-border mb-3 flex items-center justify-between border-t py-3">
      <div className="flex items-center gap-4">
        <div className="bg-muted text-muted-foreground flex items-center gap-3 rounded-full px-3 py-2 text-base font-semibold">
          <button
            onClick={onLike}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 ${
              reactionState === 'like'
                ? 'bg-red-500/15 text-red-600 hover:bg-red-500/20'
                : 'hover:text-foreground hover:bg-muted/80'
            }`}
            aria-label={t('ariaLike')}
          >
            <ThumbsUp className="h-5 w-5" />
          </button>
          <span className="px-1">{formatCount(likeCount)}</span>
          <button
            onClick={onDislike}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 ${
              reactionState === 'dislike'
                ? 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/20'
                : 'hover:text-foreground hover:bg-muted/80'
            }`}
            aria-label={t('ariaDislike')}
          >
            <ThumbsDown className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onFocusComment}
          className="bg-muted text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-base font-semibold transition-colors duration-200"
        >
          <MessageCircle className="h-6 w-6" />
          <span>{formatCount(commentCount)}</span>
        </button>

        <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold">
          <Eye className="h-6 w-6" />
          <span>{formatCount(viewCount)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showReadToggle && (
          <div className="relative">
            {isReadGuideVisible && (
              <p
                role="status"
                aria-live="polite"
                className="border-border bg-popover text-popover-foreground absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-[11px] whitespace-nowrap shadow-sm"
              >
                {t('readToggleGuide')}
              </p>
            )}

            {readToggleToast && (
              <p
                role="status"
                aria-live="polite"
                className="border-border bg-popover text-popover-foreground before:border-t-popover absolute -top-16 left-1/2 -translate-x-1/2 rounded-2xl border px-3 py-1.5 text-[11px] whitespace-nowrap shadow-lg shadow-black/15 before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-[6px] before:border-transparent before:content-['']"
              >
                {readToggleToast}
              </p>
            )}

            <button
              onClick={handleToggleRead}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center"
              style={readButtonStyle}
              title={isReadStatusLabel}
              aria-label={isReadStatusLabel}
            >
              <span className="sr-only">{isReadStatusLabel}</span>

              <span className="relative inline-flex h-10 w-10 items-center justify-center">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={readCheckAnimation}
                  onDOMLoaded={() => {
                    syncLottieToReadState(isRead);
                  }}
                  onComplete={handleReadCheckAnimationComplete}
                  loop={false}
                  autoplay={false}
                  className="h-10 w-10"
                  aria-hidden="true"
                  style={statusAnimationStyle}
                />
              </span>
            </button>
          </div>
        )}

        <button
          onClick={onShare}
          className="text-muted-foreground hover:text-foreground inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors duration-200"
        >
          <Share2 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
