import { InlineKeyboard, type Context } from 'grammy';
import type { Order, OrderItem, User } from '@prisma/client';
import type { OrderStatus, OrderType } from '@rt/shared';
import { STATUS_FLOW } from '@rt/shared';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { changeOrderStatus, OrderError } from '../services/orders.js';
import { getInternal, getSettings, setInternal } from '../services/settings.js';
import { upsertFromTelegram } from '../plugins/auth.js';
import { bot } from './index.js';

/*
 * Restaurant side of the bot.
 * Every new order is posted ONCE to the staff group with buttons for the next step.
 * Pressing a button (or changing the status in the admin panel) edits that same message,
 * so the group always shows the current state of each order.
 */

type FullOrder = Order & { items: OrderItem[]; user: User; courier: User | null };

const STAFF_CHAT_KEY = 'staffChatId';

export async function getStaffChatId(): Promise<string | null> {
  return (await getInternal<string>(STAFF_CHAT_KEY)) ?? env.ADMIN_CHAT_ID ?? null;
}

// ---------------- rendering ----------------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n: number) => `${n.toLocaleString('ru-RU')} сум`;
const time = (d: Date | null) => (d ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' }) : '');

const statusTitle: Record<OrderStatus, string> = {
  new: '🆕 Новый заказ',
  accepted: '✅ Принят',
  cooking: '👨‍🍳 Готовится',
  ready: '🛍 Готов к выдаче',
  delivering: '🚕 В пути',
  completed: '🏁 Завершён',
  cancelled: '❌ Отменён',
};

/** Button label for moving INTO a status. */
function actionLabel(next: OrderStatus, byTaxi: boolean): string {
  switch (next) {
    case 'accepted':
      return '✅ Принять';
    case 'cooking':
      return '👨‍🍳 Готовится';
    case 'ready':
      return '🛍 Готов к выдаче';
    case 'delivering':
      return byTaxi ? '🚕 Отправлен (такси)' : '🚗 Передан курьеру';
    case 'completed':
      return '✅ Выдан / доставлен';
    default:
      return next;
  }
}

function nextStatus(order: Order): OrderStatus | null {
  const flow = STATUS_FLOW[order.type as OrderType];
  const i = flow.indexOf(order.status as OrderStatus);
  return i === -1 || i === flow.length - 1 ? null : (flow[i + 1] ?? null);
}

export function renderOrder(order: FullOrder, byTaxi: boolean, lastAction?: string): string {
  const status = order.status as OrderStatus;
  const lines: string[] = [];
  lines.push(`<b>${statusTitle[status]} · #${order.id}</b>`);
  lines.push(order.type === 'delivery' ? '🚗 <b>Доставка</b>' : '🏃 <b>Самовывоз</b>');
  lines.push('');

  for (const i of order.items) {
    lines.push(`• ${esc(i.nameRu)} × <b>${i.quantity}</b> — ${money(i.price * i.quantity)}`);
    if (i.comment) lines.push(`   💬 <b>${esc(i.comment)}</b>`);
  }
  lines.push('');

  if (order.deliveryFee) lines.push(`Доставка: ${money(order.deliveryFee)}`);
  else if (order.type === 'delivery' && byTaxi) lines.push('Доставка: такси, оплачивается отдельно');
  lines.push(`<b>Итого: ${money(order.total)}</b> · ${order.paymentMethod === 'cash' ? 'наличные' : 'перевод'}`);
  if (order.comment) lines.push(`\n📝 <b>${esc(order.comment)}</b>`);
  lines.push('');

  // Plain text: Telegram makes phone numbers tappable itself (tel: links are rejected by the Bot API).
  const phone = order.user.phone ?? 'нет номера';
  const username = order.user.tgUsername ? ` · @${esc(order.user.tgUsername)}` : '';
  lines.push(`👤 ${esc(order.user.displayName)}, ${phone}${username}`);
  if (order.type === 'delivery') {
    const comment = order.addressComment ? ` (${esc(order.addressComment)})` : '';
    lines.push(`📍 ${esc(order.addressText ?? '')}${comment}`);
    if (order.addressLat && order.addressLng) {
      lines.push(`🗺 <a href="https://yandex.uz/maps/?pt=${order.addressLng},${order.addressLat}&z=17&l=map">Открыть на карте</a>`);
    }
  }
  if (order.courier) lines.push(`🛵 Курьер: ${esc(order.courier.displayName)}${order.courier.phone ? `, ${order.courier.phone}` : ''}`);

  // Timeline
  const steps: [string, Date | null][] = [
    ['создан', order.createdAt],
    ['принят', order.acceptedAt],
    ['готовится', order.cookingAt],
    ['готов', order.readyAt],
    ['в пути', order.deliveringAt],
    ['завершён', order.completedAt],
    ['отменён', order.cancelledAt],
  ];
  const timeline = steps.filter(([, d]) => d).map(([n, d]) => `${n} ${time(d)}`);
  lines.push('');
  lines.push(`<i>🕒 ${timeline.join(' → ')}</i>`);
  if (order.cancelReason) lines.push(`<i>Причина отмены: ${esc(order.cancelReason)}</i>`);
  if (lastAction) lines.push(`<i>${esc(lastAction)}</i>`);
  return lines.join('\n');
}

export function staffKeyboard(order: Order, byTaxi: boolean): InlineKeyboard | undefined {
  const status = order.status as OrderStatus;
  if (status === 'completed' || status === 'cancelled') return undefined;
  const kb = new InlineKeyboard();
  const next = nextStatus(order);
  if (next) kb.text(actionLabel(next, byTaxi), `o:${order.id}:${next}`);
  kb.text('❌ Отменить', `o:${order.id}:ask-cancel`);
  return kb;
}

function courierKeyboard(order: Order): InlineKeyboard | undefined {
  const status = order.status as OrderStatus;
  if (status === 'cooking') return new InlineKeyboard().text('🚗 Забрал заказ', `c:${order.id}:delivering`);
  if (status === 'delivering') return new InlineKeyboard().text('✅ Доставил', `c:${order.id}:completed`);
  return undefined;
}

const loadOrder = (id: number) =>
  prisma.order.findUniqueOrThrow({ where: { id }, include: { items: true, user: true, courier: true } });

// ---------------- posting / syncing ----------------

/** Posts a new order to the staff group and remembers the message so it can be edited later. */
export async function postNewOrder(orderId: number): Promise<void> {
  const chatId = await getStaffChatId();
  if (!chatId) return;
  const [order, settings] = await Promise.all([loadOrder(orderId), getSettings()]);
  const msg = await bot.api.sendMessage(chatId, renderOrder(order, settings.deliveryByTaxi), {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: staffKeyboard(order, settings.deliveryByTaxi),
  });
  await prisma.order.update({ where: { id: orderId }, data: { staffChatId: String(chatId), staffMessageId: msg.message_id } });
}

/** Brings the staff (and courier) messages of an order up to date. Safe to call after any change. */
export async function syncOrderMessages(orderId: number, lastAction?: string): Promise<void> {
  const [order, settings] = await Promise.all([loadOrder(orderId), getSettings()]);
  const edits: Promise<unknown>[] = [];
  if (order.staffChatId && order.staffMessageId) {
    edits.push(
      bot.api.editMessageText(order.staffChatId, order.staffMessageId, renderOrder(order, settings.deliveryByTaxi, lastAction), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: staffKeyboard(order, settings.deliveryByTaxi),
      }),
    );
  }
  if (order.courier && order.courierMessageId) {
    edits.push(
      bot.api.editMessageText(order.courier.telegramId, order.courierMessageId, renderOrder(order, settings.deliveryByTaxi), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: courierKeyboard(order),
      }),
    );
  }
  // "message is not modified" and deleted messages are harmless.
  await Promise.allSettled(edits);
}

