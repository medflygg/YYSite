#!/usr/bin/env node
/**
 * Move public/projects/<slug>/* → public/uploads/<slug>/
 * and rewrite paths in SQLite.
 */
import { createClient } from '@libsql/client';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  cpSync,
  unlinkSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const projectsRoot = join(root, 'public', 'projects');
const uploadsRoot = join(root, 'public', 'uploads');
const dbPath = resolve(root, 'data', 'yysite.db');

mkdirSync(uploadsRoot, { recursive: true });

const remap = {};
let moved = 0;

if (existsSync(projectsRoot)) {
  for (const slug of readdirSync(projectsRoot)) {
    const fromDir = join(projectsRoot, slug);
    if (!statSync(fromDir).isDirectory()) continue;
    const toDir = join(uploadsRoot, slug);
    mkdirSync(toDir, { recursive: true });

    for (const name of readdirSync(fromDir)) {
      const from = join(fromDir, name);
      if (!statSync(from).isFile()) continue;
      const to = join(toDir, name);
      if (!existsSync(to)) {
        try {
          renameSync(from, to);
        } catch {
          cpSync(from, to);
          unlinkSync(from);
        }
        moved++;
      }
      remap[`/projects/${slug}/${name}`] = `/uploads/${slug}/${name}`;
    }

    try {
      if (readdirSync(fromDir).length === 0) rmSync(fromDir, { recursive: true });
    } catch {
      /* ignore */
    }
  }
}

function rewrite(value) {
  if (!value || typeof value !== 'string') return value;
  return remap[value] || value;
}

if (!existsSync(dbPath)) {
  console.log(`Moved ${moved} files. No DB at ${dbPath}`);
  process.exit(0);
}

const client = createClient({ url: `file:${dbPath}` });
const projects = await client.execute('SELECT id, cover, card_image FROM projects');

for (const row of projects.rows) {
  const cover = rewrite(row.cover);
  const card = rewrite(row.card_image);
  await client.execute({
    sql: 'UPDATE projects SET cover = ?, card_image = ? WHERE id = ?',
    args: [cover, card, row.id],
  });
}

const images = await client.execute('SELECT id, path FROM project_images');
for (const row of images.rows) {
  const path = rewrite(row.path);
  if (path !== row.path) {
    await client.execute({
      sql: 'UPDATE project_images SET path = ? WHERE id = ?',
      args: [path, row.id],
    });
  }
}

client.close();
console.log(`Moved ${moved} files, remapped ${Object.keys(remap).length} paths`);
console.log(remap);
