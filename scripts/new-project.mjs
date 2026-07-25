#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/[а-яё]/g, (ch) => {
      const map = {
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

const title = arg('title');
const category = arg('category', 'books');
const slug = arg('slug', title ? slugify(title) : '');

if (!title || !slug) {
  console.log(`Usage:
  npm run new:project -- --title "Название проекта" --category books

Categories: books | magazines | other
Optional: --slug my-slug
`);
  process.exit(1);
}

if (!['books', 'magazines', 'other'].includes(category)) {
  console.error('category must be books | magazines | other');
  process.exit(1);
}

const mdPath = join(root, 'src/content/projects', `${slug}.md`);
const assetDir = join(root, 'public/projects', slug);

if (existsSync(mdPath)) {
  console.error(`Already exists: ${mdPath}`);
  process.exit(1);
}

mkdirSync(assetDir, { recursive: true });

const md = `---
title: "${title.replace(/"/g, '\\"')}"
category: ${category}
featured: false
featuredLayout: left
year: ${new Date().getFullYear()}
client: ""
specs: ""
cover: "/projects/${slug}/cover.jpg"
gallery:
  - "/projects/${slug}/cover.jpg"
summary: "Краткое описание проекта"
caption: "${title.replace(/"/g, '\\"')}\\n"
behindTheScenes: []
whatHappenedNext: []
---

Полное описание проекта.
`;

writeFileSync(mdPath, md, 'utf8');

console.log(`Created:
  ${mdPath}
  ${assetDir}/

Next:
  1. Put cover.jpg (and gallery images) into public/projects/${slug}/
  2. Edit text in src/content/projects/${slug}.md
  3. Set featured: true to show on the home page
`);
