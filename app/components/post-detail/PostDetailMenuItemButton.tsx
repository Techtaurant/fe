import { ButtonHTMLAttributes, ReactNode } from "react";

interface PostDetailMenuItemButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  className?: string;
}

const BASE_MENU_ITEM_CLASS_NAME =
  "w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60";

export default function PostDetailMenuItemButton({
  icon,
  className,
  children,
  ...buttonProps
}: PostDetailMenuItemButtonProps) {
  const mergedClassName = className
    ? `${BASE_MENU_ITEM_CLASS_NAME} ${className}`
    : BASE_MENU_ITEM_CLASS_NAME;

  return (
    <button type="button" className={mergedClassName} {...buttonProps}>
      {icon ? <span className="inline-flex items-center gap-2">{icon}{children}</span> : children}
    </button>
  );
}
