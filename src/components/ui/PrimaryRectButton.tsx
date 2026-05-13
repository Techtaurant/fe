"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface PrimaryRectButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function PrimaryRectButton({
  children,
  className,
  type = "button",
  ...props
}: PrimaryRectButtonProps) {
  const mergedClassName = [
    "btn-rect btn-primary-surface text-[#FFFFFF] [&_*]:text-[#FFFFFF] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={mergedClassName} {...props}>
      {children}
    </button>
  );
}
