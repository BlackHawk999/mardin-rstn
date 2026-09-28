import type { OrderStatus, OrderType } from '@rt/shared';
import { STATUS_FLOW } from '@rt/shared';

export const money = (n: number) => `${n.toLocaleString('ru-RU')} сум`;

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const date = (iso: string) => new Date(iso).toLocaleDateString('ru-RU');

export const statusLabel: Record<OrderStatus, string> = {
  new: 'Новый',
  accepted: 'Принят',
  cooking: 'Готовится',
  ready: 'Готов к выдаче',
  delivering: 'Доставляется',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export const statusColor: Record<OrderStatus, string> = {
  new: 'bg-[#fdecec] text-danger',
  accepted: 'bg-[#e8f0fb] text-info',
  cooking: 'bg-[#fdf3e3] text-warning',
  ready: 'bg-[#e6f4ea] text-success',
  delivering: 'bg-[#e8f0fb] text-info',
  completed: 'bg-surface-2 text-muted',
  cancelled: 'bg-surface-2 text-muted line-through',
};

/** The next step in the order's flow, or null when it is final. */
export function nextStatus(type: OrderType, status: OrderStatus): OrderStatus | null {
  const flow = STATUS_FLOW[type];
  const i = flow.indexOf(status);
  return i === -1 || i === flow.length - 1 ? null : (flow[i + 1] ?? null);
}

export const nextActionLabel: Partial<Record<OrderStatus, string>> = {
  accepted: 'Принять',
  cooking: 'Начать готовить',
  ready: 'Готов к выдаче',
  delivering: 'Передать курьеру',
  completed: 'Завершить',
};

export const typeLabel: Record<OrderType, string> = { delivery: 'Доставка', pickup: 'Самовывоз' };
export const paymentLabel = { cash: 'Наличные', transfer: 'Перевод' } as const;
export const roleLabel = { customer: 'Клиент', courier: 'Курьер', admin: 'Админ' } as const;
