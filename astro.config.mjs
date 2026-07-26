// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

/** Trust public host behind Caddy so CSRF origin check works for uploads. */
function allowedDomainsFromEnv() {
  const domains = [
    { hostname: 'yanayurasova.art', protocol: 'https' },
    { hostname: 'www.yanayurasova.art', protocol: 'https' },
  ];
  const site = process.env.SITE_URL;
  if (site) {
    try {
      const u = new URL(site);
      const protocol = u.protocol.replace(':', '') || 'https';
      if (!domains.some((d) => d.hostname === u.hostname)) {
        domains.push({ hostname: u.hostname, protocol });
      }
    } catch {
      /* ignore bad SITE_URL */
    }
  }
  return domains;
}

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: {
    checkOrigin: true,
    allowedDomains: allowedDomainsFromEnv(),
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['@libsql/client', 'better-sqlite3'],
    },
  },
});
