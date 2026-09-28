import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface ParsedInitData {
  user?: TelegramUser;
  auth_date: number;
  query_id?: string;
  start_param?: string;
  raw: Record<string, string>;
}

const MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Verifies the HMAC signature Telegram puts on Mini App `initData`
 * (and on the payload returned by `requestContact`, which uses the same scheme).
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramSignature(data: string, botToken: string): Record<string, string> | null {
  const params = new URLSearchParams(data);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return Object.fromEntries(params.entries());
}

export function parseInitData(initData: string, botToken: string): ParsedInitData | null {
  const raw = verifyTelegramSignature(initData, botToken);
  if (!raw) return null;

  const authDate = Number(raw.auth_date);
  if (!Number.isFinite(authDate)) return null;
  if (Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  let user: TelegramUser | undefined;
  if (raw.user) {
    try {
      user = JSON.parse(raw.user) as TelegramUser;
    } catch {
      return null;
    }
  }

  return { user, auth_date: authDate, query_id: raw.query_id, start_param: raw.start_param, raw };
}

/** Payload of `WebApp.requestContact` callback (`response` field), signed by Telegram. */
export function parseContactResponse(response: string, botToken: string): { phone: string; userId: number } | null {
  const raw = verifyTelegramSignature(response, botToken);
  if (!raw?.contact) return null;
  try {
    const contact = JSON.parse(raw.contact) as { phone_number: string; user_id: number };
    if (!contact.phone_number) return null;
    return { phone: normalizePhone(contact.phone_number), userId: contact.user_id };
  } catch {
    return null;
  }
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `+${digits}`;
}
