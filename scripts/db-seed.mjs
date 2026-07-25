#!/usr/bin/env node
import { createClient } from '@libsql/client';
import {
  readdirSync,
  readFileSync,
  mkdirSync,
  existsSync,
  cpSync,
  statSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dbPath = resolve(root, 'data', 'yysite.db');
mkdirSync(dirname(dbPath), { recursive: true });

const client = createClient({ url: `file:${dbPath}` });

async function migrate() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      featured_order INTEGER,
      featured_layout TEXT NOT NULL DEFAULT 'left',
      portfolio_order INTEGER NOT NULL DEFAULT 0,
      year INTEGER,
      client TEXT,
      specs TEXT,
      summary TEXT NOT NULL DEFAULT '',
      caption TEXT,
      body TEXT NOT NULL DEFAULT '',
      cover TEXT NOT NULL DEFAULT '',
      card_image TEXT,
      awards TEXT NOT NULL DEFAULT '[]',
      behind_the_scenes TEXT NOT NULL DEFAULT '[]',
      what_happened_next TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS site_pages (
      key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    );
  `);
}

function toUploadsPath(path) {
  if (typeof path !== 'string') return path;
  if (path.startsWith('/projects/')) return path.replace('/projects/', '/uploads/');
  return path;
}

/** Copy seed assets public/projects/<slug>/* → public/uploads/<slug>/ */
function syncSeedImages() {
  const projectsRoot = join(root, 'public', 'projects');
  const uploadsRoot = join(root, 'public', 'uploads');
  mkdirSync(uploadsRoot, { recursive: true });
  if (!existsSync(projectsRoot)) return 0;
  let copied = 0;
  for (const slug of readdirSync(projectsRoot)) {
    const fromDir = join(projectsRoot, slug);
    if (!statSync(fromDir).isDirectory()) continue;
    const toDir = join(uploadsRoot, slug);
    mkdirSync(toDir, { recursive: true });
    for (const name of readdirSync(fromDir)) {
      const from = join(fromDir, name);
      if (!statSync(from).isFile()) continue;
      const to = join(toDir, name);
      cpSync(from, to);
      copied++;
    }
  }
  console.log(`synced ${copied} seed images → public/uploads/`);
  return copied;
}

async function seed() {
  await migrate();
  syncSeedImages();
  const now = Date.now();

  await client.execute('DELETE FROM project_images');
  await client.execute('DELETE FROM projects');
  await client.execute('DELETE FROM site_pages');

  const projectsDir = join(root, 'src/content/projects');
  const files = readdirSync(projectsDir).filter((f) => f.endsWith('.md'));
  const byCategory = { books: 0, magazines: 0, other: 0 };

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const raw = readFileSync(join(projectsDir, file), 'utf8');
    const { data, content } = matter(raw);
    const category = data.category || 'other';
    const portfolioOrder = byCategory[category] ?? 0;
    byCategory[category] = portfolioOrder + 1;

    const result = await client.execute({
      sql: `INSERT INTO projects (
        slug, title, category, featured, featured_order, featured_layout, portfolio_order,
        year, client, specs, summary, caption, body, cover, card_image,
        awards, behind_the_scenes, what_happened_next, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        slug,
        data.title,
        category,
        data.featured ? 1 : 0,
        data.featuredOrder ?? null,
        data.featuredLayout || 'left',
        portfolioOrder,
        data.year ?? null,
        data.client ?? null,
        data.specs ?? null,
        data.summary || '',
        data.caption ?? null,
        content.trim(),
        toUploadsPath(data.cover || ''),
        toUploadsPath(data.cardImage ?? null),
        JSON.stringify(data.awards || []),
        JSON.stringify(data.behindTheScenes || []),
        JSON.stringify(data.whatHappenedNext || []),
        now,
        now,
      ],
    });

    const projectId = Number(result.lastInsertRowid);
    const gallery = Array.isArray(data.gallery) ? data.gallery : [];
    for (let i = 0; i < gallery.length; i++) {
      await client.execute({
        sql: 'INSERT INTO project_images (project_id, path, sort_order) VALUES (?, ?, ?)',
        args: [projectId, toUploadsPath(gallery[i]), i],
      });
    }
    console.log(`seeded project: ${slug}`);
  }

  const siteDir = join(root, 'src/content/site');
  for (const key of ['about', 'contacts']) {
    const file = join(siteDir, `${key}.md`);
    if (!existsSync(file)) continue;
    const { data, content } = matter(readFileSync(file, 'utf8'));
    await client.execute({
      sql: 'INSERT INTO site_pages (key, title, body, updated_at) VALUES (?, ?, ?, ?)',
      args: [key, data.title || key, content.trim(), now],
    });
    console.log(`seeded page: ${key}`);
  }

  console.log(`Done. DB: ${dbPath}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
