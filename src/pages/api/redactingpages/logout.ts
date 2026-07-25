import type { APIRoute } from 'astro';
import {
  clearSessionCookieHeader,
  destroySession,
  readSessionId,
} from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const id = readSessionId(request.headers.get('cookie'));
  await destroySession(id);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookieHeader(),
    },
  });
};
