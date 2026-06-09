import { Link } from "../../i18n/navigation";
import type { LinkDateRange, LinkSortOption } from "../../services/links/types";

interface LinkFilterOption<T extends string> {
  label: string;
  value: T;
  href: string;
}

interface LinkFilterBarProps {
  dateRange: LinkDateRange;
  sortBy: LinkSortOption;
  dateOptions: LinkFilterOption<LinkDateRange>[];
  sortOptions: LinkFilterOption<LinkSortOption>[];
}

function joinClasses(...classes: Array<string | false>): string {
  return classes.filter(Boolean).join(" ");
}

export default function LinkFilterBar({
  dateRange,
  sortBy,
  dateOptions,
  sortOptions,
}: LinkFilterBarProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border py-4 md:flex-row md:items-center md:gap-0">
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
        {dateOptions.map((option) => {
          const isActive = dateRange === option.value;

          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={isActive ? "page" : undefined}
              className={joinClasses(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <div className="no-scrollbar flex items-center gap-4 overflow-x-auto pb-2 text-sm md:pb-0">
        {sortOptions.map((option) => {
          const isActive = sortBy === option.value;

          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={isActive ? "page" : undefined}
              className={joinClasses(
                "whitespace-nowrap transition-colors",
                isActive
                  ? "font-bold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
