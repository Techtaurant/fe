"use client";

import { useEffect, useRef, useState } from "react";

interface PostDetailConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isConfirming?: boolean;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
}

interface PostDetailConfirmDialogActionButtonsProps {
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isConfirming?: boolean;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
}

function PostDetailConfirmDialogActionButtons({
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  isConfirming = false,
  confirmButtonClassName,
  cancelButtonClassName,
}: PostDetailConfirmDialogActionButtonsProps) {
  return (
    <div className="mt-5 flex justify-center">
      <div className="flex w-full min-w-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={cancelButtonClassName || CANCEL_CONFIRM_BUTTON_CLASS_NAME}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className={confirmButtonClassName || DELETE_CONFIRM_BUTTON_CLASS_NAME}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

export const DELETE_CONFIRM_BUTTON_CLASS_NAME =
  "h-[40px] min-w-[136px] flex-1 px-4 py-2 rounded-lg bg-delete text-sm font-semibold text-white text-center hover:bg-delete-hover transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap";

export const PUBLIC_CONFIRM_BUTTON_CLASS_NAME =
  "h-[40px] min-w-[136px] flex-1 px-4 py-2 rounded-lg bg-[#3182F6] text-sm font-semibold text-white text-center hover:bg-[#2563EB] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap";

export const PRIVATE_CONFIRM_BUTTON_CLASS_NAME =
  "h-[40px] min-w-[136px] flex-1 px-4 py-2 rounded-lg bg-[#4B5563] text-sm font-semibold text-white text-center hover:bg-[#374151] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap";

export const CANCEL_CONFIRM_BUTTON_CLASS_NAME =
  "h-[40px] min-w-[136px] flex-1 px-4 py-2 rounded-lg bg-close-button text-sm text-foreground text-center font-semibold hover:bg-close-button-hover transition-colors whitespace-nowrap";

export default function PostDetailConfirmDialog({
  isOpen,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  isConfirming = false,
  confirmButtonClassName,
  cancelButtonClassName,
}: PostDetailConfirmDialogProps) {
  const [isShaking, setIsShaking] = useState(false);
  const timeoutRef = useRef<number | NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleBackdropMouseDown = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsShaking(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsShaking(false);
      timeoutRef.current = null;
    }, 320);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleBackdropMouseDown();
        }
      }}
    >
      <div
        className={`w-[calc(100%-2rem)] max-w-[320px] rounded-2xl bg-background dark:bg-[#2C2C35] p-5 shadow-xl ${
          isShaking ? "animate-post-detail-confirm-dialog-shake" : ""
        }`}
      >
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        <PostDetailConfirmDialogActionButtons
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          onCancel={onCancel}
          onConfirm={onConfirm}
          isConfirming={isConfirming}
          confirmButtonClassName={confirmButtonClassName}
          cancelButtonClassName={cancelButtonClassName}
        />
      </div>
    </div>
  );
}
