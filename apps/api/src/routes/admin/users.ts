import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import type { AdminUserDto } from '@rt/shared';
import { prisma } from '../../db.js';
import { toUserDto } from '../../dto.js';

export async function adminUserRoutes(app: FastifyInstance) {
  app.get('/users', async (req) => {
    const q = z
      .object({
        q: z.string().trim().optional(),
        role: z.enum(['customer', 'courier', 'admin']).optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(30),
      })
      .parse(req.query);

    const where: Prisma.UserWhereInput = {};
    if (q.role) where.role = q.role;
    if (q.q) where.OR = [{ displayName: { contains: q.q } }, { phone: { contains: q.q } }, { tgUsername: { contains: q.q } }, { telegramId: { contains: q.q } }];

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { orders: { where: { status: 'completed' }, select: { total: true, createdAt: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    const items: AdminUserDto[] = rows.map((u) => ({
      ...toUserDto(u),
      tgUsername: u.tgUsername,
      isBlocked: u.isBlocked,
      createdAt: u.createdAt.toISOString(),
      ordersCount: u.orders.length,
      totalSpent: u.orders.reduce((s, o) => s + o.total, 0),
      lastOrderAt: u.orders.reduce<Date | null>((last, o) => (!last || o.createdAt > last ? o.createdAt : last), null)?.toISOString() ?? null,
    }));
    return { items, total, page: q.page, pageSize: q.pageSize };
  });

  app.patch('/users/:id', async (req) => {
    const id = Number((req.params as { id: string }).id);
    const body = z
      .object({
        role: z.enum(['customer', 'courier', 'admin']).optional(),
        isBlocked: z.boolean().optional(),
        displayName: z.string().trim().min(1).max(60).optional(),
        phone: z.string().trim().max(20).nullable().optional(),
      })
      .parse(req.body);
    const u = await prisma.user.update({ where: { id }, data: body });
    return { ...toUserDto(u), tgUsername: u.tgUsername, isBlocked: u.isBlocked, createdAt: u.createdAt.toISOString() };
  });
}
