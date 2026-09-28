import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { User } from '@prisma/client';
import { prisma } from '../db.js';
import { devAuthAllowed, env } from '../env.js';
import { parseInitData, type TelegramUser } from '../telegram/validateInitData.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: User;
  }
}

/**
 * Every mini-app request carries `Authorization: tma <initData>`.
 * We verify the signature on each call: no sessions, no JWT, nothing to expire.
 * In development `Authorization: dev <telegramId>` is accepted so the UI can be opened in a normal browser.
 */
async function resolveUser(req: FastifyRequest): Promise<User | null> {
  const header = req.headers.authorization ?? '';
  const [scheme, ...rest] = header.split(' ');
  const value = rest.join(' ');

  if (scheme === 'tma' && value) {
    const parsed = parseInitData(value, env.BOT_TOKEN);
    if (!parsed?.user) return null;
    return upsertFromTelegram(parsed.user);
  }

  if (scheme === 'dev' && value && devAuthAllowed(req.headers)) {
    return upsertFromTelegram({ id: Number(value), first_name: 'Dev', username: 'dev_user', language_code: 'ru' });
  }

  return null;
}

export async function upsertFromTelegram(tg: TelegramUser): Promise<User> {
  const telegramId = String(tg.id);
  const existing = await prisma.user.findUnique({ where: { telegramId } });
  if (existing) {
    // Keep Telegram-provided fields fresh but never overwrite the user's chosen displayName.
    if (existing.tgFirstName !== tg.first_name || existing.tgLastName !== (tg.last_name ?? null) || existing.tgUsername !== (tg.username ?? null)) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { tgFirstName: tg.first_name, tgLastName: tg.last_name ?? null, tgUsername: tg.username ?? null },
      });
    }
    return existing;
  }
  return prisma.user.create({
    data: {
      telegramId,
      tgFirstName: tg.first_name,
      tgLastName: tg.last_name ?? null,
      tgUsername: tg.username ?? null,
      displayName: [tg.first_name, tg.last_name].filter(Boolean).join(' '),
      language: tg.language_code === 'uz' ? 'uz' : 'ru',
    },
  });
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest('user', undefined as unknown as User);

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await resolveUser(req);
    if (!user) return reply.code(401).send({ error: 'unauthorized' });
    if (user.isBlocked) return reply.code(403).send({ error: 'blocked' });
    req.user = user;
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
