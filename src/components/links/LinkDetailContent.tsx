"use client";

import { ExternalLink } from "lucide-react";
import { getSafeExternalUrl } from "../../lib/safeExternalUrl";
import { createLinkViewLog } from "../../services/links/client";
import type { LinkContent } from "../../services/links/types";

interface LinkDetailContentProps {
  link: LinkContent;
  summaryFallback: string;
  urlLabel: string;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinkDetailContent({
  link,
  summaryFallback,
  urlLabel,
}: LinkDetailContentProps) {
  const sourceUrl = getSafeExternalUrl(link.url);

  const handleSourceClick = () => {
    void createLinkViewLog(link.id).catch(() => {
      // View logs are best-effort and should not block opening the source link.
    });
  };

  return (
    <article className="mb-10">
      <div className="mb-8 border-y border-border py-6">
        <p className="whitespace-pre-wrap text-base leading-8 text-foreground md:text-lg">
          {link.summary || summaryFallback}
        </p>
      </div>

      <div className="rounded-md border border-border bg-muted/25 p-4">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          {urlLabel}
        </p>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleSourceClick}
            className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-comment-submit-button"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{getHostname(sourceUrl)}</span>
          </a>
        ) : (
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{getHostname(link.url)}</span>
          </div>
        )}
      </div>
    </article>
  );
}
