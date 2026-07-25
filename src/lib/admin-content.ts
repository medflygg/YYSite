import { and, asc, eq } from 'drizzle-orm';
import { getDb } from './db/client';
import { migrate } from './db/migrate';
import { projectImages, projects, sitePages } from './db/schema';
import type { ProjectDTO } from './content';
import { getProjectBySlug, listProjects } from './content';

export type ProjectInput = {
  slug: string;
  title: string;
  category: 'books' | 'magazines' | 'other';
  featured?: boolean;
  featuredOrder?: number | null;
  featuredLayout?: 'left' | 'right';
  portfolioOrder?: number;
  year?: number | null;
  client?: string | null;
  specs?: string | null;
  summary?: string;
  caption?: string | null;
  body?: string;
  cover?: string;
  cardImage?: string | null;
  awards?: { place?: string; text: string }[];
  behindTheScenes?: string[];
  whatHappenedNext?: string[];
  gallery?: string[];
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/[а-яё]/g, (ch) => {
      const map: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
        з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
        п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
        ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
      };
      return map[ch] ?? '';
    })
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export { slugify };

async function setGallery(projectId: number, gallery: string[]) {
  const db = getDb();
  await db.delete(projectImages).where(eq(projectImages.projectId, projectId));
  for (let i = 0; i < gallery.length; i++) {
    await db.insert(projectImages).values({
      projectId,
      path: gallery[i],
      sortOrder: i,
    });
  }
}

export async function createProject(input: ProjectInput) {
  await migrate();
  const db = getDb();
  const now = new Date();
  const slug = input.slug || slugify(input.title);
  const result = await db
    .insert(projects)
    .values({
      slug,
      title: input.title,
      category: input.category,
      featured: Boolean(input.featured),
      featuredOrder: input.featuredOrder ?? null,
      featuredLayout: input.featuredLayout || 'left',
      portfolioOrder: input.portfolioOrder ?? 0,
      year: input.year ?? null,
      client: input.client ?? null,
      specs: input.specs ?? null,
      summary: input.summary || '',
      caption: input.caption ?? null,
      body: input.body || '',
      cover: input.cover || '',
      cardImage: input.cardImage ?? null,
      awards: input.awards || [],
      behindTheScenes: input.behindTheScenes || [],
      whatHappenedNext: input.whatHappenedNext || [],
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const row = result[0];
  if (input.gallery?.length) {
    await setGallery(row.id, input.gallery);
  }
  return getProjectBySlug(row.slug);
}

export async function updateProject(id: number, input: Partial<ProjectInput>) {
  await migrate();
  const db = getDb();
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  const map: [keyof ProjectInput, string][] = [
    ['slug', 'slug'],
    ['title', 'title'],
    ['category', 'category'],
    ['featured', 'featured'],
    ['featuredOrder', 'featuredOrder'],
    ['featuredLayout', 'featuredLayout'],
    ['portfolioOrder', 'portfolioOrder'],
    ['year', 'year'],
    ['client', 'client'],
    ['specs', 'specs'],
    ['summary', 'summary'],
    ['caption', 'caption'],
    ['body', 'body'],
    ['cover', 'cover'],
    ['cardImage', 'cardImage'],
    ['awards', 'awards'],
    ['behindTheScenes', 'behindTheScenes'],
    ['whatHappenedNext', 'whatHappenedNext'],
  ];
  for (const [from, to] of map) {
    if (from in input) patch[to] = input[from];
  }

  const result = await db
    .update(projects)
    .set(patch)
    .where(eq(projects.id, id))
    .returning();
  const row = result[0];
  if (!row) return null;
  if (input.gallery) {
    await setGallery(id, input.gallery);
  }
  return getProjectBySlug(row.slug);
}

export async function deleteProject(id: number) {
  await migrate();
  const db = getDb();
  await db.delete(projects).where(eq(projects.id, id));
}

export async function reorderFeatured(orderedIds: number[]) {
  await migrate();
  const db = getDb();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(projects)
      .set({
        featured: true,
        featuredOrder: i + 1,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, orderedIds[i]));
  }
}

export async function reorderPortfolio(
  category: 'books' | 'magazines' | 'other',
  orderedIds: number[],
) {
  await migrate();
  const db = getDb();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(projects)
      .set({
        category,
        portfolioOrder: i,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, orderedIds[i])));
  }
}

export async function upsertSitePage(key: string, title: string, body: string) {
  await migrate();
  const db = getDb();
  const now = new Date();
  await db
    .insert(sitePages)
    .values({ key, title, body, updatedAt: now })
    .onConflictDoUpdate({
      target: sitePages.key,
      set: { title, body, updatedAt: now },
    });
}

export async function getProjectById(id: number): Promise<ProjectDTO | null> {
  const all = await listProjects();
  return all.find((p) => p.id === id) ?? null;
}

export async function listShowcase() {
  const all = await listProjects();
  return {
    featured: all
      .filter((p) => p.featured)
      .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99)),
    books: all
      .filter((p) => p.category === 'books')
      .sort((a, b) => a.portfolioOrder - b.portfolioOrder),
    magazines: all
      .filter((p) => p.category === 'magazines')
      .sort((a, b) => a.portfolioOrder - b.portfolioOrder),
    other: all
      .filter((p) => p.category === 'other')
      .sort((a, b) => a.portfolioOrder - b.portfolioOrder),
  };
}
