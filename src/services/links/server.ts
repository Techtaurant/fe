import {
  FetchOpenLinksParams,
  LinkContent,
  LinkListResult,
  LinkTag,
  OpenLinkDetailResponse,
  OpenLinkItem,
  OpenLinkListResponse,
} from "./types";

export const LINK_CONTENT_REVALIDATE_SECONDS = 300;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function buildApiUrl(path: string, params?: URLSearchParams): string {
  const url = new URL(path, API_BASE_URL);
  params?.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

function normalizeString(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

function normalizeTags(tags?: Array<LinkTag | string> | null): LinkTag[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (typeof tag === "string") {
        const name = tag.trim();
        return name ? { id: name, name } : null;
      }

      const name = normalizeString(tag.name);
      if (!name) return null;
      return {
        id: normalizeString(tag.id) ?? name,
        name,
      };
    })
    .filter((tag): tag is LinkTag => Boolean(tag));
}

function normalizeCount(value?: number | null): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function normalizeLinkContent(item: OpenLinkItem): LinkContent {
  const id = normalizeString(item.id) ?? normalizeString(item.linkId) ?? "";
  const title = normalizeString(item.title) ?? "Untitled link";
  const url = normalizeString(item.url) ?? "";
  const createdAt =
    normalizeString(item.createdAt) ??
    normalizeString(item.publishedAt) ??
    normalizeString(item.updatedAt) ??
    "";

  return {
    id,
    title,
    url,
    summary: normalizeString(item.summary),
    sourceCompanyUserId: normalizeString(item.sourceCompanyUserId),
    publishedAt: normalizeString(item.publishedAt),
    tags: normalizeTags(item.tags),
    createdAt,
    updatedAt: normalizeString(item.updatedAt),
    viewCount: normalizeCount(item.viewCount),
    likeCount: normalizeCount(item.likeCount),
  };
}

async function fetchOpenApi<T>(path: string, params?: URLSearchParams): Promise<T> {
  const response = await fetch(buildApiUrl(path, params), {
    method: "GET",
    next: { revalidate: LINK_CONTENT_REVALIDATE_SECONDS },
  });

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchOpenLinks(
  params: FetchOpenLinksParams = {},
): Promise<LinkListResult> {
  const searchParams = new URLSearchParams();
  if (params.cursor) searchParams.set("cursor", params.cursor);
  searchParams.set("size", String(params.size ?? 20));
  if (params.sourceCompanyUserId) {
    searchParams.set("sourceCompanyUserId", params.sourceCompanyUserId);
  }
  if (params.tag) searchParams.set("tag", params.tag);

  const result = await fetchOpenApi<OpenLinkListResponse>("/open-api/links", searchParams);

  return {
    links: result.data.content.map(normalizeLinkContent).filter((link) => link.id && link.url),
    nextCursor: result.data.nextCursor ?? undefined,
    hasNext: Boolean(result.data.hasNext),
    size: result.data.size ?? params.size ?? 20,
  };
}

export async function fetchOpenLinkDetail(linkId: string): Promise<LinkContent> {
  const result = await fetchOpenApi<OpenLinkDetailResponse>(
    `/open-api/links/${encodeURIComponent(linkId)}`,
  );
  const link = normalizeLinkContent(result.data);

  if (!link.id || !link.url) {
    throw new Error("INVALID_LINK_RESPONSE");
  }

  return link;
}
