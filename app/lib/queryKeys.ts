export const queryKeys = {
  user: {
    all: ["user"] as const,
    me: () => [...queryKeys.user.all, "me"] as const,
  },
  posts: {
    all: ["posts"] as const,
    communityList: (params: {
      period: string;
      sort: string;
      size: number;
      authorId?: string;
      categoryPath?: string;
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
    userCategoryPostCounts: (params: { userId: string; includePrivatePosts?: boolean }) =>
      [...queryKeys.posts.all, "user-category-post-counts", params] as const,
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
  },
  tags: {
    all: ["tags"] as const,
    list: () => [...queryKeys.tags.all, "list"] as const,
  },
  techBlogs: {
    all: ["techBlogs"] as const,
    list: (signature?: string) =>
      [...queryKeys.techBlogs.all, "list", signature ?? "default"] as const,
  },
};
