import type { WeatherCondition, WeatherDto } from '@rt/shared';
import { getSettings } from './settings.js';

// Jizzakh, if the restaurant's coordinates are not set yet.
const FALLBACK = { lat: 40.1, lng: 67.85 };
const TTL_MS = 15 * 60_000;

let cached: { at: number; value: WeatherDto } | null = null;

/** WMO weather code (Open-Meteo) → the few looks the sketch has. Thunderstorms count as rain, fog as clouds. */
function toCondition(code: number): WeatherCondition {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain';
  if (code === 3 || code === 45 || code === 48) return 'clouds';
  return 'clear';
}

/**
 * Current weather from Open-Meteo (free, no key), cached for 15 minutes so every visitor shares one request.
 * Decoration only: any failure falls back to "clear" (or the last known value).
 */
export async function getWeather(): Promise<WeatherDto> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  try {
    const s = await getSettings();
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(s.restaurantLat ?? FALLBACK.lat));
    url.searchParams.set('longitude', String(s.restaurantLng ?? FALLBACK.lng));
    url.searchParams.set('current', 'weather_code');
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const json = (await res.json()) as { current?: { weather_code?: number } };
    const value: WeatherDto = { condition: toCondition(json.current?.weather_code ?? 0) };
    cached = { at: Date.now(), value };
    return value;
  } catch {
    return cached?.value ?? { condition: 'clear' };
  }
}
