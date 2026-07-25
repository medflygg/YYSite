import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated, readSessionId } from './lib/auth';

const ADMIN_BASE = '/redactingpages';
const ADMIN_API = '/api/redactingpages';
const PUBLIC_API = new Set([`${ADMIN_API}/login`]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminPage =
    pathname === ADMIN_BASE || pathname.startsWith(`${ADMIN_BASE}/`);
  const isAdminApi = pathname.startsWith(ADMIN_API);

  if (!isAdminPage && !isAdminApi) {
    return next();
  }

  if (pathname === `${ADMIN_BASE}/login` || PUBLIC_API.has(pathname)) {
    return next();
  }

  const sessionId = readSessionId(context.request.headers.get('cookie'));
  const ok = await isAuthenticated(sessionId);

  if (!ok) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect(`${ADMIN_BASE}/login`);
  }

  return next();
});
