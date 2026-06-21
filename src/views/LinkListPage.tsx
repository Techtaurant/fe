import { getTranslations } from "next-intl/server";
import Header from "../components/Header";
import LinkFilterBar from "../components/links/LinkFilterBar";
import LinkList from "../components/links/LinkList";
import { Link } from "../i18n/navigation";
import { fetchOpenLinks } from "../services/links/server";
import type {
  LinkDateRange,
  LinkListPeriod,
  LinkListSort,
  LinkSortOption,
} from "../services/links/types";

type SearchParamValue = string | string[] | undefined;

const DATE_RANGE_OPTIONS: LinkDateRange[] = ["7d", "30d", "365d", "all"];
const SORT_OPTIONS: LinkSortOption[] = ["latest", "likes", "saves"];

const DATE_RANGE_TO_PERIOD: Record<LinkDateRange, LinkListPeriod> = {
  "7d": "WEEK",
  "30d": "MONTH",
  "365d": "YEAR",
  all: "ALL",
};

const SORT_OPTION_TO_SORT: Record<LinkSortOption, LinkListSort> = {
  latest: "PUBLISHED",
  likes: "LIKE",
  saves: "SAVE",
};

interface LinkListPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, SearchParamValue>>;
}

function readFirstParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }
  return value?.trim() || undefined;
}

function normalizeSize(value: SearchParamValue): number {
  const rawSize = readFirstParam(value);
  const size = rawSize ? Number(rawSize) : 20;

  if (!Number.isFinite(size)) return 20;
  return Math.min(100, Math.max(1, Math.floor(size)));
}

function normalizeDateRange(value: SearchParamValue): LinkDateRange {
  const rawValue = readFirstParam(value)?.toLowerCase();
  if (rawValue === "week") return "7d";
  if (rawValue === "month") return "30d";
  if (rawValue === "year") return "365d";
  if (rawValue && DATE_RANGE_OPTIONS.includes(rawValue as LinkDateRange)) {
    return rawValue as LinkDateRange;
  }
  return "all";
}

function normalizeSortOption(value: SearchParamValue): LinkSortOption {
  const rawValue = readFirstParam(value)?.toLowerCase();
  if (rawValue === "published") return "latest";
  if (rawValue === "like") return "likes";
  if (rawValue === "save") return "saves";
  if (rawValue && SORT_OPTIONS.includes(rawValue as LinkSortOption)) {
    return rawValue as LinkSortOption;
  }
  return "latest";
}

function buildLinkListPath(params: {
  cursor?: string;
  size: number;
  sourceCompanyUserId?: string;
  sourceCompanyName?: string;
  tag?: string;
  dateRange?: LinkDateRange;
  sortBy?: LinkSortOption;
}): string {
  const searchParams = new URLSearchParams();
  if (params.cursor) searchParams.set("cursor", params.cursor);
  searchParams.set("size", String(params.size));
  if (params.sourceCompanyUserId) {
    searchParams.set("sourceCompanyUserId", params.sourceCompanyUserId);
  }
  if (params.sourceCompanyName) {
    searchParams.set("sourceCompanyName", params.sourceCompanyName);
  }
  if (params.tag) searchParams.set("tag", params.tag);
  if (params.dateRange && params.dateRange !== "all") {
    searchParams.set("period", params.dateRange);
  }
  if (params.sortBy && params.sortBy !== "latest") {
    searchParams.set("sort", params.sortBy);
  }

  const query = searchParams.toString();
  return query ? `/links?${query}` : "/links";
}

export default async function LinkListPage({
  params,
  searchParams,
}: LinkListPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const t = await getTranslations({ locale, namespace: "LinksPage" });
  const detailT = await getTranslations({ locale, namespace: "LinkDetail" });
  const cardT = await getTranslations({ locale, namespace: "LinkCard" });
  const filterT = await getTranslations({ locale, namespace: "FilterBar" });
  const size = normalizeSize(resolvedSearchParams.size);
  const cursor = readFirstParam(resolvedSearchParams.cursor);
  const sourceCompanyUserId = readFirstParam(
    resolvedSearchParams.sourceCompanyUserId,
  );
  const sourceCompanyName = readFirstParam(resolvedSearchParams.sourceCompanyName);
  const tag = readFirstParam(resolvedSearchParams.tag);
  const dateRange = normalizeDateRange(resolvedSearchParams.period);
  const sortBy = normalizeSortOption(resolvedSearchParams.sort);
  const result = await fetchOpenLinks({
    cursor,
    size,
    sourceCompanyUserId,
    sourceCompanyName,
    tag,
    period: DATE_RANGE_TO_PERIOD[dateRange],
    sort: SORT_OPTION_TO_SORT[sortBy],
  });
  const activeSourceCompanyName = sourceCompanyUserId
    ? result.links.find(
        (link) => link.sourceCompanyUserId === sourceCompanyUserId,
      )?.sourceCompanyName
    : sourceCompanyName;
  const authorFilterLabel = activeSourceCompanyName ?? sourceCompanyName;
  const filterSourceCompanyUserId = sourceCompanyUserId;
  const filterSourceCompanyName = sourceCompanyUserId
    ? undefined
    : sourceCompanyName;
  const filterLabels = [
    tag ? `#${tag}` : null,
    sourceCompanyUserId || sourceCompanyName
      ? authorFilterLabel
        ? t("authorFilterActive", { name: authorFilterLabel })
        : t("authorFilterGeneric")
      : null,
  ].filter((label): label is string => Boolean(label));
  const baseFilterPathParams = {
    size,
    sourceCompanyUserId: filterSourceCompanyUserId,
    sourceCompanyName: filterSourceCompanyName,
    tag,
  };
  const dateOptions = DATE_RANGE_OPTIONS.map((value) => ({
    label: filterT(`date.${value}`),
    value,
    href: buildLinkListPath({
      ...baseFilterPathParams,
      dateRange: value,
      sortBy,
    }),
  }));
  const sortOptions = SORT_OPTIONS.map((value) => ({
    label: filterT(`sort.${value}`),
    value,
    href: buildLinkListPath({
      ...baseFilterPathParams,
      dateRange,
      sortBy: value,
    }),
  }));
  const countLabels = {
    views: cardT("views"),
    likes: cardT("likes"),
    saves: cardT("saves"),
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="mx-auto w-full max-w-[728px] px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 md:px-6 md:py-6">
        <section className="mb-5">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {t("title")}
          </h1>
          {filterLabels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {filterLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-muted px-2.5 py-1 text-sm font-semibold text-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <LinkFilterBar
          dateRange={dateRange}
          sortBy={sortBy}
          dateOptions={dateOptions}
          sortOptions={sortOptions}
        />

        <LinkList
          links={result.links}
          locale={locale}
          emptyMessage={t("empty")}
          summaryFallback={detailT("summaryFallback")}
          readLabel={cardT("read")}
          unreadLabel={cardT("unread")}
          countLabels={countLabels}
        />

        {result.hasNext && result.nextCursor ? (
          <div className="flex justify-center py-6">
            <Link
              href={buildLinkListPath({
                cursor: result.nextCursor,
                size: result.size,
                sourceCompanyUserId: filterSourceCompanyUserId,
                sourceCompanyName: filterSourceCompanyName,
                tag,
                dateRange,
                sortBy,
              })}
              className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-85"
            >
              {t("loadMore")}
            </Link>
          </div>
        ) : result.links.length > 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {t("reachedEnd")}
          </div>
        ) : null}
      </main>
    </div>
  );
}
