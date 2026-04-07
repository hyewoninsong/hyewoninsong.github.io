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

const platformStatus = z.enum(['released', 'in-development']);

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
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    thumbnail: z.string().optional(),
  }),
});

const reports = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/reports',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    project: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    commits: z.number().default(0),
    docsUpdated: z.number().default(0),
    specsUpdated: z.number().default(0),
    testsUpdated: z.number().default(0),
  }),
});

export const collections = { about, apps, blog, reports };
