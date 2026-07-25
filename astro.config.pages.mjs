// @ts-check
/**
 * Static export for GitHub Pages.
 * Use: npm run build:pages
 */
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://medflygg.github.io',
  base: '/YYSite',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['@libsql/client', 'better-sqlite3'],
    },
    define: {
      'import.meta.env.STATIC_EXPORT': JSON.stringify('true'),
    },
  },
});
