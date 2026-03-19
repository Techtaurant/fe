import { banUserRequest, fetchMyBansRequest, unbanUserRequest } from "./client";
import { BanUserResponse, FetchMyBansResponse } from "./types";

export async function banUser(targetUserId: string): Promise<BanUserResponse> {
  return banUserRequest(targetUserId);
}

export async function fetchMyBans(): Promise<FetchMyBansResponse> {
  return fetchMyBansRequest();
}

export async function unbanUser(targetUserId: string): Promise<void> {
  return unbanUserRequest(targetUserId);
}

export * from "./types";
export * from "./apiError";
