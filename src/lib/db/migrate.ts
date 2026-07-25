import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_URL = 'file:./data/yysite.db';

function resolveDbUrl() {
  const raw = process.env.DATABASE_URL || DEFAULT_URL;
  if (!raw.startsWith('file:')) return raw;
  const filePath = raw.slice('file:'.length);
  const abs = resolve(process.cwd(), filePath);
  mkdirSync(dirname(abs), { recursive: true });
  return `file:${abs}`;
}

/** Idempotent schema bootstrap (no drizzle-kit required at runtime). */
export async function migrate() {
  const client = createClient({ url: resolveDbUrl() });
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
  client.close();
}
