import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../env.js';
import { parseInitData } from '../telegram/validateInitData.js';
import { upsertFromTelegram } from './auth.js';

const secret = env.ADMIN_TOKEN_SECRET ?? createHash('sha256').update(`admin:${env.BOT_TOKEN}`).digest('hex');
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

interface AdminSession {
  sub: string; // 'password' or telegram id
  name: string;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    admin: AdminSession;
  }
  interface FastifyInstance {
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const sign = (payload: string) => createHmac('sha256', secret).update(payload).digest('base64url');

/** Stateless signed token: <base64url(json)>.<hmac>. No sessions table needed. */
export function issueAdminToken(session: Omit<AdminSession, 'exp'>): string {
  const payload = b64(JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string): AdminSession | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession;
    if (session.exp < Date.now() / 1000) return null;
    return session;
  } catch {
    return null;
  }
}

export function checkPassword(login: string, password: string): boolean {
  if (!env.ADMIN_PASSWORD) return false;
  const a = Buffer.from(`${login}:${password}`);
  const b = Buffer.from(`${env.ADMIN_LOGIN}:${env.ADMIN_PASSWORD}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const adminAuthPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest('admin', undefined as unknown as AdminSession);

  app.decorate('requireAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
    const header = req.headers.authorization ?? '';
    const [scheme, ...rest] = header.split(' ');
    const value = rest.join(' ');

    // Password login token (web admin)
    if (scheme === 'Bearer' && value) {
      const session = verifyAdminToken(value);
      if (session) {
        req.admin = session;
        return;
      }
    }

    // Telegram user with the admin role (admin opened as a Mini App)
    if (scheme === 'tma' && value) {
      const parsed = parseInitData(value, env.BOT_TOKEN);
      if (parsed?.user) {
        const user = await upsertFromTelegram(parsed.user);
        if (user.role === 'admin' && !user.isBlocked) {
          req.admin = { sub: user.telegramId, name: user.displayName, exp: 0 };
          return;
        }
      }
    }

    return reply.code(401).send({ error: 'unauthorized' });
  });
});
