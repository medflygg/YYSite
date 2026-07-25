import type { APIRoute } from 'astro';
import { reorderFeatured, reorderPortfolio } from '../../../lib/admin-content';

export const POST: APIRoute = async ({ request }) => {
  let body: {
    type?: 'featured' | 'portfolio';
    category?: 'books' | 'magazines' | 'other';
    ids?: number[];
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!Array.isArray(body.ids)) {
    return new Response(JSON.stringify({ error: 'ids required' }), { status: 400 });
  }

  if (body.type === 'featured') {
    await reorderFeatured(body.ids);
  } else if (body.type === 'portfolio' && body.category) {
    await reorderPortfolio(body.category, body.ids);
  } else {
    return new Response(JSON.stringify({ error: 'Bad type' }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
