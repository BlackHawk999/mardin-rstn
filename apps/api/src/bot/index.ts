import { Bot, InlineKeyboard } from 'grammy';
import { env } from '../env.js';
import { upsertFromTelegram } from '../plugins/auth.js';
import { prisma } from '../db.js';
import { normalizePhone } from '../telegram/validateInitData.js';

export const bot = new Bot(env.BOT_TOKEN);

const t = {
  ru: {
    welcome: (name: string) => `Здравствуйте, ${name}! Нажмите кнопку ниже, чтобы открыть меню и сделать заказ.`,
    open: 'Открыть меню',
    noUrl: 'Мини-приложение ещё не настроено (MINIAPP_URL не задан).',
    phoneSaved: 'Спасибо, номер сохранён. Теперь можно оформлять заказ.',
    courierHello: 'Вы вошли как курьер. Новые заказы будут приходить сюда.',
  },
  uz: {
    welcome: (name: string) => `Assalomu alaykum, ${name}! Menyuni ochish va buyurtma berish uchun quyidagi tugmani bosing.`,
    open: 'Menyuni ochish',
    noUrl: "Mini-ilova hali sozlanmagan (MINIAPP_URL ko'rsatilmagan).",
    phoneSaved: 'Rahmat, raqam saqlandi. Endi buyurtma berishingiz mumkin.',
    courierHello: 'Siz kuryer sifatida kirdingiz. Yangi buyurtmalar shu yerga keladi.',
  },
} as const;

bot.command('start', async (ctx) => {
  if (!ctx.from) return;
  const user = await upsertFromTelegram(ctx.from);
  const lang = user.language === 'uz' ? 'uz' : 'ru';
  const msgs = t[lang];

  if (user.role === 'courier') {
    await ctx.reply(msgs.courierHello);
    return;
  }

  if (!env.MINIAPP_URL) {
    await ctx.reply(msgs.noUrl);
    return;
  }

  await ctx.reply(msgs.welcome(user.displayName), {
    reply_markup: new InlineKeyboard().webApp(msgs.open, env.MINIAPP_URL),
  });
});

/** Fallback: if the user shares a contact in the chat (not via the mini app), store it too. */
bot.on('message:contact', async (ctx) => {
  const contact = ctx.message.contact;
  if (!ctx.from || contact.user_id !== ctx.from.id) return;
  const user = await upsertFromTelegram(ctx.from);
  await prisma.user.update({ where: { id: user.id }, data: { phone: normalizePhone(contact.phone_number) } });
  await ctx.reply(t[user.language === 'uz' ? 'uz' : 'ru'].phoneSaved, { reply_markup: { remove_keyboard: true } });
});

bot.catch((err) => {
  console.error('Bot error:', err.error);
});

/** Registers commands and the persistent "menu" button that opens the mini app. */
export async function setupBot() {
  await bot.api.setMyCommands([{ command: 'start', description: 'Открыть меню / Menyuni ochish' }]);
  // Commands shown in group chats (the restaurant's staff group).
  await bot.api.setMyCommands(
    [
      { command: 'orders', description: 'Активные заказы' },
      { command: 'bind', description: 'Получать заказы в этот чат' },
      { command: 'unbind', description: 'Отключить этот чат' },
      { command: 'id', description: 'Показать ID чата' },
    ],
    { scope: { type: 'all_group_chats' } },
  );
  if (env.MINIAPP_URL) {
    await bot.api.setChatMenuButton({
      menu_button: { type: 'web_app', text: 'Меню', web_app: { url: env.MINIAPP_URL } },
    });
  }
}
