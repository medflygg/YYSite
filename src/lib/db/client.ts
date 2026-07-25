import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema';

const DEFAULT_URL = 'file:./data/yysite.db';

function resolveDbUrl() {
  const raw = process.env.DATABASE_URL || DEFAULT_URL;
  if (!raw.startsWith('file:')) return raw;
  const filePath = raw.slice('file:'.length);
  const abs = resolve(process.cwd(), filePath);
  mkdirSync(dirname(abs), { recursive: true });
  return `file:${abs}`;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const client = createClient({ url: resolveDbUrl() });
  _db = drizzle(client, { schema });
  return _db;
}
