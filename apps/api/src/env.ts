import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BOT_TOKEN: z.string().min(10, 'BOT_TOKEN is required'),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  MINIAPP_URL: z.string().url().optional(),
  ADMIN_CHAT_ID: z.string().optional().transform((v) => (v ? v : undefined)),
  ALLOW_DEV_AUTH: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  // Admin panel login. Leave ADMIN_PASSWORD empty to disable password login.
  ADMIN_LOGIN: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().optional().transform((v) => (v ? v : undefined)),
  ADMIN_TOKEN_SECRET: z.string().optional().transform((v) => (v ? v : undefined)),
  // Public origin of the API for absolute upload URLs. Empty = relative /uploads/... (served through a proxy).
  PUBLIC_API_URL: z.string().optional().transform((v) => (v ? v.replace(/\/$/, '') : '')),
  // Yandex "JavaScript API and HTTP Geocoder" key, used server-side for reverse geocoding.
  YANDEX_MAPS_KEY: z.string().optional().transform((v) => (v ? v : undefined)),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
/** Dev auth is never allowed in production, regardless of the flag. */
export const devAuthEnabled = env.ALLOW_DEV_AUTH && env.NODE_ENV !== 'production';

/**
 * Dev login ("Authorization: dev <id>") is for the local browser / phone on the same Wi-Fi only.
 * Anything that came through Cloudflare (tunnel) or Vercel is public internet and must use real Telegram auth.
 */
export function devAuthAllowed(headers: Record<string, string | string[] | undefined>): boolean {
  if (!devAuthEnabled) return false;
  return !headers['cf-connecting-ip'] && !headers['cf-ray'] && !headers['x-vercel-id'];
}
