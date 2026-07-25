#!/usr/bin/env node
/**
 * Build a static site for GitHub Pages in `.pages-build/`
 * (no rename of live SSR folders — works on Windows while dev server runs).
 */
import {
  existsSync,
  rmSync,
  mkdirSync,
  cpSync,
  readdirSync,
  statSync,
  writeFileSync,
  symlinkSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = join(root, '.pages-build');

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  '.astro',
  '.pages-build',
  '.pages-build-stash',
  'backups',
  'data',
]);

const SKIP_REL = new Set([
  'src/pages/api',
  'src/pages/redactingpages',
  'src/middleware.ts',
]);

function shouldSkip(relPosix) {
  if (SKIP_REL.has(relPosix)) return true;
  for (const skip of SKIP_REL) {
    if (relPosix.startsWith(`${skip}/`)) return true;
  }
  return false;
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const src = join(from, name);
    const rel = relative(root, src).split('\\').join('/');
    if (shouldSkip(rel)) continue;
    const dest = join(to, name);
    const st = statSync(src);
    if (st.isDirectory()) copyTree(src, dest);
    else cpSync(src, dest);
  }
}

function run(cwd, cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed (${res.status})`);
  }
}

function ensureUploadsFromProjects(appRoot) {
  const projectsRoot = join(appRoot, 'public', 'projects');
  const uploadsRoot = join(appRoot, 'public', 'uploads');
  mkdirSync(uploadsRoot, { recursive: true });
  writeFileSync(join(uploadsRoot, '.gitkeep'), '');
  if (!existsSync(projectsRoot)) return;
  for (const slug of readdirSync(projectsRoot)) {
    const fromDir = join(projectsRoot, slug);
    if (!statSync(fromDir).isDirectory()) continue;
    const toDir = join(uploadsRoot, slug);
    mkdirSync(toDir, { recursive: true });
    for (const name of readdirSync(fromDir)) {
      const from = join(fromDir, name);
      if (!statSync(from).isFile()) continue;
      cpSync(from, join(toDir, name));
    }
  }
}

try {
  if (existsSync(outRoot)) rmSync(outRoot, { recursive: true, force: true });
  console.log('copying project → .pages-build (without admin/api)...');
  copyTree(root, outRoot);

  const nmDest = join(outRoot, 'node_modules');
  const nmSrc = join(root, 'node_modules');
  if (existsSync(nmSrc) && !existsSync(nmDest)) {
    try {
      symlinkSync(nmSrc, nmDest, process.platform === 'win32' ? 'junction' : 'dir');
    } catch {
      console.log('symlink failed, running npm ci in .pages-build...');
      run(outRoot, 'npm', ['ci']);
    }
  } else if (!existsSync(nmDest)) {
    run(outRoot, 'npm', ['ci']);
  }

  ensureUploadsFromProjects(outRoot);
  mkdirSync(join(outRoot, 'data'), { recursive: true });

  run(outRoot, 'node', ['scripts/db-seed.mjs']);
  run(outRoot, 'npx', ['astro', 'build', '--config', 'astro.config.pages.mjs'], {
    STATIC_EXPORT: 'true',
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS || 'true',
    SITE_URL: 'https://medflygg.github.io',
  });

  const distFrom = join(outRoot, 'dist');
  const distTo = join(root, 'dist');
  if (existsSync(distTo)) rmSync(distTo, { recursive: true, force: true });
  cpSync(distFrom, distTo, { recursive: true });
  console.log('GitHub Pages build ready in dist/');
} catch (err) {
  console.error(err);
  process.exit(1);
}
