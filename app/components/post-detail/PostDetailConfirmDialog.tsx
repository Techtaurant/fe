"use client";

interface PostDetailConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isConfirming?: boolean;
  confirmButtonClassName?: string;
}

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
}: PostDetailConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={
              confirmButtonClassName ||
              "px-4 py-2 rounded-full bg-foreground text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
