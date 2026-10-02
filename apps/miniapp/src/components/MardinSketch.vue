<script setup lang="ts">
/**
 * Pencil-style line drawing of Mardin's old town: stone houses stepping up the hill, a domed mosque and a minaret.
 * Purely decorative background (profile page). Houses are filled with the page color so rows in front hide rows behind.
 * The sky follows the real time of day (sun and birds, sunrise, sunset, moon and stars) and the real weather:
 * clouds hide the sky, rain and snow fall over the town, and windows glow warm at night and in bad weather.
 */
import { computed } from 'vue';
import type { WeatherCondition } from '@rt/shared';
import type { SkyPhase } from '@/utils/sky';

const props = withDefaults(defineProps<{ phase?: SkyPhase; weather?: WeatherCondition }>(), { phase: 'day', weather: 'clear' });

const overcast = computed(() => props.weather !== 'clear');
/** Lit windows: the cozy part. */
const glow = computed(() => props.phase === 'night' || props.weather === 'rain' || props.weather === 'snow');
const windowFill = computed(() => (glow.value ? '#f2b25c' : 'none'));
const skyWash = computed(() => {
  if (overcast.value) return props.phase === 'night' || props.phase === 'dusk' ? 'storm-night' : 'storm-day';
  return props.phase === 'day' ? null : props.phase;
});

type House = { x: number; base: number; w: number; h: number };

// Back rows first: later houses cover earlier ones.
const rows: House[][] = [
  [
    { x: 128, base: 134, w: 28, h: 22 },
    { x: 158, base: 132, w: 36, h: 26 },
    { x: 196, base: 136, w: 26, h: 30 },
    { x: 296, base: 134, w: 32, h: 24 },
    { x: 330, base: 138, w: 26, h: 20 },
  ],
  [
    { x: 38, base: 168, w: 30, h: 24 },
    { x: 70, base: 166, w: 36, h: 30 },
    { x: 118, base: 168, w: 30, h: 26 },
    { x: 150, base: 166, w: 36, h: 34 },
    { x: 188, base: 168, w: 32, h: 26 },
    { x: 282, base: 166, w: 34, h: 30 },
    { x: 318, base: 168, w: 32, h: 24 },
    { x: 352, base: 166, w: 30, h: 28 },
  ],
  [
    { x: 6, base: 204, w: 34, h: 30 },
    { x: 42, base: 204, w: 28, h: 38 },
    { x: 72, base: 204, w: 40, h: 26 },
    { x: 114, base: 204, w: 30, h: 44 },
    { x: 146, base: 204, w: 36, h: 32 },
    { x: 184, base: 204, w: 28, h: 40 },
    { x: 214, base: 204, w: 42, h: 30 },
    { x: 258, base: 204, w: 30, h: 36 },
    { x: 290, base: 204, w: 38, h: 28 },
    { x: 330, base: 204, w: 30, h: 40 },
    { x: 362, base: 204, w: 30, h: 30 },
  ],
];

/** Arched windows spread along the wall. */
function windows(h: House) {
  const count = h.w > 34 ? 2 : 1;
  const top = h.base - h.h + 8;
  return Array.from({ length: count }, (_, i) => {
    const x = h.x + (h.w / (count + 1)) * (i + 1) - 3;
    return `M${x} ${top + 9}v-6a3 3 0 0 1 6 0v6`;
  });
}

// Night sky: [x, y, size]; small ones are dots, bigger ones twinkle as four-point stars.
const stars = [
  [196, 22, 1], [226, 48, 2], [252, 14, 1], [288, 30, 2], [306, 64, 1], [318, 12, 1], [372, 70, 2], [380, 24, 1],
  [214, 80, 1], [240, 90, 1.5], [352, 92, 1], [268, 70, 1],
] as const;

// Sun rays as short strokes around (cx, cy), only the upper half (below the horizon is hidden by houses anyway).
function rays(cx: number, cy: number, r1: number, r2: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = Math.PI + (Math.PI * (i + 0.5)) / count;
    return `M${cx + r1 * Math.cos(a)} ${cy + r1 * Math.sin(a)}L${cx + r2 * Math.cos(a)} ${cy + r2 * Math.sin(a)}`;
  }).join('');
}

// Flying birds: start point, size, flight duration and phase offset (s). They cross the sky left to right.
const dayBirds = [
  { x: 150, y: 44, s: 1, dur: 26, delay: 0 },
  { x: 170, y: 58, s: 0.75, dur: 30, delay: -9 },
  { x: 130, y: 70, s: 0.8, dur: 34, delay: -18 },
];
const dawnBirds = [
  { x: 200, y: 56, s: 0.75, dur: 30, delay: -4 },
  { x: 220, y: 44, s: 0.75, dur: 34, delay: -16 },
];

