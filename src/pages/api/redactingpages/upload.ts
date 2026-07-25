import type { APIRoute } from 'astro';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { deleteUploadFile } from '../../../lib/uploads';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif']);

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const folderRaw = String(form.get('folder') || 'misc')
    .replace(/\\/g, '/')
    .replace(/\.\./g, '')
    .replace(/[^a-z0-9/_-]+/gi, '')
    .replace(/^\/+|\/+$/g, '');
  const folderParts = (folderRaw || 'misc').split('/').filter(Boolean);
  const files = form.getAll('file').filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return new Response(JSON.stringify({ error: 'file required' }), { status: 400 });
  }

  const paths: string[] = [];
  for (const file of files) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!ALLOWED_EXT.has(ext)) {
      return new Response(
        JSON.stringify({ error: `Формат .${ext} не поддерживается` }),
        { status: 400 },
      );
    }
    const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
    const relDir = join('uploads', ...folderParts);
    const absDir = join(process.cwd(), 'public', relDir);
    mkdirSync(absDir, { recursive: true });
    writeFileSync(join(absDir, name), Buffer.from(await file.arrayBuffer()));
    paths.push(`/${relDir.replace(/\\/g, '/')}/${name}`);
  }

  return new Response(
    JSON.stringify(paths.length === 1 ? { path: paths[0], paths } : { paths }),
    { headers: { 'Content-Type': 'application/json' } },
  );
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
