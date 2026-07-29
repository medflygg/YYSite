import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category', { enum: ['books', 'magazines', 'other'] }).notNull(),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  featuredOrder: integer('featured_order'),
  featuredLayout: text('featured_layout', { enum: ['left', 'right'] })
    .notNull()
    .default('left'),
  /** Hidden from public portfolio / home; still editable in admin. */
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  portfolioOrder: integer('portfolio_order').notNull().default(0),
  year: integer('year'),
  client: text('client'),
  specs: text('specs'),
  summary: text('summary').notNull().default(''),
  caption: text('caption'),
  body: text('body').notNull().default(''),
  cover: text('cover').notNull().default(''),
  cardImage: text('card_image'),
  /** Thumbnail on /portfolio grid (falls back to cover if empty). */
  portfolioCover: text('portfolio_cover'),
  awards: text('awards', { mode: 'json' })
    .$type<{ place?: string; text: string }[]>()
    .notNull()
    .default([]),
  behindTheScenes: text('behind_the_scenes', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  whatHappenedNext: text('what_happened_next', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectImages = sqliteTable('project_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const sitePages = sqliteTable('site_pages', {
  key: text('key').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const aboutCards = sqliteTable('about_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  num: text('num').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  bg: text('bg').notNull().default('bg-yy-yellow'),
  text: text('text').notNull().default('text-black'),
  className: text('class_name').notNull().default('left-[30%] top-[30%]'),
  z: integer('z').notNull().default(1),
  rotate: text('rotate'),
  hasCta: integer('has_cta', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectImage = typeof projectImages.$inferSelect;
export type SitePage = typeof sitePages.$inferSelect;
export type AboutCard = typeof aboutCards.$inferSelect;
