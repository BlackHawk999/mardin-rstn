import { bot } from './index.js';
import { prisma } from '../db.js';
import { getStaffChatId, postNewOrder, postToCourier, syncOrderMessages } from './staff.js';

/** New order from the mini app → staff group, with buttons for the next step. */
export async function notifyNewOrder(orderId: number) {
  await postNewOrder(orderId);
}

/** Courier assigned in the admin panel → courier gets the order with "picked up / delivered" buttons. */
export async function notifyCourierAssigned(orderId: number) {
  await postToCourier(orderId);
  await syncOrderMessages(orderId); // staff message shows the courier's name
}

/** Status changed in the admin panel → keep the Telegram messages in sync. */
export async function notifyStatusChangedFromAdmin(orderId: number) {
  await Promise.all([syncOrderMessages(orderId, 'Изменено в админ-панели'), notifyCustomerStatus(orderId)]);
}

/** The customer cancelled in the mini app → the staff card turns "cancelled" (buttons gone) and the group gets a heads-up. */
export async function notifyCancelledByCustomer(orderId: number, reason: string) {
  const at = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
  await syncOrderMessages(orderId, `Отменён клиентом, ${at}`);
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const chatId = order.staffChatId ?? (await getStaffChatId());
  if (!chatId) return;
  await bot.api.sendMessage(chatId, `❌ Клиент отменил заказ #${orderId}\nПричина: ${reason}`, {
    ...(order.staffMessageId && order.staffChatId === chatId
      ? { reply_parameters: { message_id: order.staffMessageId, allow_sending_without_reply: true } }
      : {}),
  });
}

const statusTextRu: Record<string, string> = {
  accepted: '✅ Ваш заказ #{id} принят.',
  cooking: '👨‍🍳 Заказ #{id} готовится.',
  ready: '🛍 Заказ #{id} готов, можно забирать.',
  delivering: '🚗 Заказ #{id} уже в пути.',
  completed: '🎉 Заказ #{id} завершён. Спасибо, приятного аппетита!',
  cancelled: '❌ Заказ #{id} отменён. Если это ошибка, позвоните нам.',
};
const statusTextUz: Record<string, string> = {
  accepted: '✅ #{id} buyurtmangiz qabul qilindi.',
  cooking: '👨‍🍳 #{id} buyurtma tayyorlanmoqda.',
  ready: '🛍 #{id} buyurtma tayyor, olib ketishingiz mumkin.',
  delivering: '🚗 #{id} buyurtma yo‘lda.',
  completed: '🎉 #{id} buyurtma yakunlandi. Rahmat, yoqimli ishtaha!',
  cancelled: '❌ #{id} buyurtma bekor qilindi. Agar bu xato bo‘lsa, bizga qo‘ng‘iroq qiling.',
};

/** Tells the customer about a status change in the bot chat. */
export async function notifyCustomerStatus(orderId: number) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { user: true } });
  const dict = order.user.language === 'uz' ? statusTextUz : statusTextRu;
  const template = dict[order.status];
  if (!template) return;
  await bot.api.sendMessage(order.user.telegramId, template.replace('{id}', String(order.id)));
}
