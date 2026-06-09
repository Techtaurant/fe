import { ArrowLeft, CalendarDays } from "lucide-react";
import { Link } from "../../i18n/navigation";
import { LinkContent } from "../../services/links/types";
import { formatDisplayTime } from "../../utils";

interface LinkDetailHeaderProps {
  link: LinkContent;
  locale: string;
  backLabel: string;
  sourceCompanyLabel: string;
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

export default function LinkDetailHeader({
  link,
  locale,
  backLabel,
  sourceCompanyLabel,
}: LinkDetailHeaderProps) {
  const displayTime = resolveDisplayTime(link);
  const sourceLabel = link.sourceCompanyName ?? sourceCompanyLabel;
  const sourceCompanyPath = link.sourceCompanyName
    ? buildSourceCompanyPath(link.sourceCompanyName)
    : undefined;

  return (
    <header className="mb-8">
      <Link
        href="/links"
        className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">{backLabel}</span>
      </Link>

      {sourceCompanyPath ? (
        <Link
          href={sourceCompanyPath}
          className="mb-3 inline-flex max-w-full rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/90 hover:text-foreground"
        >
          <span>{sourceLabel}</span>
        </Link>
      ) : null}

      <h1 className="mb-6 text-2xl font-bold leading-tight text-foreground md:text-4xl">
        {link.title}
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {displayTime ? (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {formatDisplayTime(displayTime, locale)}
          </span>
        ) : null}
      </div>

      {link.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {link.tags.map((tag) => (
            <Link
              href={buildTagPath(tag.name)}
              key={tag.id}
              className="rounded-sm bg-muted/85 px-1.5 py-0.5 text-[11px] font-semibold text-blue-500 transition-colors duration-200 hover:bg-muted/30 hover:text-blue-400"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
