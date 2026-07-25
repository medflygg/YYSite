/** Prefix site `base` (e.g. `/YYSite/`) for GitHub Pages. */
export function withBase(href: string): string {
  if (!href || /^(https?:|mailto:|tel:|data:|#)/i.test(href)) return href;
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  if (href.startsWith('/')) return `${normalizedBase}${href}`;
  return `${normalizedBase}/${href}`;
}
