import type { APIRoute } from 'astro';
import type { AboutCardInput } from '../../../lib/about-cards';
import { replaceAboutCards } from '../../../lib/admin-content';
import { listAboutCards } from '../../../lib/content';

export const GET: APIRoute = async () => {
  const cards = await listAboutCards();
  return new Response(JSON.stringify({ cards }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  let body: { cards?: AboutCardInput[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
    });
  }
  if (!Array.isArray(body.cards)) {
    return new Response(JSON.stringify({ error: 'cards array required' }), {
      status: 400,
    });
  }

  const cards = await replaceAboutCards(body.cards);
  return new Response(JSON.stringify({ cards }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
