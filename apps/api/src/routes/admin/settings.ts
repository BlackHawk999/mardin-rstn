import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { getSettings } from '../../services/settings.js';
import { bot } from '../../bot/index.js';
import { getStaffChatId } from '../../bot/staff.js';

const settingsSchema = z.object({
  restaurantName: z.string().trim().min(1).max(60),
  restaurantPhone: z.string().trim().max(30),
  restaurantAddress: z.string().trim().max(200),
  restaurantLat: z.number().nullable(),
  restaurantLng: z.number().nullable(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  deliveryFee: z.number().int().min(0),
  deliveryByTaxi: z.boolean(),
  minOrderAmount: z.number().int().min(0),
  cartSuggestCategoryIds: z.array(z.number().int()).max(20),
});

export async function adminSettingsRoutes(app: FastifyInstance) {
  app.get('/settings', async () => getSettings());

  /** Telegram bot status for the settings page: bot username and which chat receives orders. */
  app.get('/bot', async () => {
    let botUsername: string | null = null;
    try {
      botUsername = bot.botInfo.username;
    } catch {
      /* bot not started (bad token / offline) */
    }
    const chatId = await getStaffChatId();
    let chatTitle: string | null = null;
    if (chatId) {
      try {
        const chat = await bot.api.getChat(chatId);
        chatTitle = 'title' in chat && chat.title ? chat.title : 'first_name' in chat ? (chat.first_name ?? null) : null;
      } catch {
        /* bot was removed from the chat */
      }
    }
    return { botUsername, staffChatConnected: Boolean(chatId), staffChatTitle: chatTitle };
  });

  app.put('/settings', async (req) => {
    const body = settingsSchema.partial().parse(req.body);
    await prisma.$transaction(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, update: { value: JSON.stringify(value) }, create: { key, value: JSON.stringify(value) } }),
      ),
    );
    return getSettings();
  });
}
