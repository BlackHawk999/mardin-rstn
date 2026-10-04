import { onBeforeUnmount, onMounted, ref, watchEffect, type Ref } from 'vue';
import type { WeatherCondition } from '@rt/shared';
import { api } from '@/api/client';

export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2440588;
const J2000 = 2451545;

/**
 * Sunrise and sunset for a date and place (the SunCalc algorithm, accurate to about a minute).
 * Returns null for polar day/night, which never happens at the restaurant's latitude.
 */
export function sunTimes(date: Date, lat: number, lng: number): { sunrise: number; sunset: number } | null {
  const lw = -lng * RAD;
  const phi = lat * RAD;
  const days = date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;
  const n = Math.round(days - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = RAD * (357.5291 + 0.98560028 * ds);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(L) * Math.sin(RAD * 23.4397));
  const cosW = (Math.sin(RAD * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosW < -1 || cosW > 1) return null;
  const w = Math.acos(cosW);
  const transit = (ds: number) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const jNoon = transit(ds);
  const jSet = transit(0.0009 + (w + lw) / (2 * Math.PI) + n);
  const toMs = (j: number) => (j + 0.5 - J1970) * DAY_MS;
  return { sunrise: toMs(jNoon - (jSet - jNoon)), sunset: toMs(jSet) };
}

/** Dawn and dusk last this long on each side of sunrise / sunset. */
const TWILIGHT_MS = 45 * 60_000;

export function skyPhase(now: Date, lat: number, lng: number): SkyPhase {
  const sun = sunTimes(now, lat, lng);
  if (!sun) return 'day';
  const t = now.valueOf();
  if (Math.abs(t - sun.sunrise) <= TWILIGHT_MS) return 'dawn';
  if (Math.abs(t - sun.sunset) <= TWILIGHT_MS) return 'dusk';
  return t > sun.sunrise && t < sun.sunset ? 'day' : 'night';
}

// Jizzakh, used until the restaurant's own coordinates arrive with the catalog.
const FALLBACK = { lat: 40.1, lng: 67.85 };

/** Current sky phase at the given place, re-checked every minute. `?sky=night` forces a phase in dev. */
export function useSkyPhase(coords: Ref<{ lat: number | null; lng: number | null } | null | undefined>) {
  const phase = ref<SkyPhase>('day');
  const forced = import.meta.env.DEV ? (new URLSearchParams(location.search).get('sky') as SkyPhase | null) : null;

  const update = () => {
    if (forced) return void (phase.value = forced);
    const lat = coords.value?.lat ?? FALLBACK.lat;
    const lng = coords.value?.lng ?? FALLBACK.lng;
    phase.value = skyPhase(new Date(), lat, lng);
  };
  watchEffect(update);
  const timer = window.setInterval(update, 60_000);
  onBeforeUnmount(() => window.clearInterval(timer));
  return phase;
}

/** True from sunset to sunrise (lanterns on), re-checked every minute. `?sky=night|dusk` forces dark in dev, `?sky=day|dawn` light. */
export function useIsDark(coords: Ref<{ lat: number | null; lng: number | null } | null | undefined>) {
  const dark = ref(false);
  const forced = import.meta.env.DEV ? (new URLSearchParams(location.search).get('sky') as SkyPhase | null) : null;

  const update = () => {
    if (forced) return void (dark.value = forced === 'night' || forced === 'dusk');
    const sun = sunTimes(new Date(), coords.value?.lat ?? FALLBACK.lat, coords.value?.lng ?? FALLBACK.lng);
    const t = Date.now();
    dark.value = sun ? t > sun.sunset || t < sun.sunrise : false;
  };
  watchEffect(update);
  const timer = window.setInterval(update, 60_000);
  onBeforeUnmount(() => window.clearInterval(timer));
  return dark;
}

/** Current weather at the restaurant (server caches it for 15 min), refreshed every 15 min. `?weather=rain` forces it in dev. */
export function useWeather() {
  const condition = ref<WeatherCondition>('clear');
  const forced = import.meta.env.DEV ? (new URLSearchParams(location.search).get('weather') as WeatherCondition | null) : null;

  const load = async () => {
    if (forced) return void (condition.value = forced);
    try {
      condition.value = (await api.weather()).condition;
    } catch {
      // decoration only: keep the last value
    }
  };
  onMounted(load);
  const timer = window.setInterval(load, 15 * 60_000);
  onBeforeUnmount(() => window.clearInterval(timer));
  return condition;
}
