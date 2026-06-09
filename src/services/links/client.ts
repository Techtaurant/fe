"use client";

import { httpClient } from "../../utils/httpClient";
import { isLinkLikeStatus } from "./types";
import type {
  LinkLikeStatus,
  LinkMutationResponse,
  LinkReactionState,
  OpenLinkDetailResponse,
} from "./types";

function normalizeCount(value?: number | null): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function encodeLinkIdPathSegment(linkId: string): string {
  return encodeURIComponent(linkId);
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

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json().catch(() => ({
    status: response.status,
  }))) as LinkMutationResponse;
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

  return (await response.json().catch(() => ({
    status: response.status,
  }))) as LinkMutationResponse;
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
