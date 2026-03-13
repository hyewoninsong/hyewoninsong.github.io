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

const apps = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/apps',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    status: z.string(),
    icon: z.string().optional(),
    summary: z.string(),
    platform: z.array(z.enum(['iOS', 'Android'])).default(['iOS']),
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

export const collections = { about, apps, blog };
