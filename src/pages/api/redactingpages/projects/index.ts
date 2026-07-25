import type { APIRoute } from 'astro';
import { listProjects } from '../../../../lib/content';
import { createProject, type ProjectInput } from '../../../../lib/admin-content';

export const GET: APIRoute = async () => {
  const items = await listProjects();
  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let body: ProjectInput;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  if (!body.title || !body.category) {
    return new Response(JSON.stringify({ error: 'title and category required' }), {
      status: 400,
    });
  }
  try {
    const project = await createProject(body);
    return new Response(JSON.stringify(project), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
};
