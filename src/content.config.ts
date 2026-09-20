import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const about = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/about' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const platformStatus = z.enum(['released', 'in-review', 'in-development']);

const apps = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/apps',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    icon: z.string().optional(),
    summary: z.string(),
    platforms: z.object({
      iphone: platformStatus.optional(),
      ipad: platformStatus.optional(),
      mac: platformStatus.optional(),
      android: platformStatus.optional(),
    }).default({}),
    order: z.number().default(0),
    appStoreUrl: z.string().optional(),
    /** 상세 페이지를 아직 안 쓴 앱 — 본문 대신 "준비 중" 안내만 나온다. */
    comingSoon: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** 어느 앱을 만들다 나온 글인지 — `src/lib/blog-apps.ts` 의 키. 앱과 무관한 글(소식)은 비운다. */
    app: z.string().optional(),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    thumbnail: z.string().optional(),
  }),
});

export const collections = { about, apps, blog };
