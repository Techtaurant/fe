import { getTranslations } from "next-intl/server";
import Header from "../components/Header";
import LinkList from "../components/links/LinkList";
import { Link } from "../i18n/navigation";
import { fetchOpenLinks } from "../services/links/server";

type SearchParamValue = string | string[] | undefined;

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

function buildNextPagePath(params: {
    cursor: string;
    size: number;
    sourceCompanyUserId?: string;
    tag?: string;
  }): string {
  const searchParams = new URLSearchParams();
  searchParams.set("cursor", params.cursor);
  searchParams.set("size", String(params.size));
  if (params.sourceCompanyUserId) {
    searchParams.set("sourceCompanyUserId", params.sourceCompanyUserId);
  }
  if (params.tag) searchParams.set("tag", params.tag);

  return `/links?${searchParams.toString()}`;
}

export default async function LinkListPage({
  params,
  searchParams,
}: LinkListPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const t = await getTranslations({ locale, namespace: "LinksPage" });
  const size = normalizeSize(resolvedSearchParams.size);
  const cursor = readFirstParam(resolvedSearchParams.cursor);
  const sourceCompanyUserId = readFirstParam(
    resolvedSearchParams.sourceCompanyUserId,
  );
  const tag = readFirstParam(resolvedSearchParams.tag);
  const result = await fetchOpenLinks({
    cursor,
    size,
    sourceCompanyUserId,
    tag,
  });
  const filterLabel = tag
    ? `#${tag}`
    : sourceCompanyUserId
      ? sourceCompanyUserId
      : "";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="mx-auto w-full max-w-[728px] px-4 py-6 md:px-6">
        <section className="mb-5">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {t("title")}
          </h1>
          {filterLabel ? (
            <p className="mt-2 text-sm font-semibold text-foreground">
              {filterLabel}
            </p>
          ) : null}
        </section>

        <LinkList
          links={result.links}
          locale={locale}
          emptyMessage={t("empty")}
        />

        {result.hasNext && result.nextCursor ? (
          <div className="flex justify-center py-6">
            <Link
              href={buildNextPagePath({
                cursor: result.nextCursor,
                size: result.size,
                sourceCompanyUserId,
                tag,
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
