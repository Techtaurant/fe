"use client";

import { ExternalLink } from "lucide-react";
import { createLinkViewLog } from "../../services/links/client";

interface LinkOpenButtonProps {
  linkId: string;
  url: string;
  label: string;
}

export default function LinkOpenButton({
  linkId,
  url,
  label,
}: LinkOpenButtonProps) {
  const handleClick = () => {
    void createLinkViewLog(linkId).catch(() => {
      // View logs are best-effort and should not block opening the source link.
    });
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-85"
    >
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}
