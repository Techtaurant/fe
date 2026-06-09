"use client";

import { CalendarDays, Check, Circle } from "lucide-react";
import { Link } from "../../i18n/navigation";
import { getSafeExternalUrl } from "../../lib/safeExternalUrl";
import { createLinkViewLog } from "../../services/links/client";
import type { LinkContent } from "../../services/links/types";
import { formatDisplayTime } from "../../utils";

interface LinkCardProps {
  link: LinkContent;
  locale: string;
  summaryFallback: string;
  readStatus?: boolean;
  readLabel: string;
  unreadLabel: string;
}

function buildTagPath(tagName: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set("tag", tagName);
  return `/links?${searchParams.toString()}`;
}

function buildSourceCompanyPath(sourceCompanyName: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set("sourceCompanyName", sourceCompanyName);
  return `/links?${searchParams.toString()}`;
}

function resolveDisplayTime(link: LinkContent): string {
  return link.publishedAt || link.createdAt || link.updatedAt || "";
}

export default function LinkCard({
  link,
  locale,
  summaryFallback,
  readStatus,
  readLabel,
  unreadLabel,
}: LinkCardProps) {
  const previewTags = link.tags.slice(0, 3);
  const hiddenTagCount = Math.max(link.tags.length - previewTags.length, 0);
  const displayTime = resolveDisplayTime(link);
  const detailPath = `/links/${encodeURIComponent(link.id)}`;
  const sourceUrl = getSafeExternalUrl(link.url);

  const handleSourceClick = () => {
    void createLinkViewLog(link.id).catch(() => {
      // View logs are best-effort and should not block opening the source link.
    });
  };

  return (
    <article className="py-4 md:py-6 border-b border-border">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {link.sourceCompanyName ? (
            <>
              <Link
                href={buildSourceCompanyPath(link.sourceCompanyName)}
                className="font-medium text-foreground transition-colors hover:text-comment-submit-button"
              >
                {link.sourceCompanyName}
              </Link>
              <span>•</span>
            </>
          ) : null}
          {displayTime ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDisplayTime(displayTime, locale)}
            </span>
          ) : null}
          {readStatus !== undefined ? (
            <span
              className={`ml-auto inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium md:ml-2 ${
                readStatus
                  ? "bg-muted text-muted-foreground"
                  : "bg-comment-author-badge-background text-comment-author-badge-foreground"
              }`}
            >
              {readStatus ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Circle className="h-3 w-3" aria-hidden="true" />
              )}
              {readStatus ? readLabel : unreadLabel}
            </span>
          ) : null}
        </div>

        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleSourceClick}
            className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-comment-submit-button focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <h2 className="text-lg md:text-xl font-bold text-comment-submit-button mb-2 md:mb-3 line-clamp-2 font-kr-serif transition-colors duration-200 hover:text-comment-submit-button-hover">
              {link.title}
            </h2>
          </a>
        ) : (
          <h2 className="text-lg md:text-xl font-bold text-comment-submit-button mb-2 md:mb-3 line-clamp-2 font-kr-serif">
            {link.title}
          </h2>
        )}

        <Link
          href={detailPath}
          className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-comment-submit-button focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-normal line-clamp-2 md:line-clamp-3">
            {link.summary || summaryFallback}
          </p>
        </Link>

        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          {previewTags.length > 0 ? (
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              {previewTags.map((tag) => (
                <Link
                  href={buildTagPath(tag.name)}
                  key={tag.id}
                  className="px-1 md:px-1.5 py-0.5 rounded-sm bg-muted/85 text-[10px] md:text-[11px] font-semibold text-blue-500 hover:bg-muted/30 hover:text-blue-400 transition-colors duration-200"
                >
                  #{tag.name}
                </Link>
              ))}
              {hiddenTagCount > 0 ? (
                <span className="px-1 md:px-1.5 py-0.5 rounded-sm bg-muted/70 text-[10px] md:text-[11px] text-muted-foreground">
                  +{hiddenTagCount}
                </span>
              ) : null}
            </div>
          ) : null}

        </div>
      </div>
    </article>
  );
}
