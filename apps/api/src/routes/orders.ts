import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { toOrderDto } from '../dto.js';
import { createOrder, OrderError } from '../services/orders.js';
import { notifyNewOrder } from '../bot/notifications.js';

const createOrderSchema = z.object({
  type: z.enum(['delivery', 'pickup']),
  paymentMethod: z.enum(['cash', 'transfer']),
  addressId: z.number().int().optional(),
  addressText: z.string().trim().max(200).optional(),
  addressLat: z.number().optional(),
  addressLng: z.number().optional(),
  addressComment: z.string().trim().max(200).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  comment: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        dishId: z.number().int(),
        quantity: z.number().int().min(1).max(50),
        comment: z.string().trim().max(200).optional(),
      }),
    )
    .min(1)
    .max(50),
});

export async function orderRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.post('/orders', async (req, reply) => {
    const input = createOrderSchema.parse(req.body);
    try {
      const order = await createOrder(req.user, input);
      notifyNewOrder(order.id).catch((e) => app.log.error(e, 'notifyNewOrder failed'));
      return reply.code(201).send(toOrderDto(order));
    } catch (e) {
      if (e instanceof OrderError) return reply.code(422).send({ error: e.code, details: e.details });
      throw e;
    }
  });

  app.get('/orders', async (req) => {
    const rows = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map(toOrderDto);
  });

  app.get('/orders/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    const row = await prisma.order.findFirst({ where: { id, userId: req.user.id }, include: { items: true } });
    if (!row) return reply.code(404).send({ error: 'not_found' });
    return toOrderDto(row);
  });
}
