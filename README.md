# YYSite

Портфолио YY. Astro (SSR) + React + Tailwind + Motion + SQLite.

## Локальный запуск

```bash
npm install
cp .env.example .env
npm run db:seed
npm run dev
```

- Сайт: http://127.0.0.1:4321/
- Админка: http://127.0.0.1:4321/redactingpages — пароль из `.env` (`ADMIN_PASSWORD`)

## Админка

- `/redactingpages/projects` — проекты, картинки, галерея  
- `/redactingpages/showcase` — порядок на главной и в портфолио  
- `/redactingpages/content` — папки и файлы (`public/uploads/`)  
- `/redactingpages/pages` — «обо мне» и «контакты»

После сида источник правды — SQLite (`data/yysite.db`). Markdown в `src/content/` нужен только для первичного `npm run db:seed`.

## GitHub Pages (статика, временно)

Публичный снимок без админки: https://medflygg.github.io/YYSite/

```bash
npm run build:pages
```

Деплой из `main` через Actions (workflow `Deploy to GitHub Pages`).  
Правки из админки на Pages не попадают — только то, что в git на момент билда.

Ветка **`vps`** — полный бэкап SSR/CMS-версии для будущего VPS.

## Прод на VPS

Полная инструкция: **[deploy.md](deploy.md)**

Кратко (Docker + Caddy):

```bash
cp .env.example .env   # задай ADMIN_PASSWORD и SITE_URL
docker compose up -d --build
# Caddy → reverse_proxy 127.0.0.1:4321
```

Бэкап данных и загрузок:

```bash
./scripts/backup.sh
```

Критичные данные: `data/` и `public/uploads/` — храни копии вне VPS.
