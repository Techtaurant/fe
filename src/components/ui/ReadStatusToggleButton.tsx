"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import readCheckAnimation from "../../assets/animations/read-check-success.json";

interface ReadStatusToggleButtonProps {
  isRead: boolean;
  label: string;
  markReadToast: string;
  markUnreadToast: string;
  onToggleRead: (nextIsRead: boolean) => boolean | void;
  className?: string;
  disabled?: boolean;
  guideLabel?: string;
  guideStorageKey?: string;
}

export default function ReadStatusToggleButton({
  isRead,
  label,
  markReadToast,
  markUnreadToast,
  onToggleRead,
  className,
  disabled = false,
  guideLabel,
  guideStorageKey,
}: ReadStatusToggleButtonProps) {
  const [isPressing, setIsPressing] = useState(false);
  const [readToggleToast, setReadToggleToast] = useState<string | null>(null);
  const showReadCheckedIconRef = useRef(isRead);
  const [isReadGuideVisible, setIsReadGuideVisible] = useState(() => {
    if (!guideLabel || !guideStorageKey || typeof window === "undefined") {
      return false;
    }

    try {
      return window.localStorage.getItem(guideStorageKey) !== "1";
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
      lottieRef.current.goToAndStop(
        typeof finalFrame === "number" ? finalFrame : 0,
        true,
      );
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
    const message = nextState ? markReadToast : markUnreadToast;
    setReadToggleToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setReadToggleToast(null);
    }, 1100);
  };

  const dismissReadGuide = () => {
    if (!guideStorageKey || typeof window === "undefined") {
      return;
    }

    if (guideTimerRef.current) {
      clearTimeout(guideTimerRef.current);
      guideTimerRef.current = null;
    }

    try {
      window.localStorage.setItem(guideStorageKey, "1");
    } catch {
      // ignore storage errors
    }
    setIsReadGuideVisible(false);
  };

  const handleToggleRead = () => {
    if (disabled) return;

    const nextState = !isRead;
    const shouldContinue = onToggleRead(nextState);
    if (shouldContinue === false) return;

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
  };

  const handlePointerDown = () => {
    if (disabled) return;

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
    transform: isPressing ? "scale(0.94)" : "scale(1)",
  };

  const statusAnimationStyle = {
    transform: isPressing
      ? "translateY(1px) scale(0.98)"
      : "translateY(1px) scale(1)",
    display: "block",
    opacity: isRead ? 1 : 0.55,
    filter: isRead ? "none" : "grayscale(1)",
  };

  return (
    <div className="relative">
      {isReadGuideVisible && guideLabel ? (
        <p
          role="status"
          aria-live="polite"
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-popover px-3 py-1 text-[11px] text-popover-foreground shadow-sm"
        >
          {guideLabel}
        </p>
      ) : null}

      {readToggleToast ? (
        <p
          role="status"
          aria-live="polite"
          className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-border bg-popover px-3 py-1.5 text-[11px] text-popover-foreground shadow-lg shadow-black/15 before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-[6px] before:border-transparent before:border-t-popover before:content-['']"
        >
          {readToggleToast}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleToggleRead}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={disabled}
        className={[
          "relative inline-flex h-10 w-10 items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={readButtonStyle}
        title={label}
        aria-label={label}
      >
        <span className="sr-only">{label}</span>

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
  );
}
