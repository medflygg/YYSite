import type { APIRoute } from 'astro';
import {
  createUploadFolder,
  deleteUploadFile,
  listMedia,
} from '../../../lib/uploads';

export const GET: APIRoute = async ({ url }) => {
  const folder = url.searchParams.get('folder') || '/uploads';
  const data = listMedia(folder);
  if (data.error) {
    return new Response(JSON.stringify(data), { status: 404 });
  }
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let body: { action?: string; parent?: string; name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (body.action === 'mkdir') {
    const result = createUploadFolder(body.parent || '/uploads', body.name || '');
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400 });
    }
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
};

export const DELETE: APIRoute = async ({ request }) => {
  let body: { path?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  const result = deleteUploadFile(body.path || '');
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), { status: 400 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
