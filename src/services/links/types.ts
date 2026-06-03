export type LinkLikeStatus = "LIKE" | "DISLIKE" | "NONE";

export interface LinkTag {
  id: string;
  name: string;
}

export interface LinkContent {
  id: string;
  title: string;
  url: string;
  summary?: string;
  sourceCompanyUserId?: string;
  publishedAt?: string;
  tags: LinkTag[];
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  likeCount?: number;
}

export interface OpenLinkListResponse {
  status: number;
  data: {
    content: OpenLinkItem[];
    nextCursor?: string | null;
    hasNext?: boolean;
    size?: number;
  };
  message?: string;
}

export interface OpenLinkDetailResponse {
  status: number;
  data: OpenLinkItem;
  message?: string;
}

export interface LinkListResult {
  links: LinkContent[];
  nextCursor?: string;
  hasNext: boolean;
  size: number;
}

export interface FetchOpenLinksParams {
  cursor?: string;
  size?: number;
  sourceCompanyUserId?: string;
  tag?: string;
}

export interface LinkMutationResponse {
  status: number;
  message?: string;
}

export interface OpenLinkItem {
  id?: string;
  linkId?: string;
  title?: string;
  url?: string;
  summary?: string | null;
  sourceCompanyUserId?: string | number | null;
  publishedAt?: string | null;
  tags?: Array<LinkTag | string> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  viewCount?: number | null;
  likeCount?: number | null;
}
