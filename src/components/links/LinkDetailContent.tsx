import { ExternalLink } from "lucide-react";
import { LinkContent } from "../../services/links/types";

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
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{getHostname(link.url)}</span>
        </div>
      </div>
    </article>
  );
}
