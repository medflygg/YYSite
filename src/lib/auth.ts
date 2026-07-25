import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq, lt } from 'drizzle-orm';
import { getDb } from './db/client';
import { migrate } from './db/migrate';
import { sessions } from './db/schema';

const COOKIE = 'yy_session';
const SESSION_DAYS = 14;

export function sessionCookieName() {
  return COOKIE;
}

function adminPassword() {
  // Prefer process.env so Docker/systemd runtime secrets win over build-time values.
  // In `astro dev`, Vite also fills import.meta.env from `.env`.
  const fromProcess = process.env.ADMIN_PASSWORD;
  if (typeof fromProcess === 'string' && fromProcess) return fromProcess;
  const fromMeta = import.meta.env.ADMIN_PASSWORD;
  if (typeof fromMeta === 'string' && fromMeta) return fromMeta;
  return 'changeme';
}

export async function verifyPassword(password: string) {
  const configured = adminPassword();
  // Plain compare for simple deploy; optional bcrypt hash if value starts with $2
  if (configured.startsWith('$2')) {
    return bcrypt.compare(password, configured);
  }
  return password === configured;
}

export async function createSession() {
  await migrate();
  const db = getDb();
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id, expiresAt });
  return { id, expiresAt };
}

export async function destroySession(id: string | undefined) {
  if (!id) return;
  await migrate();
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.id, id));
}

export async function isAuthenticated(sessionId: string | undefined) {
  if (!sessionId) return false;
  await migrate();
  const db = getDb();
  // cleanup expired
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  const rows = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  const row = rows[0];
  if (!row) return false;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return false;
  }
  return true;
}

export function sessionCookieHeader(id: string, expiresAt: Date) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

export function clearSessionCookieHeader() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function readSessionId(cookieHeader: string | null) {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === COOKIE) return rest.join('=');
  }
  return undefined;
}
