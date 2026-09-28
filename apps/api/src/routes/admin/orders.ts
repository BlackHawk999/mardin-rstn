import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { ORDER_STATUSES } from '@rt/shared';
import { prisma } from '../../db.js';
import { toAdminOrderDto } from '../../adminDto.js';
import { changeOrderStatus, OrderError } from '../../services/orders.js';
import { notifyCourierAssigned, notifyStatusChangedFromAdmin } from '../../bot/notifications.js';
import { syncOrderMessages } from '../../bot/staff.js';

const include = { items: true, user: true, courier: true } as const;

export async function adminOrderRoutes(app: FastifyInstance) {
  app.get('/orders', async (req) => {
    const q = z
      .object({
        status: z.enum(ORDER_STATUSES).optional(),
        active: z.coerce.boolean().optional(), // not completed/cancelled
        q: z.string().trim().optional(), // order id / phone / name
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(30),
      })
      .parse(req.query);

    const where: Prisma.OrderWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.active) where.status = { notIn: ['completed', 'cancelled'] };
    if (q.q) {
      const id = Number(q.q.replace('#', ''));
      where.OR = [
        ...(Number.isInteger(id) ? [{ id }] : []),
        { user: { phone: { contains: q.q } } },
        { user: { displayName: { contains: q.q } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      prisma.order.count({ where }),
    ]);
    return { items: items.map(toAdminOrderDto), total, page: q.page, pageSize: q.pageSize };
  });

  app.get('/orders/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const order = await prisma.order.findUnique({ where: { id }, include });
    if (!order) return reply.code(404).send({ error: 'not_found' });
    return toAdminOrderDto(order);
  });

  app.post('/orders/:id/status', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const body = z
      .object({
        status: z.enum(ORDER_STATUSES),
        cancelReason: z.string().trim().max(200).optional(),
        courierId: z.number().int().optional(),
      })
      .parse(req.body);
    try {
      await changeOrderStatus(id, body.status, { cancelReason: body.cancelReason, courierId: body.courierId });
    } catch (e) {
      if (e instanceof OrderError) return reply.code(422).send({ error: e.code, details: e.details });
      throw e;
    }
    notifyStatusChangedFromAdmin(id).catch((e) => app.log.error(e, 'status notifications failed'));
    const order = await prisma.order.findUniqueOrThrow({ where: { id }, include });
    return toAdminOrderDto(order);
  });

  app.post('/orders/:id/courier', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const body = z.object({ courierId: z.number().int().nullable() }).parse(req.body);
    if (body.courierId !== null) {
      const courier = await prisma.user.findFirst({ where: { id: body.courierId, role: 'courier', isBlocked: false } });
      if (!courier) return reply.code(422).send({ error: 'courier_not_found' });
    }
    // A new courier gets a fresh message; the old courier's message is no longer tracked.
    const order = await prisma.order.update({ where: { id }, data: { courierId: body.courierId, courierMessageId: null }, include });
    if (body.courierId !== null) notifyCourierAssigned(id).catch((e) => app.log.error(e, 'notifyCourierAssigned failed'));
    else syncOrderMessages(id).catch((e) => app.log.error(e, 'syncOrderMessages failed'));
    return toAdminOrderDto(order);
  });

  app.get('/couriers', async () => {
    const rows = await prisma.user.findMany({ where: { role: 'courier', isBlocked: false }, orderBy: { displayName: 'asc' } });
    return rows.map((u) => ({ id: u.id, displayName: u.displayName, phone: u.phone }));
  });
}
