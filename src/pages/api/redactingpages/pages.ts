import type { APIRoute } from 'astro';
import { getSitePage } from '../../../lib/content';
import { upsertSitePage } from '../../../lib/admin-content';

export const GET: APIRoute = async () => {
  const about = await getSitePage('about');
  const contacts = await getSitePage('contacts');
  return new Response(JSON.stringify({ about, contacts }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  let body: { key?: string; title?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  if (!body.key || !body.title) {
    return new Response(JSON.stringify({ error: 'key and title required' }), {
      status: 400,
    });
  }
  await upsertSitePage(body.key, body.title, body.body || '');
  const page = await getSitePage(body.key);
  return new Response(JSON.stringify(page), {
    headers: { 'Content-Type': 'application/json' },
  });
};
