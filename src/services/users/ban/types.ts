export interface BannedUser {
  userId: string;
  name: string;
  bannedAt: string;
  profileImageUrl?: string | null;
}

export interface BanUserResponse {
  status: number | Record<string, unknown>;
  data: {
    userId: string;
    name: string;
    bannedAt: string;
  } | null;
  message: string;
}

export interface FetchMyBansResponse {
  status: number | Record<string, unknown>;
  data: Array<{
    userId: string;
    name: string;
    profileImageUrl: string | null;
    bannedAt: string;
  }>;
  message: string;
}
