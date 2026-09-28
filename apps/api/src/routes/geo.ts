import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../env.js';

interface GeoResult {
  text: string; // short: "Bunyodkor ko'chasi, 12"
  full: string; // "Toshkent, Chilonzor tumani, Bunyodkor ko'chasi, 12"
  lat: number;
  lng: number;
}

interface YandexGeoObject {
  name?: string;
  description?: string;
  Point?: { pos: string };
  metaDataProperty?: { GeocoderMetaData?: { text?: string; Address?: { formatted?: string } } };
}

const cache = new Map<string, GeoResult>();

async function yandexGeocode(query: string, lang: string): Promise<YandexGeoObject[]> {
  const url = new URL('https://geocode-maps.yandex.ru/1.x/');
  url.searchParams.set('apikey', env.YANDEX_MAPS_KEY ?? '');
  url.searchParams.set('geocode', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('results', '5');
  url.searchParams.set('lang', lang);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocoder ${res.status}`);
  const json = (await res.json()) as { response: { GeoObjectCollection: { featureMember: { GeoObject: YandexGeoObject }[] } } };
  return json.response.GeoObjectCollection.featureMember.map((m) => m.GeoObject);
}

function toResult(g: YandexGeoObject): GeoResult | null {
  const [lngStr, latStr] = (g.Point?.pos ?? '').split(' ');
  const lng = Number(lngStr);
  const lat = Number(latStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const meta = g.metaDataProperty?.GeocoderMetaData;
  return { text: g.name ?? meta?.text ?? '', full: meta?.Address?.formatted ?? meta?.text ?? g.name ?? '', lat, lng };
}

/** Yandex HTTP Geocoder proxy: keeps the key on the server and caches by rounded coordinates. */
export async function geoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/geo/reverse', async (req, reply) => {
    if (!env.YANDEX_MAPS_KEY) return reply.code(503).send({ error: 'geocoder_not_configured' });
    const q = z.object({ lat: z.coerce.number(), lng: z.coerce.number(), lang: z.enum(['ru', 'uz']).default('ru') }).parse(req.query);
    const key = `${q.lat.toFixed(5)},${q.lng.toFixed(5)},${q.lang}`;
    const hit = cache.get(key);
    if (hit) return hit;

    const objects = await yandexGeocode(`${q.lng},${q.lat}`, q.lang === 'uz' ? 'uz_UZ' : 'ru_RU');
    const first = objects[0] ? toResult(objects[0]) : null;
    if (!first) return reply.code(404).send({ error: 'not_found' });
    const result: GeoResult = { ...first, lat: q.lat, lng: q.lng };
    if (cache.size > 5000) cache.clear();
    cache.set(key, result);
    return result;
  });

  app.get('/geo/search', async (req, reply) => {
    if (!env.YANDEX_MAPS_KEY) return reply.code(503).send({ error: 'geocoder_not_configured' });
    const q = z.object({ q: z.string().trim().min(3).max(200), lang: z.enum(['ru', 'uz']).default('ru') }).parse(req.query);
    const objects = await yandexGeocode(q.q, q.lang === 'uz' ? 'uz_UZ' : 'ru_RU');
    return objects.map(toResult).filter((r): r is GeoResult => r !== null);
  });
}
