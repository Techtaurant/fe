"use client";

import { httpClient } from "../../utils/httpClient";
import { isLinkLikeStatus } from "./types";
import type {
  CompanyLinkListResponse,
  LinkLikeStatus,
  LinkListResult,
  LinkMutationResponse,
  LinkReactionState,
  LinkViewerState,
  LinkViewerStateListResponse,
  OpenLinkDetailResponse,
} from "./types";

function normalizeCount(value?: number | null): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function encodeLinkIdPathSegment(linkId: string): string {
  return encodeURIComponent(linkId);
}

function encodeQueryValue(value: string): string {
  return encodeURIComponent(value);
}

async function readMutationResponse(
  response: Response,
): Promise<LinkMutationResponse> {
  if (response.status === 204) {
    return { status: response.status };
  }

  return (await response.json().catch(() => ({
    status: response.status,
  }))) as LinkMutationResponse;
}

function assertLinkApiResponse(response: Response): void {
  if (response.status === 400) {
    throw new Error("BAD_REQUEST");
  }

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 403) {
    throw new Error("FORBIDDEN");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }
}

export async function createLinkViewLog(
  linkId: string,
): Promise<LinkMutationResponse> {
  const response = await httpClient(
    `/open-api/links/${encodeLinkIdPathSegment(linkId)}/view-logs`,
    {
      method: "POST",
    },
  );

  assertLinkApiResponse(response);

  return readMutationResponse(response);
}

export async function setLinkLike(
  linkId: string,
  likeStatus: LinkLikeStatus,
): Promise<LinkMutationResponse> {
  const response = await httpClient(
    `/api/links/${encodeLinkIdPathSegment(linkId)}/like`,
    {
      method: "POST",
      body: JSON.stringify({ likeStatus }),
    },
  );

  assertLinkApiResponse(response);

  return readMutationResponse(response);
}

export async function fetchLinkReactionState(
  linkId: string,
): Promise<LinkReactionState> {
  const response = await httpClient(
    `/open-api/links/${encodeLinkIdPathSegment(linkId)}`,
    {
      method: "GET",
    },
  );

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  const result = (await response.json()) as OpenLinkDetailResponse;
  const likeStatus = isLinkLikeStatus(result.data.likeStatus)
    ? result.data.likeStatus
    : "NONE";

  return {
    likeStatus,
    likeCount: normalizeCount(result.data.likeCount),
  };
}

export async function saveLink(linkId: string): Promise<LinkMutationResponse> {
  const response = await httpClient(
    `/api/links/${encodeLinkIdPathSegment(linkId)}/save`,
    {
      method: "POST",
    },
  );

  assertLinkApiResponse(response);

  return readMutationResponse(response);
}

export async function unsaveLink(linkId: string): Promise<LinkMutationResponse> {
  const response = await httpClient(
    `/api/links/${encodeLinkIdPathSegment(linkId)}/save`,
    {
      method: "DELETE",
    },
  );

  assertLinkApiResponse(response);

  return readMutationResponse(response);
}

export async function setLinkReadLog(
  linkId: string,
  isRead: boolean,
): Promise<LinkMutationResponse> {
  const response = await httpClient(
    `/api/links/${encodeLinkIdPathSegment(linkId)}/read-logs`,
    {
      method: "POST",
      body: JSON.stringify({ isRead }),
    },
  );

  assertLinkApiResponse(response);

  return readMutationResponse(response);
}

export async function fetchLinkViewerStates(
  linkIds: string[],
): Promise<LinkViewerState[]> {
  const uniqueLinkIds = Array.from(new Set(linkIds.filter(Boolean))).slice(0, 100);
  if (uniqueLinkIds.length === 0) return [];

  const searchParams = new URLSearchParams();
  uniqueLinkIds.forEach((linkId) => {
    searchParams.append("linkIds", linkId);
  });

  const response = await httpClient(
    `/api/links/me/states?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  assertLinkApiResponse(response);

  const result = (await response.json()) as LinkViewerStateListResponse;
  return Array.isArray(result.data) ? result.data : [];
}

export async function fetchCompanyLinks(params: {
  companyUserId: string;
  cursor?: string;
  size?: number;
  tag?: string;
}): Promise<LinkListResult> {
  const searchParams = new URLSearchParams();
  if (params.cursor) searchParams.set("cursor", params.cursor);
  searchParams.set("size", String(params.size ?? 20));
  if (params.tag) searchParams.set("tag", params.tag);

  const response = await httpClient(
    `/api/companies/${encodeQueryValue(params.companyUserId)}/links?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  assertLinkApiResponse(response);

  const result = (await response.json()) as CompanyLinkListResponse;
  const content = result.data.content ?? [];
  const nextCursor = result.data.nextCursor ?? undefined;

  return {
    links: content
      .map((item) => ({
        id: String(item.id ?? item.linkId ?? ""),
        title: String(item.title ?? ""),
        url: String(item.url ?? ""),
        summary: typeof item.summary === "string" ? item.summary : undefined,
        sourceCompanyUserId:
          item.sourceCompanyUserId === null || item.sourceCompanyUserId === undefined
            ? undefined
            : String(item.sourceCompanyUserId),
        publishedAt:
          typeof item.publishedAt === "string" ? item.publishedAt : undefined,
        tags: Array.isArray(item.tags)
          ? item.tags
              .map((tag) => {
                if (typeof tag === "string") return { id: tag, name: tag };
                return tag.name ? { id: tag.id ?? tag.name, name: tag.name } : null;
              })
              .filter((tag): tag is { id: string; name: string } => Boolean(tag))
          : [],
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : typeof item.updatedAt === "string"
              ? item.updatedAt
              : "",
        updatedAt:
          typeof item.updatedAt === "string" ? item.updatedAt : undefined,
        viewCount: normalizeCount(item.viewCount),
        likeCount: normalizeCount(item.likeCount),
        likeStatus: isLinkLikeStatus(item.likeStatus) ? item.likeStatus : undefined,
        isSaved: typeof item.isSaved === "boolean" ? item.isSaved : undefined,
        isRead: typeof item.isRead === "boolean" ? item.isRead : undefined,
      }))
      .filter((link) => link.id && link.url),
    nextCursor,
    hasNext: result.data.hasNext ?? Boolean(nextCursor),
    size: result.data.size ?? params.size ?? 20,
  };
}
