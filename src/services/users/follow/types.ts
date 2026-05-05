export interface FollowUserItem {
  userId: string;
  name: string;
  profileImageUrl?: string | null;
  followedAt?: string;
}

export interface FollowCountsResponse {
  status: number | Record<string, unknown>;
  data: {
    followerCount: number;
    followingCount: number;
  };
  message: string;
}

export interface FollowUserResponse {
  status: number | Record<string, unknown>;
  data: {
    userId: string;
    name: string;
    followedAt: string;
  } | null;
  message: string;
}

export interface FollowUsersListResponse {
  status: number | Record<string, unknown>;
  data: FollowUserItem[];
  message: string;
}
