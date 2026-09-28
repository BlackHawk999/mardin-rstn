import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { toAddressDto, toUserDto } from '../dto.js';
import { devAuthAllowed, env } from '../env.js';
import { normalizePhone, parseContactResponse } from '../telegram/validateInitData.js';

export async function meRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  /** Called on every app launch: verifies initData and returns (or creates) the profile. */
  app.post('/me', async (req) => toUserDto(req.user));

  app.patch('/me', async (req) => {
    const body = z
      .object({
        displayName: z.string().trim().min(1).max(60).optional(),
        language: z.enum(['ru', 'uz']).optional(),
      })
      .parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user.id }, data: body });
    return toUserDto(user);
  });

  /**
   * Receives the signed payload of `WebApp.requestContact` (the `response` string from the callback).
   * The signature proves the phone really came from Telegram for this user.
   */
  app.post('/me/phone', async (req, reply) => {
    const body = z
      .object({
        response: z.string().optional(),
        // Dev-only: raw phone without Telegram signature.
        phone: z.string().optional(),
      })
      .parse(req.body);

    let phone: string | null = null;
    if (body.response) {
      const parsed = parseContactResponse(body.response, env.BOT_TOKEN);
      if (!parsed) return reply.code(400).send({ error: 'invalid_contact_signature' });
      if (String(parsed.userId) !== req.user.telegramId) return reply.code(400).send({ error: 'contact_user_mismatch' });
      phone = parsed.phone;
    } else if (body.phone && devAuthAllowed(req.headers)) {
      phone = normalizePhone(body.phone);
    }
    if (!phone) return reply.code(400).send({ error: 'phone_required' });

    const user = await prisma.user.update({ where: { id: req.user.id }, data: { phone } });
    return toUserDto(user);
  });

  // ---- Addresses ----
  app.get('/me/addresses', async (req) => {
    const rows = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toAddressDto);
  });

  app.post('/me/addresses', async (req) => {
    const body = z
      .object({
        label: z.string().trim().max(40).optional(),
        text: z.string().trim().min(3).max(200),
        lat: z.number().optional(),
        lng: z.number().optional(),
        comment: z.string().trim().max(200).optional(),
        isDefault: z.boolean().optional(),
      })
      .parse(req.body);

    const count = await prisma.address.count({ where: { userId: req.user.id } });
    const makeDefault = body.isDefault || count === 0;
    if (makeDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }
    const row = await prisma.address.create({
      data: {
        userId: req.user.id,
        label: body.label || null,
        text: body.text,
        lat: body.lat,
        lng: body.lng,
        comment: body.comment || null,
        isDefault: makeDefault,
      },
    });
    return toAddressDto(row);
  });

  app.patch('/me/addresses/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const body = z
      .object({
        label: z.string().trim().max(40).nullable().optional(),
        text: z.string().trim().min(3).max(200).optional(),
        comment: z.string().trim().max(200).nullable().optional(),
      })
      .parse(req.body);
    const row = await prisma.address.findFirst({ where: { id, userId: req.user.id } });
    if (!row) return reply.code(404).send({ error: 'not_found' });
    const updated = await prisma.address.update({
      where: { id },
      data: { ...body, label: body.label === '' ? null : body.label, comment: body.comment === '' ? null : body.comment },
    });
    return toAddressDto(updated);
  });

  app.post('/me/addresses/:id/default', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const row = await prisma.address.findFirst({ where: { id, userId: req.user.id } });
    if (!row) return reply.code(404).send({ error: 'not_found' });
    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return { ok: true };
  });

  app.delete('/me/addresses/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const row = await prisma.address.findFirst({ where: { id, userId: req.user.id } });
    if (!row) return reply.code(404).send({ error: 'not_found' });
    await prisma.address.delete({ where: { id } });
    if (row.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return { ok: true };
  });

  // ---- Favorites ----
  app.get('/me/favorites', async (req) => {
    const rows = await prisma.favorite.findMany({ where: { userId: req.user.id }, select: { dishId: true } });
    return rows.map((r) => r.dishId);
  });

  app.put('/me/favorites/:dishId', async (req, reply) => {
    const dishId = Number((req.params as { dishId: string }).dishId);
    const dish = await prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish) return reply.code(404).send({ error: 'not_found' });
    await prisma.favorite.upsert({
      where: { userId_dishId: { userId: req.user.id, dishId } },
      update: {},
      create: { userId: req.user.id, dishId },
    });
    return { ok: true };
  });

  app.delete('/me/favorites/:dishId', async (req) => {
    const dishId = Number((req.params as { dishId: string }).dishId);
    await prisma.favorite.deleteMany({ where: { userId: req.user.id, dishId } });
    return { ok: true };
  });
}
