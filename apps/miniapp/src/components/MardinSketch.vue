<script setup lang="ts">
/**
 * Pencil-style line drawing of Mardin's old town: stone houses stepping up the hill, a domed mosque and a minaret.
 * Purely decorative background (profile page). Houses are filled with the page color so rows in front hide rows behind.
 */
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
  <svg class="mardin-sketch" viewBox="0 0 390 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
      <!-- Sun and birds -->
      <circle cx="342" cy="46" r="15" stroke-dasharray="2 3" />
      <path d="M186 40q4-4 8 0q4-4 8 0M214 56q3-3 6 0q3-3 6 0M300 74q3-3 6 0q3-3 6 0" />

      <!-- Hill line -->
      <path d="M0 196C50 182 90 160 130 140S220 112 262 108 350 118 390 132" stroke-dasharray="1 0" opacity="0.6" />

      <!-- Back row -->
      <g v-for="(h, i) in rows[0]" :key="'a' + i">
        <rect :x="h.x" :y="h.base - h.h" :width="h.w" :height="h.h" fill="var(--bg)" />
        <path :d="windows(h).join('')" />
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
          <path :d="windows(h).join('') + hatch(h, i)" />
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
</style>
