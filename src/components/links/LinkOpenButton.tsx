"use client";

import { ExternalLink } from "lucide-react";
import { createLinkViewLog } from "../../services/links/client";

const openButtonBaseClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-opacity";
const openButtonLinkClassName = `${openButtonBaseClassName} hover:opacity-85`;

interface LinkOpenButtonProps {
  linkId: string;
  url: string;
  label: string;
}

function getSafeExternalUrl(value: string): string | undefined {
  try {
    const parsedUrl = new URL(value.trim());
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export default function LinkOpenButton({
  linkId,
  url,
  label,
}: LinkOpenButtonProps) {
  const safeUrl = getSafeExternalUrl(url);

  const handleClick = () => {
    void createLinkViewLog(linkId).catch(() => {
      // View logs are best-effort and should not block opening the source link.
    });
  };

  if (!safeUrl) {
    return (
      <button
        type="button"
        disabled
        className={`${openButtonBaseClassName} cursor-not-allowed opacity-50`}
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={openButtonLinkClassName}
    >
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}
