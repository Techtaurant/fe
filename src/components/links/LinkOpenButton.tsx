"use client";

import { ExternalLink } from "lucide-react";
import { getSafeExternalUrl } from "../../lib/safeExternalUrl";
import { createLinkViewLog } from "../../services/links/client";

const openButtonBaseClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200";
const openButtonLinkClassName = `${openButtonBaseClassName} hover:text-foreground`;

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
        aria-label={label}
        title={label}
      >
        <ExternalLink className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">{label}</span>
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
      aria-label={label}
      title={label}
    >
      <ExternalLink className="h-6 w-6" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </a>
  );
}