// Rain and snow: columns of drops/flakes whose pattern repeats every PERIOD units vertically,
// so moving the whole layer down by exactly one period loops seamlessly.
const RAIN_PERIOD = 24;
const rain = (step: number, len: number, seed: number) =>
  Array.from({ length: Math.ceil(260 / step) }, (_, c) => {
    const x = 132 + c * step;
    const off = ((c * seed) % RAIN_PERIOD) - RAIN_PERIOD;
    let d = '';
    for (let y = off; y < 220; y += RAIN_PERIOD) d += `M${x} ${y}l-2 ${len}`;
    return d;
  }).join('');
const rainNear = rain(11, 9, 7);
const rainFar = rain(7, 5, 13);

const SNOW_PERIOD = 30;
const snow = (step: number, seed: number) =>
  Array.from({ length: Math.ceil(260 / step) }, (_, c) => {
    const x = 132 + c * step;
    const off = ((c * seed) % SNOW_PERIOD) - SNOW_PERIOD;
    const flakes: [number, number][] = [];
    for (let y = off; y < 220; y += SNOW_PERIOD) flakes.push([x + ((c * 5) % 7), y]);
    return flakes;
  }).flat();
const snowNear = snow(17, 11);
const snowFar = snow(11, 7);

/** A rounded snow cap along a flat roof. */
const cap = (h: House) => `M${h.x - 1} ${h.base - h.h}q${(h.w + 2) / 2} -6 ${h.w + 2} 0z`;

/** A few short diagonal strokes on the right side of some walls, like pencil shading. */
function hatch(h: House, i: number) {
  if (i % 3 !== 1) return '';
  const x0 = h.x + h.w - 9;
  const y0 = h.base - h.h + 6;
  return [0, 5, 10]
    .filter((d) => y0 + d + 8 < h.base)
    .map((d) => `M${x0} ${y0 + d + 6}l6 -6`)
    .join('');
}
</script>