/** Sends the order to the assigned courier with pick-up / delivered buttons. */
export async function postToCourier(orderId: number): Promise<void> {
  const [order, settings] = await Promise.all([loadOrder(orderId), getSettings()]);
  if (!order.courier) return;
  const msg = await bot.api.sendMessage(order.courier.telegramId, renderOrder(order, settings.deliveryByTaxi), {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: courierKeyboard(order),
  });
  await prisma.order.update({ where: { id: orderId }, data: { courierMessageId: msg.message_id } });
  if (order.addressLat && order.addressLng) {
    await bot.api.sendLocation(order.courier.telegramId, order.addressLat, order.addressLng);
  }
}

// ---------------- button handling ----------------

/** Staff = anyone in the bound staff group, or a user with the admin role in a private chat. */
async function isStaff(ctx: Context): Promise<boolean> {
  const staffChat = await getStaffChatId();
  if (staffChat && String(ctx.chat?.id) === String(staffChat)) return true;
  if (!ctx.from) return false;
  const user = await prisma.user.findUnique({ where: { telegramId: String(ctx.from.id) } });
  return user?.role === 'admin' && !user.isBlocked;
}

const who = (ctx: Context) => {
  const f = ctx.from;
  if (!f) return 'кто-то';
  return f.username ? `@${f.username}` : [f.first_name, f.last_name].filter(Boolean).join(' ');
};

// Late import to avoid a circular dependency (notifications → staff → notifications).
async function notifyCustomer(orderId: number) {
  const { notifyCustomerStatus } = await import('./notifications.js');
  await notifyCustomerStatus(orderId).catch((e) => console.error('notifyCustomerStatus failed', e));
}

