import { CalendarDays, ExternalLink } from "lucide-react";
import { Link } from "../../i18n/navigation";
import { LinkContent } from "../../services/links/types";
import { formatDisplayTime } from "../../utils";

interface LinkCardProps {
  link: LinkContent;
  locale: string;
}

function buildTagPath(tagName: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set("tag", tagName);
  return `/links?${searchParams.toString()}`;
}

function resolveDisplayTime(link: LinkContent): string {
  return link.publishedAt || link.createdAt || link.updatedAt || "";
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinkCard({ link, locale }: LinkCardProps) {
  const previewTags = link.tags.slice(0, 3);
  const hiddenTagCount = Math.max(link.tags.length - previewTags.length, 0);
  const displayTime = resolveDisplayTime(link);
  const detailPath = `/links/${encodeURIComponent(link.id)}`;

  return (
    <article className="group py-4 md:py-6 border-b border-border">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {link.sourceCompanyUserId ? (
            <>
              <span className="font-medium text-foreground">
                {link.sourceCompanyUserId}
              </span>
              <span>•</span>
            </>
          ) : null}
          {displayTime ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDisplayTime(displayTime, locale)}
            </span>
          ) : null}
        </div>

        <Link
          href={detailPath}
          className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3 line-clamp-2 font-kr-serif group-hover:text-foreground">
            {link.title}
          </h2>

          {link.summary ? (
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-normal line-clamp-2 md:line-clamp-3">
              {link.summary}
            </p>
          ) : null}
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

          <span className="ml-auto inline-flex items-center gap-1 text-xs md:text-sm font-medium text-muted-foreground">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {getHostname(link.url)}
          </span>
        </div>
      </div>
    </article>
  );
}
