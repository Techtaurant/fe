import {
  fetchUserFollowCountsRequest,
  fetchUserFollowersRequest,
  fetchUserFollowingsRequest,
  followUserRequest,
  unfollowUserRequest,
} from "./client";
import {
  FollowCountsResponse,
  FollowUserResponse,
  FollowUsersListResponse,
} from "./types";

export async function followUser(targetUserId: string): Promise<FollowUserResponse> {
  return followUserRequest(targetUserId);
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  return unfollowUserRequest(targetUserId);
}

export async function fetchUserFollowCounts(userId: string): Promise<FollowCountsResponse> {
  return fetchUserFollowCountsRequest(userId);
}

export async function fetchUserFollowers(userId: string): Promise<FollowUsersListResponse> {
  return fetchUserFollowersRequest(userId);
}

export async function fetchUserFollowings(userId: string): Promise<FollowUsersListResponse> {
  return fetchUserFollowingsRequest(userId);
}

export * from "./types";
export * from "./apiError";