<template>
  <svg class="mardin-sketch" :class="[`mardin-sketch--${phase}`, { 'mardin-sketch--overcast': overcast }]" viewBox="0 0 390 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient id="mardin-sky-dawn" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#f4b48a" stop-opacity="0.9" />
          <stop offset="0.7" stop-color="#f7d6c0" stop-opacity="0.3" />
          <stop offset="1" stop-color="#f7d6c0" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="mardin-sky-dusk" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#e8875a" stop-opacity="1" />
          <stop offset="0.5" stop-color="#d98a9a" stop-opacity="0.55" />
          <stop offset="1" stop-color="#a98bb5" stop-opacity="0.15" />
        </linearGradient>
        <linearGradient id="mardin-sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2f3b66" stop-opacity="0.9" />
          <stop offset="1" stop-color="#2f3b66" stop-opacity="0.05" />
        </linearGradient>
        <linearGradient id="mardin-sky-storm-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7d8794" stop-opacity="0.75" />
          <stop offset="1" stop-color="#7d8794" stop-opacity="0.05" />
        </linearGradient>
        <linearGradient id="mardin-sky-storm-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#262c40" stop-opacity="0.95" />
          <stop offset="1" stop-color="#262c40" stop-opacity="0.1" />
        </linearGradient>
      </defs>

      <!-- Sky wash (none on a clear day: the page itself is the sky) -->
      <rect v-if="skyWash" x="0" y="0" width="390" height="150" :fill="`url(#mardin-sky-${skyWash})`" stroke="none" />

      <!-- Bad weather: a bank of heavy clouds instead of sun / moon / stars -->
      <g v-if="overcast" class="mardin-sky__clouds">
        <path d="M168 40h70q2-14-12-16q-4-14-20-10q-12-12-26 0q-14-2-14 12q-12 0-12 14z" fill="var(--bg)" />
        <path d="M250 30h84q3-16-14-18q-5-15-24-10q-13-12-29 2q-15-1-15 13q-12 1-10 13z" fill="var(--bg)" />
        <path d="M318 62h68q2-12-10-14q-4-12-18-8q-11-10-23 1q-12-1-12 11q-9 0-5 10z" fill="var(--bg)" />
        <path d="M196 70h52q1-10-8-11q-3-9-14-6q-8-8-17 1q-10 0-9 9q-6 0-4 7z" fill="var(--bg)" />
      </g>

      <!-- Day: a slowly turning sun, drifting clouds and birds flying across -->
      <g v-else-if="phase === 'day'">
        <circle class="mardin-sky__sun" cx="342" cy="46" r="15" stroke-dasharray="2 3" />
        <path class="mardin-sky__cloud" d="M232 30h34q1-7-6-8q-2-7-10-5q-6-5-11 2q-7 0-7 11z" fill="var(--bg)" />
        <path class="mardin-sky__cloud mardin-sky__cloud--slow" d="M282 86h26q1-6-5-6q-2-5-8-4q-5-4-9 2q-5 0-4 8z" fill="var(--bg)" />
      </g>

      <!-- Dawn: a small sun rising behind the right-hand houses, thin rays (plus two early birds above) -->
      <g v-else-if="phase === 'dawn'" class="mardin-sky__rise">
        <circle cx="350" cy="110" r="14" fill="#f6c69b" fill-opacity="0.8" />
        <path :d="rays(350, 110, 20, 28, 9)" stroke-width="0.9" />
      </g>

      <!-- Dusk: a big sun sinking behind the roofs, long cloud streaks -->
      <g v-else-if="phase === 'dusk'" class="mardin-sky__set">
        <circle cx="300" cy="104" r="20" fill="#ef9b6c" fill-opacity="0.85" />
        <path :d="rays(300, 104, 26, 34, 11)" stroke-width="0.8" opacity="0.8" />
        <path d="M206 70h46M222 76h58M326 60h44M318 66h30" stroke-width="0.9" opacity="0.8" />
      </g>

      <!-- Night: crescent moon and stars -->
      <g v-else>
        <path d="M344 30a16 16 0 1 0 14 24a12 12 0 1 1 -14-24z" fill="#f3e3b5" fill-opacity="0.9" />
        <template v-for="([x, y, size], i) in stars" :key="i">
          <circle v-if="size === 1" :cx="x" :cy="y" r="0.9" fill="currentColor" stroke="none" />
          <path
            v-else
            class="mardin-sky__star"
            :style="{ animationDelay: `${-i * 0.7}s` }"
            :d="`M${x} ${y - size * 2}v${size * 4}M${x - size * 2} ${y}h${size * 4}`"
            stroke-width="0.9"
          />
        </template>
      </g>

      <!-- Birds flying across (day and dawn) -->
      <g v-if="!overcast && (phase === 'day' || phase === 'dawn')">
        <g v-for="(b, i) in phase === 'day' ? dayBirds : dawnBirds" :key="'b' + i" :transform="`translate(${b.x} ${b.y}) scale(${b.s})`">
          <g class="mardin-sky__bird" :style="{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }">
            <path class="mardin-sky__wings" :style="{ animationDelay: `${i * -0.23}s` }" d="M0 0q4-4 8 0q4-4 8 0" />
          </g>
        </g>
      </g>

      <!-- Hill line -->
      <path d="M0 196C50 182 90 160 130 140S220 112 262 108 350 118 390 132" stroke-dasharray="1 0" opacity="0.6" />

      <!-- Back row -->
      <g v-for="(h, i) in rows[0]" :key="'a' + i">
        <rect :x="h.x" :y="h.base - h.h" :width="h.w" :height="h.h" fill="var(--bg)" />
        <path :d="windows(h).join('')" :fill="windowFill" />
        <path v-if="weather === 'snow'" :d="cap(h)" fill="var(--surface)" />
      </g>

      <!-- Mosque: dome + minaret -->
      <g fill="var(--bg)">
        <path d="M216 138v-16h40v16" />
        <path d="M220 122a16 16 0 0 1 32 0" />
        <path d="M236 106v-6M233 98a3 3 0 0 0 6 0" fill="none" />
        <path d="M264 140V62h10v78" />
        <path d="M260 74h18v4h-18zM262 62l7-20 7 20" />
        <path d="M269 42v-8" fill="none" />
        <path d="M266 96v-6a3 3 0 0 1 6 0v6M266 120v-6a3 3 0 0 1 6 0v6" fill="none" />
      </g>

      <!-- Middle and front rows -->
      <g v-for="(row, r) in rows.slice(1)" :key="'r' + r">
        <g v-for="(h, i) in row" :key="i">
          <rect :x="h.x" :y="h.base - h.h" :width="h.w" :height="h.h" fill="var(--bg)" />
          <path :d="windows(h).join('')" :fill="windowFill" />
          <path :d="hatch(h, i)" />
          <path v-if="weather === 'snow'" :d="cap(h)" fill="var(--surface)" />
        </g>
      </g>

      <!-- Snow: a chimney with curling smoke on one of the front houses -->
      <g v-if="weather === 'snow'">
        <rect x="314" y="166" width="7" height="10" fill="var(--bg)" />
        <path class="mardin-sky__smoke" d="M317 162q-4-5 0-9q4-4 0-9" />
        <path class="mardin-sky__smoke mardin-sky__smoke--late" d="M318 162q-4-5 0-9q4-4 0-9" />
      </g>

      <!-- Rain over the town: two layers of streaks falling at different speeds -->
      <g v-if="weather === 'rain'" stroke-width="0.8">
        <path class="mardin-sky__rain mardin-sky__rain--far" :d="rainFar" opacity="0.5" />
        <path class="mardin-sky__rain" :d="rainNear" />
      </g>

      <!-- Snow over the town: big near flakes and small far ones, drifting sideways as they fall -->
      <g v-if="weather === 'snow'" fill="currentColor" stroke="none">
        <g class="mardin-sky__sway">
          <g class="mardin-sky__snow mardin-sky__snow--far" opacity="0.6">
            <circle v-for="([x, y], i) in snowFar" :key="'f' + i" :cx="x" :cy="y" r="0.9" />
          </g>
        </g>
        <g class="mardin-sky__sway mardin-sky__sway--alt">
          <g class="mardin-sky__snow">
            <circle v-for="([x, y], i) in snowNear" :key="'n' + i" :cx="x" :cy="y" r="1.6" />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.mardin-sketch {
  display: block;
  width: 100%;
  height: 100%;
  color: var(--accent);
  opacity: 0.22;
}
/* Colored skies need a bit more presence than the plain daytime line drawing to read at all. */
.mardin-sketch--dawn,
.mardin-sketch--dusk {
  opacity: 0.4;
}
.mardin-sketch--night,
.mardin-sketch--overcast {
  opacity: 0.38;
}
/* Weather: clouds drift, rain and snow fall (one pattern period per loop), chimney smoke curls up. */
.mardin-sky__clouds {
  animation: cloud-drift 26s ease-in-out infinite alternate;
}
.mardin-sky__rain {
  animation: rain-fall 0.55s linear infinite;
}
.mardin-sky__rain--far {
  animation-duration: 0.8s;
}
@keyframes rain-fall {
  to {
    translate: -5px 24px;
  }
}
.mardin-sky__snow {
  animation: snow-fall 7s linear infinite;
}
.mardin-sky__snow--far {
  animation-duration: 11s;
}
@keyframes snow-fall {
  to {
    translate: 0 30px;
  }
}
.mardin-sky__sway {
  animation: snow-sway 3.5s ease-in-out infinite alternate;
}
.mardin-sky__sway--alt {
  animation-duration: 4.5s;
  animation-direction: alternate-reverse;
}
@keyframes snow-sway {
  from {
    translate: -4px 0;
  }
  to {
    translate: 4px 0;
  }
}
.mardin-sky__smoke {
  animation: smoke-rise 4s ease-out infinite;
}
.mardin-sky__smoke--late {
  animation-delay: -2s;
}
@keyframes smoke-rise {
  from {
    translate: 0 0;
    opacity: 0.9;
  }
  to {
    translate: 3px -14px;
    opacity: 0;
  }
}
/* Day: the dashed sun outline turns slowly, clouds drift, birds fly across flapping their wings. */
.mardin-sky__sun {
  transform-box: fill-box;
  transform-origin: center;
  animation: sun-turn 40s linear infinite;
}
@keyframes sun-turn {
  to {
    rotate: 360deg;
  }
}
.mardin-sky__cloud {
  animation: cloud-drift 22s ease-in-out infinite alternate;
}
.mardin-sky__cloud--slow {
  animation-duration: 30s;
  animation-direction: alternate-reverse;
}
@keyframes cloud-drift {
  from {
    translate: -14px 0;
  }
  to {
    translate: 14px 0;
  }
}
.mardin-sky__bird {
  animation: bird-fly linear infinite;
}
@keyframes bird-fly {
  0% {
    translate: 0 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    translate: 120px -10px;
  }
  90% {
    opacity: 1;
  }
  100% {
    translate: 240px 4px;
    opacity: 0;
  }
}
.mardin-sky__wings {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: wings-flap 0.9s ease-in-out infinite;
}
@keyframes wings-flap {
  0%,
  100% {
    scale: 1 1;
  }
  50% {
    scale: 1 0.25;
  }
}
/* Sunrise drifts up a little, sunset down; stars twinkle. */
.mardin-sky__rise {
  animation: sky-rise 6s ease-out both;
}
.mardin-sky__set {
  animation: sky-set 6s ease-out both;
}
@keyframes sky-rise {
  from {
    translate: 0 8px;
  }
}
@keyframes sky-set {
  from {
    translate: 0 -8px;
  }
}
.mardin-sky__star {
  animation: star-twinkle 3s ease-in-out infinite;
}
@keyframes star-twinkle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mardin-sky__rise,
  .mardin-sky__set,
  .mardin-sky__star,
  .mardin-sky__sun,
  .mardin-sky__cloud,
  .mardin-sky__bird,
  .mardin-sky__wings,
  .mardin-sky__clouds,
  .mardin-sky__rain,
  .mardin-sky__snow,
  .mardin-sky__sway,
  .mardin-sky__smoke {
    animation: none;
  }
}
</style>
