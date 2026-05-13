"use client";

import { User, X } from "lucide-react";
import UnblockActionButton from "../ui/UnblockActionButton";

interface BlockedProfileStateProps {
  onUnblock: () => void;
  isUnblocking: boolean;
  title: string;
  description: string;
  unblockLabel: string;
}

export default function BlockedProfileState({
  onUnblock,
  isUnblocking,
  title,
  description,
  unblockLabel,
}: BlockedProfileStateProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-84px)] max-w-[1280px] items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-[520px] flex-col items-center text-center">
        <span className="relative inline-flex h-[30px] w-[34px] items-center justify-center text-[#A8B0BC]">
          <User className="h-[30px] w-[30px]" />
          <X className="absolute right-0 top-0 h-3 w-3 text-[#A8B0BC]" />
        </span>
        <p className="mt-6 text-[15px] font-bold tracking-[-0.02em] text-[#687385]">{title}</p>
        <p className="mt-3 text-[14px] leading-snug text-[#687385]">{description}</p>
        <UnblockActionButton
          size="profile"
          onClick={onUnblock}
          disabled={isUnblocking}
          className="mt-4"
        >
          {unblockLabel}
        </UnblockActionButton>
      </div>
    </div>
  );
}
