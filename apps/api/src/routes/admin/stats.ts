import type { FastifyInstance } from 'fastify';
import type { AdminStatsDto } from '@rt/shared';
import { prisma } from '../../db.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function adminStatsRoutes(app: FastifyInstance) {
  app.get('/stats', async (): Promise<AdminStatsDto> => {
    const today = startOfToday();
    const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [todayAgg, weekAgg, activeOrders, newOrders, customers, topItems] = await Promise.all([
      prisma.order.aggregate({ where: { createdAt: { gte: today }, status: { not: 'cancelled' } }, _count: true, _sum: { total: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: weekAgo }, status: { not: 'cancelled' } }, _count: true, _sum: { total: true } }),
      prisma.order.count({ where: { status: { notIn: ['completed', 'cancelled'] } } }),
      prisma.order.count({ where: { status: 'new' } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.orderItem.groupBy({
        by: ['dishId', 'nameRu', 'nameUz'],
        where: { order: { createdAt: { gte: weekAgo }, status: { not: 'cancelled' } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      today: { orders: todayAgg._count, revenue: todayAgg._sum.total ?? 0 },
      week: { orders: weekAgg._count, revenue: weekAgg._sum.total ?? 0 },
      activeOrders,
      newOrders,
      customers,
      topDishes: topItems.map((t) => ({ dishId: t.dishId, nameRu: t.nameRu, nameUz: t.nameUz, quantity: t._sum.quantity ?? 0 })),
    };
  });
}
