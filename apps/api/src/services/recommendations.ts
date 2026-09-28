import { prisma } from '../db.js';
import { getSettings } from './settings.js';

const MAX_RESULTS = 16;

/** "Кока-кола, 0,5 л" and "Кока-кола, 1 л" are sizes of one product: compare by the part before the comma. */
const baseName = (nameRu: string) => nameRu.split(',')[0]!.trim().toLowerCase();
const RECENT_ORDERS = 500;

export interface Recommendations {
  /** Dish ids in display order: "ordered together" first, then add-ons from the configured categories. */
  ids: number[];
  /** How many of the leading ids come from order history. */
  togetherCount: number;
}

/**
 * Cart upsell ("Добавить к заказу").
 * 1) Dishes most often found in the same recent orders as the cart's dishes.
 * 2) Filled up with dishes from the categories chosen in settings (drinks, sides…), hits first, categories interleaved.
 * The client additionally drops dishes already in the cart and pickup-only dishes for delivery.
 */
export async function getRecommendations(cartDishIds: number[]): Promise<Recommendations> {
  const exclude = new Set(cartDishIds);
  const visible = { isHidden: false, isAvailable: true, category: { isHidden: false } } as const;
  const usedBases = new Set(
    (await prisma.dish.findMany({ where: { id: { in: cartDishIds } }, select: { nameRu: true } })).map((d) => baseName(d.nameRu)),
  );

  // ---- 1. Ordered together ----
  let together: number[] = [];
  if (cartDishIds.length) {
    const orders = await prisma.order.findMany({
      where: { status: { not: 'cancelled' }, items: { some: { dishId: { in: cartDishIds } } } },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ORDERS,
    });
    if (orders.length) {
      const counts = await prisma.orderItem.groupBy({
        by: ['dishId'],
        where: { orderId: { in: orders.map((o) => o.id) }, dishId: { notIn: cartDishIds, not: null } },
        _count: { orderId: true },
        orderBy: { _count: { orderId: 'desc' } },
        take: MAX_RESULTS * 2,
      });
      const ids = counts.map((c) => c.dishId).filter((id): id is number => id !== null);
      const alive = new Map(
        (await prisma.dish.findMany({ where: { id: { in: ids }, ...visible }, select: { id: true, nameRu: true } })).map((d) => [d.id, d.nameRu]),
      );
      for (const id of ids) {
        const n = alive.get(id);
        if (!n || usedBases.has(baseName(n))) continue;
        usedBases.add(baseName(n));
        together.push(id);
        if (together.length >= MAX_RESULTS) break;
      }
    }
  }
  together.forEach((id) => exclude.add(id));

  // ---- 2. Add-ons from configured categories ----
  const settings = await getSettings();
  const categoryIds = settings.cartSuggestCategoryIds ?? [];
  let addons: number[] = [];
  if (categoryIds.length && together.length < MAX_RESULTS) {
    const dishes = await prisma.dish.findMany({
      where: { categoryId: { in: categoryIds }, ...visible },
      select: { id: true, categoryId: true, nameRu: true },
      orderBy: [{ isHit: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
    // Interleave categories so the strip isn't all drinks: drink, side, lemonade, drink, …
    const queues = categoryIds.map((cid) => dishes.filter((d) => d.categoryId === cid && !exclude.has(d.id)));
    while (queues.some((q) => q.length) && together.length + addons.length < MAX_RESULTS) {
      for (const q of queues) {
        // Take the next dish of this category whose product isn't already in the cart / list (one size per drink).
        let d = q.shift();
        while (d && usedBases.has(baseName(d.nameRu))) d = q.shift();
        if (!d) continue;
        usedBases.add(baseName(d.nameRu));
        addons.push(d.id);
      }
    }
    addons = addons.slice(0, MAX_RESULTS - together.length);
  }

  return { ids: [...together, ...addons], togetherCount: together.length };
}
