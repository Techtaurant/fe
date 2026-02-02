'use client';

import { z } from 'zod';

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const tagCacheSchema = z.object({
  tags: z.array(tagSchema),
  cachedAt: z.number(),
});

export type TagCachePayload = z.infer<typeof tagCacheSchema>;
