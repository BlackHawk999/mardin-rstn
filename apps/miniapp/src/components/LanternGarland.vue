<script setup lang="ts">
/**
 * Home header decoration: a string of Ottoman mosaic lanterns sagging across the top of the screen.
 * The middle stays empty for the logo, the right end for the search button. Lanterns sway gently (disabled with prefers-reduced-motion).
 */
const W = 390;
const sag = (x: number) => 2 + 20 * (1 - ((x - W / 2) / (W / 2)) ** 2);

// Positions avoid the centered logo (~x 120-255) and the search button on the right (~x 315+).
const lanterns = [
  { x: 20, drop: 6, size: 0.85, delay: 0 },
  { x: 56, drop: 14, size: 1, delay: -1.6 },
  { x: 94, drop: 3, size: 0.72, delay: -3.1 },
  { x: 274, drop: 3, size: 0.72, delay: -0.8 },
  { x: 300, drop: 12, size: 0.9, delay: -2.4 },
].map((l) => ({ ...l, top: sag(l.x) }));

const garland = `M0 ${sag(0)}Q${W / 2} ${2 * sag(W / 2) - sag(0)} ${W} ${sag(W)}`;
</script>

<template>
  <svg class="lantern-garland" :viewBox="`0 0 ${W} 72`" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path :d="garland" />
      <!-- Outer group places the lamp; the inner one sways around its hanging point (local 0,0). -->
      <g v-for="(l, i) in lanterns" :key="i" :transform="`translate(${l.x} ${l.top}) scale(${l.size})`">
        <g class="lantern-garland__lamp" :style="{ animationDelay: `${l.delay}s` }">
          <!-- string, cap, onion-shaped body with mosaic lines, finial and tassel -->
          <path :d="`M0 0v${l.drop}`" />
          <g :transform="`translate(0 ${l.drop})`">
            <path d="M-4 6q4-7 8 0z" fill="var(--bg)" />
            <path d="M-5 6C-12 12-12 23-3 29h6c9-6 9-17 2-23z" fill="var(--bg)" />
            <path d="M0 6v23M-3 7c-4 7-4 15 0 22M3 7c4 7 4 15 0 22" stroke-width="0.7" />
            <path d="M0 13l3 4-3 4-3-4z" stroke-width="0.7" />
            <path d="M0 29v4M-1.5 33h3M-1.5 34v5M0 34v6M1.5 34v5" stroke-width="0.7" />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.lantern-garland {
  display: block;
  width: 100%;
  height: 100%;
  color: var(--accent);
  opacity: 0.3;
}
.lantern-garland__lamp {
  transform-origin: 0 0;
  animation: lantern-sway 5s ease-in-out infinite;
}
@keyframes lantern-sway {
  0%,
  100% {
    rotate: -4deg;
  }
  50% {
    rotate: 4deg;
  }
}
@media (prefers-reduced-motion: reduce) {
  .lantern-garland__lamp {
    animation: none;
  }
}
</style>