async function applyStatus(ctx: Context, orderId: number, next: OrderStatus, cancelReason?: string) {
  try {
    await changeOrderStatus(orderId, next, cancelReason ? { cancelReason } : {});
  } catch (e) {
    if (e instanceof OrderError) {
      await ctx.answerCallbackQuery({ text: 'Статус уже изменился, обновляю сообщение', show_alert: false });
      await syncOrderMessages(orderId);
      return;
    }
    throw e;
  }
  const action = `${statusTitle[next].replace(/^\S+\s/, '')}: ${who(ctx)}, ${time(new Date())}`;
  await Promise.all([syncOrderMessages(orderId, action), notifyCustomer(orderId)]);
  await ctx.answerCallbackQuery({ text: statusTitle[next] });
}

export function registerStaffHandlers() {
  // Staff buttons: o:<orderId>:<status | ask-cancel | cancel | keep>
  bot.callbackQuery(/^o:(\d+):([a-z-]+)$/, async (ctx) => {
    if (!(await isStaff(ctx))) {
      await ctx.answerCallbackQuery({ text: 'Нет доступа', show_alert: true });
      return;
    }
    const orderId = Number(ctx.match[1]);
    const action = ctx.match[2]!;
    const [order, settings] = await Promise.all([loadOrder(orderId), getSettings()]);

    if (action === 'ask-cancel') {
      await ctx.editMessageReplyMarkup({
        reply_markup: new InlineKeyboard().text('Да, отменить заказ', `o:${orderId}:cancel`).text('↩️ Назад', `o:${orderId}:keep`),
      });
      await ctx.answerCallbackQuery({ text: 'Точно отменить? Клиент получит уведомление.' });
      return;
    }
    if (action === 'keep') {
      await ctx.editMessageReplyMarkup({ reply_markup: staffKeyboard(order, settings.deliveryByTaxi) });
      await ctx.answerCallbackQuery();
      return;
    }
    if (action === 'cancel') {
      await applyStatus(ctx, orderId, 'cancelled', `отменил ${who(ctx)} в Telegram`);
      return;
    }
    await applyStatus(ctx, orderId, action as OrderStatus);
  });

  // Courier buttons: c:<orderId>:<delivering | completed>. Only the assigned courier may press them.
  bot.callbackQuery(/^c:(\d+):(delivering|completed)$/, async (ctx) => {
    const orderId = Number(ctx.match[1]);
    const order = await loadOrder(orderId);
    if (!ctx.from || order.courier?.telegramId !== String(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: 'Этот заказ назначен другому курьеру', show_alert: true });
      return;
    }
    const next = ctx.match[2] as OrderStatus;
    if (next === 'delivering' && order.status !== 'cooking') {
      await ctx.answerCallbackQuery({ text: 'Заказ ещё не готов к выдаче', show_alert: true });
      return;
    }
    await applyStatus(ctx, orderId, next);
  });

  // /bind: this group starts receiving orders. Only users with the admin role can do it.
  bot.command('bind', async (ctx) => {
    if (!ctx.from) return;
    const user = await upsertFromTelegram(ctx.from);
    if (user.role !== 'admin') {
      await ctx.reply(`Нет прав. Назначьте себе роль «Админ» в админ-панели (Клиенты), затем повторите /bind.\nВаш Telegram ID: ${ctx.from.id}`);
      return;
    }
    await setInternal(STAFF_CHAT_KEY, String(ctx.chat.id));
    await ctx.reply('✅ Готово! Новые заказы будут приходить в этот чат с кнопками для смены статуса.');
  });

  bot.command('unbind', async (ctx) => {
    if (!ctx.from) return;
    const user = await upsertFromTelegram(ctx.from);
    if (user.role !== 'admin') return;
    if ((await getStaffChatId()) !== String(ctx.chat.id)) {
      await ctx.reply('Этот чат не подключён к заказам.');
      return;
    }
    await setInternal(STAFF_CHAT_KEY, null);
    await ctx.reply('Чат отключён от заказов.');
  });

  // /orders: active orders at a glance (staff only)
  bot.command('orders', async (ctx) => {
    if (!(await isStaff(ctx))) return;
    const orders = await prisma.order.findMany({
      where: { status: { notIn: ['completed', 'cancelled'] } },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });
    if (!orders.length) {
      await ctx.reply('Активных заказов нет 🎉');
      return;
    }
    const lines = orders.map(
      (o) => `#${o.id} · ${statusTitle[o.status as OrderStatus]} · ${o.type === 'delivery' ? 'доставка' : 'самовывоз'} · ${money(o.total)} · ${esc(o.user.displayName)} · ${time(o.createdAt)}`,
    );
    await ctx.reply(`<b>Активные заказы (${orders.length})</b>\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
  });

  // /id: helps with setup and support
  bot.command('id', (ctx) => ctx.reply(`Chat ID: ${ctx.chat.id}\nВаш ID: ${ctx.from?.id ?? '—'}`));
}
