import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  cpSync,
} from 'node:fs';
import { join, normalize, relative, sep } from 'node:path';

export function uploadsRootAbs() {
  return normalize(join(process.cwd(), 'public', 'uploads'));
}

/** Resolve a path under /uploads/... to absolute filesystem path. */
export function resolveUploadPath(publicPath: string): string | null {
  if (!publicPath || typeof publicPath !== 'string') return null;
  const cleaned = publicPath.split('?')[0].split('#')[0].trim();
  if (cleaned.includes('..')) return null;

  let rel = cleaned;
  if (rel === '/uploads' || rel === 'uploads') rel = '';
  else if (rel.startsWith('/uploads/')) rel = rel.slice('/uploads/'.length);
  else if (rel.startsWith('uploads/')) rel = rel.slice('uploads/'.length);
  else if (cleaned.startsWith('/uploads')) rel = cleaned.slice('/uploads'.length).replace(/^\//, '');
  else return null;

  rel = rel.replace(/^\/+/, '').replace(/\\/g, '/');
  const abs = normalize(join(uploadsRootAbs(), ...rel.split('/').filter(Boolean)));
  const root = uploadsRootAbs();
  if (abs !== root && !abs.startsWith(root + sep)) return null;
  return abs;
}

export function toPublicUploadPath(absPath: string): string {
  const rel = relative(uploadsRootAbs(), absPath).split(sep).join('/');
  return rel ? `/uploads/${rel}` : '/uploads';
}

export function ensureUploadsRoot() {
  mkdirSync(uploadsRootAbs(), { recursive: true });
}

export function listMedia(folderPublic = '/uploads') {
  ensureUploadsRoot();
  const abs = resolveUploadPath(folderPublic === '' ? '/uploads' : folderPublic);
  if (!abs || !existsSync(abs) || !statSync(abs).isDirectory()) {
    return { error: 'Папка не найдена', folder: folderPublic, folders: [], files: [] };
  }

  const entries = readdirSync(abs, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory())
    .map((e) => ({
      name: e.name,
      path: toPublicUploadPath(join(abs, e.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter((e) => e.isFile() && e.name !== '.gitkeep')
    .map((e) => {
      const full = join(abs, e.name);
      const st = statSync(full);
      return {
        name: e.name,
        path: toPublicUploadPath(full),
        size: st.size,
        mtime: st.mtimeMs,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { folder: toPublicUploadPath(abs), folders, files };
}

export function createUploadFolder(parentPublic: string, name: string) {
  const safe = name.trim().replace(/[^a-zA-Z0-9а-яёА-ЯЁ._-]+/gi, '-').replace(/^-+|-+$/g, '');
  if (!safe) return { ok: false as const, error: 'Некорректное имя папки' };
  const parent = resolveUploadPath(parentPublic || '/uploads');
  if (!parent) return { ok: false as const, error: 'Некорректный путь' };
  const target = join(parent, safe);
  if (existsSync(target)) return { ok: false as const, error: 'Папка уже есть' };
  mkdirSync(target, { recursive: true });
  return { ok: true as const, path: toPublicUploadPath(target) };
}

export function deleteUploadFile(publicPath: string): { ok: boolean; error?: string } {
  const abs = resolveUploadPath(publicPath);
  if (!abs) {
    return { ok: false, error: 'Можно удалять только файлы из /uploads/' };
  }
  if (abs === uploadsRootAbs()) {
    return { ok: false, error: 'Нельзя удалить корень uploads' };
  }
  if (!existsSync(abs)) return { ok: true };
  try {
    const st = statSync(abs);
    if (st.isDirectory()) {
      const kids = readdirSync(abs).filter((n) => n !== '.gitkeep');
      if (kids.length > 0) {
        return { ok: false, error: 'Папка не пуста' };
      }
      rmSync(abs, { recursive: true, force: true });
    } else {
      unlinkSync(abs);
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

/** Move public/projects/<slug>/* → public/uploads/<slug>/ and return path remap. */
export function migrateProjectsToUploads(): {
  moved: number;
  remap: Record<string, string>;
} {
  ensureUploadsRoot();
  const projectsRoot = join(process.cwd(), 'public', 'projects');
  const remap: Record<string, string> = {};
  let moved = 0;
  if (!existsSync(projectsRoot)) return { moved, remap };

  for (const slug of readdirSync(projectsRoot)) {
    const fromDir = join(projectsRoot, slug);
    if (!statSync(fromDir).isDirectory()) continue;
    const toDir = join(uploadsRootAbs(), slug);
    mkdirSync(toDir, { recursive: true });

    for (const name of readdirSync(fromDir)) {
      const from = join(fromDir, name);
      if (!statSync(from).isFile()) continue;
      const to = join(toDir, name);
      if (!existsSync(to)) {
        try {
          renameSync(from, to);
        } catch {
          cpSync(from, to);
          unlinkSync(from);
        }
        moved++;
      }
      remap[`/projects/${slug}/${name}`] = `/uploads/${slug}/${name}`;
    }

    // remove empty project dir
    try {
      if (readdirSync(fromDir).length === 0) rmSync(fromDir, { recursive: true });
    } catch {
      /* ignore */
    }
  }

  return { moved, remap };
}
