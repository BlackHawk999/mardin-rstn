<script setup lang="ts">
/**
 * Menu header decoration: a corner of a spice bazaar (sacks with heaped spices, a scoop, a cinnamon jar,
 * a mortar and pestle) with a string of dried isot peppers hanging from the top. Decorative.
 */
const heapDots = [
  [30, 22], [36, 18], [42, 20], [48, 23], [34, 25], [44, 26],
  [80, 16], [86, 12], [92, 15], [98, 18], [84, 20], [94, 21],
];
const peppers = [10, 19, 28, 37];
</script>

<template>
  <svg class="spice-bazaar" viewBox="0 0 230 58" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <!-- Sack 1 with a scoop -->
      <path d="M24 57q-5-18 3-29l-3-3q18-5 36 0l-3 3q8 11 3 29z" fill="var(--bg)" />
      <path d="M27 28q15 3 30 0" stroke-width="0.7" />
      <path d="M26 26q16-16 32 0" fill="var(--bg)" />
      <path d="M56 22l12-12M66 8a4 3 30 1 1 4 4" />

      <!-- Sack 2, taller -->
      <path d="M72 57q-6-22 3-35l-3-3q22-5 42 0l-3 3q9 13 3 35z" fill="var(--bg)" />
      <path d="M75 22q18 3 36 0" stroke-width="0.7" />
      <path d="M74 20q19-18 38 0" fill="var(--bg)" />
      <path d="M78 40l6 4M96 36l5-3M88 48l5 2" stroke-width="0.6" opacity="0.7" />

      <circle v-for="([x, y], i) in heapDots" :key="i" :cx="x" :cy="y" r="0.9" fill="currentColor" stroke="none" />

      <!-- Cinnamon jar -->
      <path d="M126 57V34q0-4 4-4h16q4 0 4 4v23z" fill="var(--bg)" />
      <path d="M128 30v-4h20v4M131 26v-2h14v2" />
      <path d="M133 56V36M138 56V33M143 56V35" stroke-width="0.7" />

      <!-- Mortar and pestle -->
      <path d="M160 42q19 22 38 0z" fill="var(--bg)" />
      <path d="M170 56h18l-3-6h-12z" />
      <path d="M184 44l12-22" stroke-width="2.2" />

      <!-- Dried isot peppers on a string -->
      <path d="M216 0v44" stroke-width="0.7" />
      <g v-for="(y, i) in peppers" :key="'p' + i" :transform="`translate(216 ${y}) rotate(${i % 2 ? 18 : -18})`">
        <path d="M0 0q5 3 1 10q-1 2-2 0q-4-7 1-10z" fill="var(--bg)" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.spice-bazaar {
  display: block;
  width: 100%;
  height: 100%;
  color: var(--accent);
  opacity: 0.32;
}
</style>
