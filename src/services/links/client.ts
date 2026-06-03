"use client";

import { httpClient } from "../../utils/httpClient";
import { LinkLikeStatus, LinkMutationResponse } from "./types";

export async function createLinkViewLog(
  linkId: string,
): Promise<LinkMutationResponse> {
  const response = await httpClient(`/open-api/links/${linkId}/view-logs`, {
    method: "POST",
  });

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
  const response = await httpClient(`/api/links/${linkId}/like`, {
    method: "POST",
    body: JSON.stringify({ likeStatus }),
  });

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
