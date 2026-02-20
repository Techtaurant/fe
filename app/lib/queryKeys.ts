export const queryKeys = {
  user: {
    all: ["user"] as const,
    me: () => [...queryKeys.user.all, "me"] as const,
  },
  posts: {
    all: ["posts"] as const,
    communityList: (params: { period: string; sort: string; size: number }) =>
      [...queryKeys.posts.all, "community", params] as const,
    detail: (postId: string) => [...queryKeys.posts.all, "detail", postId] as const,
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
    list: () => [...queryKeys.techBlogs.all, "list"] as const,
  },
};
