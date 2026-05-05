'use client';

import { z } from 'zod';

export const techBlogSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconUrl: z.string(),
});

export const techBlogCacheSchema = z.object({
  techBlogs: z.array(techBlogSchema),
  cachedAt: z.number(),
});

export type TechBlogCachePayload = z.infer<typeof techBlogCacheSchema>;

export const parseTechBlogCache = (raw: string): TechBlogCachePayload | null => {
  try {
    return techBlogCacheSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
};
