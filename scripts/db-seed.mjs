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
      portfolio_cover TEXT,
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
    CREATE TABLE IF NOT EXISTS about_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      num TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      bg TEXT NOT NULL DEFAULT 'bg-yy-yellow',
      text TEXT NOT NULL DEFAULT 'text-black',
      class_name TEXT NOT NULL DEFAULT 'left-[30%] top-[30%]',
      z INTEGER NOT NULL DEFAULT 1,
      rotate TEXT,
      has_cta INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    );
  `);
}

const DEFAULT_ABOUT_CARDS = [
  {
    num: '01',
    title: 'предисловие',
    bg: 'bg-[#f29009]',
    text: 'text-black',
    className: 'left-[31%] top-[32%]',
    z: 7,
    rotate: null,
    hasCta: 0,
    sortOrder: 0,
    body: 'Я — книжный и графический дизайнер. Работаю с книгами, журналами и айдентикой. Беру на себя весь процесс: от исследования и поиска идеи до дизайна, верстки, допечатной подготовки и взаимодействия с типографиями. Работаю с издательствами, медиа, культурными проектами и частными заказчиками.',
  },
  {
    num: '02',
    title: 'послужной список',
    bg: 'bg-[#f7bdb2]',
    text: 'text-black',
    className: 'left-[38%] top-[10%]',
    z: 4,
    rotate: 'rotate-[2deg]',
    hasCta: 0,
    sortOrder: 1,
    body: 'Полтора года работала в журнале <span class="underline underline-offset-2">«Алло, мам»</span>, пройдя путь от ведущего дизайнера до руководителя дизайн-отдела, а параллельно была ведущим дизайнером калининградского журнала <span class="underline underline-offset-2">«9×12»</span>.\n\nМое имя можно встретить на страницах книг издательств *Kongress W Press, АСТ, Бомбора, Nouveaux Angles, Рипол Классик, Калининградская книга*',
  },
  {
    num: '03',
    title: 'образование',
    bg: 'bg-yy-yellow',
    text: 'text-black',
    className: 'left-[6%] top-[22%]',
    z: 5,
    rotate: '-rotate-[3deg]',
    hasCta: 0,
    sortOrder: 2,
    body: 'Окончила бакалавриат Школы дизайна НИУ ВШЭ по профилю «Типографика». Сейчас учусь в магистратуре НИУ ВШЭ на направлении «Искусство книги», где продолжаю исследовать книжный дизайн и работу с печатными изданиями.',
  },
  {
    num: '04',
    title: 'за кадром',
    bg: 'bg-[#4a6e7a]',
    text: 'text-white',
    className: 'left-[18%] top-[5%]',
    z: 3,
    rotate: null,
    hasCta: 0,
    sortOrder: 3,
    body: 'Мне важно видеть проект целиком: от первой идеи и содержания до выбора бумаги, особенностей печати и готового экземпляра.\n\nРаботаю не только с визуальной частью проекта, но и с его технической стороной. Понимаю, как собирается книга, какие решения влияют на производство, и сопровождаю проект до момента, когда он становится физическим объектом.',
  },
  {
    num: '05',
    title: 'заметки на полях',
    bg: 'bg-[#4a6e7a]',
    text: 'text-white',
    className: 'left-[50%] top-[48%]',
    z: 6,
    rotate: '-rotate-[4deg]',
    hasCta: 1,
    sortOrder: 4,
    body: 'Веду блог о книжном дизайне, где делюсь своими проектами, интересными изданиями, находками, деталями верстки и полиграфии. Собираю коллекцию решений, которые вдохновляют и помогают смотреть на книги внимательнее.',
  },
  {
    num: '06',
    title: 'за пределами страниц',
    bg: 'bg-[#aebf9f]',
    text: 'text-black',
    className: 'left-[46%] top-[9%]',
    z: 2,
    rotate: null,
    hasCta: 0,
    sortOrder: 5,
    body: 'Если я не за компьютером, то, скорее всего, с фотоаппаратом или микрофоном в руках. Люблю фотографировать, поэтому сама снимаю все книжные проекты. А еще уже больше года занимаюсь вокалом (обожаю). Иногда делюсь опытом на лекциях и паблик-токах, однажды даже оказалась ведущей концерта. Неожиданно, но мне понравилось.',
  },
  {
    num: '07',
    title: 'эпилог',
    bg: 'bg-[#aebf9f]',
    text: 'text-black',
    className: 'left-[2%] top-[40%]',
    z: 1,
    rotate: 'rotate-[2deg]',
    hasCta: 0,
    sortOrder: 6,
    body: 'Каждая книга для меня — это диалог между автором, дизайнером и читателем. Мне интересно создавать издания, которые хочется не только прочитать, но и прожить.\n\nСейчас в работе несколько новых проектов, но всегда есть место для следующего. Возможно, им станет именно ваш.',
  },
];

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
  await client.execute('DELETE FROM about_cards');

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
        year, client, specs, summary, caption, body, cover, card_image, portfolio_cover,
        awards, behind_the_scenes, what_happened_next, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        toUploadsPath(data.portfolioCover ?? null),
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

  for (const card of DEFAULT_ABOUT_CARDS) {
    await client.execute({
      sql: `INSERT INTO about_cards
        (num, title, body, bg, text, class_name, z, rotate, has_cta, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        card.num,
        card.title,
        card.body,
        card.bg,
        card.text,
        card.className,
        card.z,
        card.rotate,
        card.hasCta,
        card.sortOrder,
      ],
    });
  }
  console.log(`seeded ${DEFAULT_ABOUT_CARDS.length} about cards`);

  console.log(`Done. DB: ${dbPath}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
