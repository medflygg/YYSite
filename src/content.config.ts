import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['books', 'magazines', 'other']),
    featured: z.boolean().default(false),
    featuredOrder: z.number().optional(),
    featuredLayout: z.enum(['left', 'right']).default('left'),
    year: z.number().optional(),
    client: z.string().optional(),
    specs: z.string().optional(),
    cover: z.string(),
    cardImage: z.string().optional(),
    portfolioCover: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    summary: z.string(),
    caption: z.string().optional(),
    awards: z
      .array(
        z.object({
          place: z.string().optional(),
          text: z.string(),
        }),
      )
      .default([]),
    behindTheScenes: z.array(z.string()).default([]),
    whatHappenedNext: z.array(z.string()).default([]),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { projects, site };
