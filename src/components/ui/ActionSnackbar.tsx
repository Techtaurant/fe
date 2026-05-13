"use client";

import { Check, User, X } from "lucide-react";

export type ActionSnackbarVariant = "blocked" | "unblocked" | "followed" | "unfollowed";
export type ActionSnackbarExtendedVariant = ActionSnackbarVariant | "error" | "success";

interface ActionSnackbarProps {
  isOpen: boolean;
  variant: ActionSnackbarExtendedVariant;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
  isUndoPending?: boolean;
}

export default function ActionSnackbar({
  isOpen,
  variant,
  message,
  undoLabel,
  onUndo,
  isUndoPending = false,
}: ActionSnackbarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-20 z-[430] w-fit min-w-[400px] max-w-[92vw] -translate-x-1/2">
      <div className="toast-surface btn-rect flex h-[36.3px] min-w-[400px] max-w-[92vw] items-center justify-between gap-2 px-3 text-white shadow-2xl">
        <div className="flex min-w-0 items-center gap-2">
          {variant === "blocked" ? (
            <span className="relative inline-flex h-5 w-5 items-center justify-center text-[#B7C0CF]">
              <User className="h-4 w-4" />
              <X className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-[#FF5A6D]" />
            </span>
          ) : null}
          {variant === "followed" || variant === "success" ? (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#03A87C] text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          ) : null}
          {variant === "error" ? (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#F24857] text-white">
              <X className="h-3 w-3" strokeWidth={3} />
            </span>
          ) : null}
          <p className="truncate text-[14px] font-semibold text-white">{message}</p>
        </div>

        {variant === "blocked" && onUndo && undoLabel ? (
          <button
            type="button"
            onClick={onUndo}
            disabled={isUndoPending}
            className="toast-cancel-surface shrink-0 h-6 rounded-sm px-2 text-[12px] font-semibold text-white transition-colors disabled:opacity-60"
          >
            {undoLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
