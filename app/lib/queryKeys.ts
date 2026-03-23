export const queryKeys = {
  user: {
    all: ["user"] as const,
    me: () => [...queryKeys.user.all, "me"] as const,
    bans: () => [...queryKeys.user.all, "bans"] as const,
    followCounts: (userId: string) => [...queryKeys.user.all, "follow-counts", userId] as const,
    followers: (userId: string) => [...queryKeys.user.all, "followers", userId] as const,
    followings: (userId: string) => [...queryKeys.user.all, "followings", userId] as const,
  },
  posts: {
    all: ["posts"] as const,
    communityList: (params: {
      period: string;
      sort: string;
      size: number;
      authorId?: string;
      categoryPath?: string;
      tagIds?: string[];
    }) => [...queryKeys.posts.all, "community", params] as const,
    userCommunityList: (params: {
      userId: string;
      period: string;
      sort: string;
      size: number;
      categoryId?: string;
      includePrivatePosts?: boolean;
    }) => [...queryKeys.posts.all, "user-community", params] as const,
    userCommunityListByCategoryIds: (params: {
      userId: string;
      period: string;
      sort: string;
      size: number;
      categoryIds: string[];
      path?: string;
      includePrivatePosts?: boolean;
    }) => [...queryKeys.posts.all, "user-community-category", params] as const,
    userCategories: (params: { userId: string; path?: string }) =>
      [...queryKeys.posts.all, "user-categories", params] as const,
    draftsList: (params: { size: number }) =>
      [...queryKeys.posts.all, "drafts", params] as const,
    detail: (postId: string) => [...queryKeys.posts.all, "detail", postId] as const,
    draftDetail: (postId: string) =>
      [...queryKeys.posts.all, "draft-detail", postId] as const,
  },
  comments: {
    all: ["comments"] as const,
    list: (params: { postId: string; sort: string; size: number }) =>
      [...queryKeys.comments.all, params] as const,
    replies: (params: { commentId: string; sort: string; size: number }) =>
      [...queryKeys.comments.all, "replies", params] as const,
  },
  tags: {
    all: ["tags"] as const,
    list: (scope = "default") => [...queryKeys.tags.all, "list", scope] as const,
    byIds: (ids: string[]) => [...queryKeys.tags.all, "by-ids", ids] as const,
  },
  techBlogs: {
    all: ["techBlogs"] as const,
    list: (signature?: string) =>
      [...queryKeys.techBlogs.all, "list", signature ?? "default"] as const,
  },
};
