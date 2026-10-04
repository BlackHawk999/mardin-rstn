import type { CreateOrderInput, OrderStatus, OrderType } from '@rt/shared';
import { STATUS_FLOW } from '@rt/shared';
import type { User } from '@prisma/client';
import { prisma } from '../db.js';
import { getSettings, isOpenNow } from './settings.js';

export class OrderError extends Error {
  constructor(
    public code:
      | 'closed'
      | 'phone_required'
      | 'empty'
      | 'dish_unavailable'
      | 'address_required'
      | 'min_order'
      | 'pickup_only'
      | 'invalid_transition'
      | 'not_found'
      | 'not_cancellable',
    public details?: unknown,
  ) {
    super(code);
  }
}

export async function createOrder(user: User, input: CreateOrderInput) {
  const settings = await getSettings();
  if (!isOpenNow(settings)) throw new OrderError('closed');
  if (!user.phone) throw new OrderError('phone_required');
  if (input.items.length === 0) throw new OrderError('empty');

  const dishIds = [...new Set(input.items.map((i) => i.dishId))];
  const dishes = await prisma.dish.findMany({ where: { id: { in: dishIds } }, include: { category: { select: { isHidden: true } } } });
  const byId = new Map(dishes.map((d) => [d.id, d]));

  const unavailable = dishIds.filter((id) => {
    const d = byId.get(id);
    return !d || !d.isAvailable || d.isHidden || d.category.isHidden;
  });
  if (unavailable.length) throw new OrderError('dish_unavailable', { dishIds: unavailable });

  if (input.type === 'delivery') {
    const pickupOnly = dishIds.filter((id) => byId.get(id)?.pickupOnly);
    if (pickupOnly.length) throw new OrderError('pickup_only', { dishIds: pickupOnly });
  }

  // Never trust client-side prices: recompute from the catalog.
  const items = input.items.map((i) => {
    const d = byId.get(i.dishId)!;
    return {
      dishId: d.id,
      nameUz: d.nameUz,
      nameRu: d.nameRu,
      price: d.price,
      quantity: i.quantity,
      comment: i.comment?.trim() || null,
    };
  });
  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // Minimum applies to delivery only; pickup can be any amount.
  if (input.type === 'delivery' && itemsTotal < settings.minOrderAmount) {
    throw new OrderError('min_order', { minOrderAmount: settings.minOrderAmount });
  }

  let address: { text: string; lat: number | null; lng: number | null; comment: string | null } | null = null;
  if (input.type === 'delivery') {
    if (input.addressId) {
      const saved = await prisma.address.findFirst({ where: { id: input.addressId, userId: user.id } });
      if (!saved) throw new OrderError('address_required');
      address = { text: saved.text, lat: saved.lat, lng: saved.lng, comment: input.addressComment ?? saved.comment };
    } else if (input.addressText) {
      address = {
        text: input.addressText,
        lat: input.addressLat ?? null,
        lng: input.addressLng ?? null,
        comment: input.addressComment ?? null,
      };
    } else {
      throw new OrderError('address_required');
    }
  }

  // Taxi delivery: price depends on the address and is not part of the order total.
  const deliveryFee = input.type === 'delivery' && !settings.deliveryByTaxi ? settings.deliveryFee : 0;
  const discount = 0;
  const total = itemsTotal + deliveryFee - discount;

  return prisma.order.create({
    data: {
      userId: user.id,
      type: input.type,
      status: 'new',
      paymentMethod: input.paymentMethod,
      addressText: address?.text ?? null,
      addressLat: address?.lat ?? null,
      addressLng: address?.lng ?? null,
      addressComment: address?.comment ?? null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      comment: input.comment?.trim() || null,
      itemsTotal,
      deliveryFee,
      discount,
      total,
      items: { create: items },
    },
    include: { items: true },
  });
}

const timestampField: Partial<Record<OrderStatus, 'acceptedAt' | 'cookingAt' | 'readyAt' | 'deliveringAt' | 'completedAt' | 'cancelledAt'>> = {
  accepted: 'acceptedAt',
  cooking: 'cookingAt',
  ready: 'readyAt',
  delivering: 'deliveringAt',
  completed: 'completedAt',
  cancelled: 'cancelledAt',
};

/** Moves an order forward along its flow, or cancels it. Used by the admin panel and the courier bot. */
export async function changeOrderStatus(orderId: number, next: OrderStatus, opts: { courierId?: number; cancelReason?: string } = {}) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const current = order.status as OrderStatus;

  if (next === 'cancelled') {
    if (current === 'completed' || current === 'cancelled') throw new OrderError('invalid_transition');
  } else {
    const flow = STATUS_FLOW[order.type as OrderType];
    const from = flow.indexOf(current);
    const to = flow.indexOf(next);
    if (from === -1 || to !== from + 1) throw new OrderError('invalid_transition', { from: current, to: next });
  }

  const field = timestampField[next];
  // Only applies if nobody changed the status meanwhile (e.g. the customer cancelling while staff press "accept").
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: current },
    data: {
      status: next,
      ...(field ? { [field]: new Date() } : {}),
      ...(opts.courierId !== undefined ? { courierId: opts.courierId } : {}),
      ...(opts.cancelReason ? { cancelReason: opts.cancelReason } : {}),
    },
  });
  if (count === 0) throw new OrderError('invalid_transition', { from: current, to: next });
  return prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, user: true } });
}

/** Reasons a customer can pick when cancelling; stored in Russian for the staff. */
export const CUSTOMER_CANCEL_REASONS = {
  changed_mind: 'Передумал',
  mistake: 'Ошибся в заказе',
  too_long: 'Долго ждать',
  other: 'Другое',
} as const;
export type CustomerCancelReason = keyof typeof CUSTOMER_CANCEL_REASONS;

/**
 * The customer cancels their own order. Allowed only while it is still "new" (the restaurant has not accepted it);
 * the check and the update are one statement, so it cannot slip past staff accepting at the same moment.
 */
export async function cancelOrderByCustomer(userId: number, orderId: number, reason: CustomerCancelReason) {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, userId, status: 'new' },
    data: { status: 'cancelled', cancelledAt: new Date(), cancelReason: `Клиент: ${CUSTOMER_CANCEL_REASONS[reason]}` },
  });
  if (count === 0) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new OrderError('not_found');
    throw new OrderError('not_cancellable', { status: order.status });
  }
  return prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
}
