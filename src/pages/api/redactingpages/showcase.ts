import type { APIRoute } from 'astro';
import { listShowcase } from '../../../lib/admin-content';

export const GET: APIRoute = async () => {
  const data = await listShowcase();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
