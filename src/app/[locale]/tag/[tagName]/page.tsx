import { redirect } from "@/i18n/navigation";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LocaleTagPageProps = {
  params: {
    locale: string;
    tagName: string;
  };
  searchParams?: {
    id?: string;
    tagIds?: string | string[];
  };
};

function normalizeTagIds(searchParams?: LocaleTagPageProps["searchParams"]): string[] {
  const tagIds = searchParams?.tagIds;
  const source =
    typeof tagIds === "string"
      ? [tagIds]
      : Array.isArray(tagIds)
        ? tagIds
        : searchParams?.id
          ? [searchParams.id]
          : [];

  const deduped = new Set(
    source.map((tagId) => tagId.trim().toLowerCase()).filter((tagId) => UUID_PATTERN.test(tagId)),
  );

  return Array.from(deduped);
}

export default function LocaleTagPage({ params, searchParams }: LocaleTagPageProps) {
  const tagIds = normalizeTagIds(searchParams);
  const query = new URLSearchParams();
  query.set("mode", "user");
  tagIds.forEach((tagId) => query.append("tagIds", tagId));

  redirect(`/${params.locale}?${query.toString()}`);
}
