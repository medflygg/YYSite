# YYSite

Портфолио YY по макету Figma. Astro + React + Tailwind + Motion.

**Тестовый сайт (GitHub Pages):** https://medflygg.github.io/YYSite/

## Запуск

```bash
npm install
npm run dev
```

## Добавить проект

```bash
npm run new:project -- --title "Название" --category books
```

Категории: `books` | `magazines` | `other`.

1. Положите `cover.jpg` (и галерею) в `public/projects/<slug>/`
2. Отредактируйте `src/content/site/` или `src/content/projects/<slug>.md`
3. Для главной поставьте `featured: true`

## Страницы

- `/` — главная + избранное
- `/portfolio` — витрина (книги / журналы / другое)
- `/projects/<slug>` — страница проекта
- `/about`, `/contacts` — контент из `src/content/site/`
