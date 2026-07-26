import { asc, desc, eq } from 'drizzle-orm';
import { marked } from 'marked';
import { getDb } from './db/client';
import { migrate } from './db/migrate';
import { projectImages, projects, sitePages, type Project } from './db/schema';
import { typografHtml } from './typograf';

let migrated = false;

async function ensureDb() {
  if (!migrated) {
    await migrate();
    migrated = true;
  }
  return getDb();
}

export type ProjectDTO = Project & { gallery: string[] };

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

async function withGallery(row: Project): Promise<ProjectDTO> {
  const db = await ensureDb();
  const images = await db
    .select()
    .from(projectImages)
    .where(eq(projectImages.projectId, row.id))
    .orderBy(asc(projectImages.sortOrder));

  return {
    ...row,
    awards: parseJsonArray(row.awards, []),
    behindTheScenes: parseJsonArray(row.behindTheScenes, []),
    whatHappenedNext: parseJsonArray(row.whatHappenedNext, []),
    gallery: images.map((img) => img.path),
  };
}

export async function listProjects() {
  const db = await ensureDb();
  const rows = await db.select().from(projects).orderBy(asc(projects.title));
  return Promise.all(rows.map(withGallery));
}

export async function listFeaturedProjects() {
  const db = await ensureDb();
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.featured, true))
    .orderBy(asc(projects.featuredOrder));
  return Promise.all(rows.map(withGallery));
}

export async function listProjectsByCategory(
  category: 'books' | 'magazines' | 'other',
) {
  const db = await ensureDb();
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.category, category))
    .orderBy(asc(projects.portfolioOrder), asc(projects.title));
  return Promise.all(rows.map(withGallery));
}

export async function getProjectBySlug(slug: string) {
  const db = await ensureDb();
  const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  if (!rows[0]) return null;
  return withGallery(rows[0]);
}

export async function getSitePage(key: string) {
  const db = await ensureDb();
  const rows = await db.select().from(sitePages).where(eq(sitePages.key, key)).limit(1);
  return rows[0] ?? null;
}

export function renderMarkdown(md: string) {
  const html = marked.parse(md || '', { async: false }) as string;
  return typografHtml(html);
}
