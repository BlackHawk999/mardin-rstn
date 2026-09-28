import type { SettingsDto } from '@rt/shared';
import { prisma } from '../db.js';

const defaults: SettingsDto = {
  restaurantName: 'Restaurant',
  restaurantPhone: '',
  restaurantAddress: '',
  restaurantLat: null,
  restaurantLng: null,
  openTime: '10:00',
  closeTime: '23:00',
  deliveryFee: 0,
  deliveryByTaxi: false,
  minOrderAmount: 0,
  cartSuggestCategoryIds: [],
};

const parse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/** Public restaurant settings (sent to the mini app). Only known keys: internal ones never leak. */
export async function getSettings(): Promise<SettingsDto> {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.keys(defaults) } } });
  const result: Record<string, unknown> = { ...defaults };
  for (const row of rows) result[row.key] = parse(row.value);
  return result as unknown as SettingsDto;
}

/** Internal key/value storage (e.g. the staff Telegram chat), never exposed through getSettings(). */
export async function getInternal<T>(key: string): Promise<T | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row ? (parse(row.value) as T) : null;
}

export async function setInternal(key: string, value: unknown): Promise<void> {
  if (value === null || value === undefined) {
    await prisma.setting.deleteMany({ where: { key } });
    return;
  }
  const json = JSON.stringify(value);
  await prisma.setting.upsert({ where: { key }, update: { value: json }, create: { key, value: json } });
}

/** Checks whether the current local time falls in [openTime, closeTime). Supports overnight ranges (e.g. 18:00–02:00). */
export function isOpenNow(settings: SettingsDto, now = new Date()): boolean {
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const open = toMinutes(settings.openTime);
  const close = toMinutes(settings.closeTime);
  const cur = now.getHours() * 60 + now.getMinutes();
  if (open === close) return true;
  return open < close ? cur >= open && cur < close : cur >= open || cur < close;
}
