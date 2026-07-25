import type { APIRoute } from 'astro';
import {
  deleteProject,
  getProjectById,
  updateProject,
  type ProjectInput,
} from '../../../../lib/admin-content';

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!id) return new Response(JSON.stringify({ error: 'Bad id' }), { status: 400 });
  const project = await getProjectById(id);
  if (!project) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify(project), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (!id) return new Response(JSON.stringify({ error: 'Bad id' }), { status: 400 });
  let body: Partial<ProjectInput>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  try {
    const project = await updateProject(id, body);
    if (!project) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(project), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!id) return new Response(JSON.stringify({ error: 'Bad id' }), { status: 400 });
  await deleteProject(id);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
