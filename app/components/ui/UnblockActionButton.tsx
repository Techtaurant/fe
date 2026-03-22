import { type ButtonHTMLAttributes, type ReactNode } from "react";

type UnblockActionButtonSize = "profile" | "list" | "headerFollow";

interface UnblockActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: UnblockActionButtonSize;
}

const SIZE_CLASS_NAME: Record<UnblockActionButtonSize, string> = {
  profile: "h-7 rounded-md px-1.5 text-[14px] leading-4 font-semibold",
  list: "h-6 min-w-[60px] rounded-md px-2 text-xs leading-none font-semibold",
  headerFollow: "h-[34px] rounded-md px-4 text-sm font-medium",
};

export default function UnblockActionButton({
  children,
  size = "list",
  className,
  type = "button",
  ...props
}: UnblockActionButtonProps) {
  const mergedClassName = [
    "inline-flex items-center justify-center whitespace-nowrap bg-[#E8F2FF] text-[#277AF0] transition-colors hover:bg-[#D8E9FF] dark:bg-[#1E2D49] dark:text-[#459BFF] dark:hover:bg-[#203455] disabled:cursor-not-allowed disabled:opacity-60",
    SIZE_CLASS_NAME[size],
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
