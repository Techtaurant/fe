"use client";

import { ReactNode, useEffect } from "react";

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

const DEFAULT_OVERLAY_CLASS_NAME =
  "fixed inset-0 z-[500] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]";

export default function AppModal({
  isOpen,
  onClose,
  children,
  overlayClassName,
  panelClassName,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: AppModalProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={overlayClassName || DEFAULT_OVERLAY_CLASS_NAME}
      onMouseDown={(event) => {
        if (!closeOnBackdrop) return;
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={panelClassName}>{children}</div>
    </div>
  );
}
