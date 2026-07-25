import type { APIRoute } from 'astro';
import {
  createSession,
  sessionCookieHeader,
  verifyPassword,
} from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  let body: { password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const ok = await verifyPassword(body.password || '');
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Неверный пароль' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await createSession();
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookieHeader(session.id, session.expiresAt),
    },
  });
};
