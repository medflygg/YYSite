// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Локально — корень `/`. На GitHub Pages / CI — `/YYSite`.
const isPages = Boolean(process.env.GITHUB_ACTIONS || process.env.CF_PAGES);

// https://astro.build/config
export default defineConfig({
  site: 'https://medflygg.github.io',
  base: isPages ? '/YYSite' : '/',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
