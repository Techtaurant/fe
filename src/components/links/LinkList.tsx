import { LinkContent } from "../../services/links/types";
import LinkCard from "./LinkCard";

interface LinkListProps {
  links: LinkContent[];
  locale: string;
  emptyMessage: string;
}

export default function LinkList({
  links,
  locale,
  emptyMessage,
}: LinkListProps) {
  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} locale={locale} />
      ))}
    </div>
  );
}
