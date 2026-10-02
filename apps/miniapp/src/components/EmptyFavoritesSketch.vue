<script setup lang="ts">
/** Empty favorites: a pomegranate (a symbol of Mardin) with a heart-shaped window full of seeds. Decorative. */
const seeds = [
  [92, 86], [100, 84], [108, 86], [88, 94], [96, 93], [104, 93], [112, 94], [92, 101], [100, 100], [108, 101], [96, 108], [104, 108],
];
</script>

<template>
  <svg class="empty-art" viewBox="0 0 200 160" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <!-- Fruit -->
      <path d="M86 46C56 50 44 76 48 100c4 26 28 44 54 42 28-2 48-24 48-50 0-26-18-44-40-46" />
      <!-- Crown -->
      <path d="M86 46l-4-14 9 7 7-12 6 12 9-7-3 14" />
      <!-- Leaf -->
      <path d="M113 34q20-16 34-6-16 16-34 6z" />
      <path d="M115 33q14-4 30-5" stroke-width="0.9" />
      <!-- Shading strokes on the right -->
      <path d="M134 108l8-8M130 116l9-9M138 92l6-6" stroke-width="0.9" opacity="0.7" />

      <!-- Heart window with seeds -->
      <g class="empty-art__heart">
        <path d="M100 120C70 100 72 72 90 74c6 1 10 6 10 9 0-3 4-8 10-9 18-2 20 26-10 46z" fill="var(--bg)" />
        <ellipse v-for="([x, y], i) in seeds" :key="i" :cx="x" :cy="y" rx="2.6" ry="3.2" stroke-width="1" />
      </g>

      <!-- Loose seeds -->
      <ellipse cx="160" cy="138" rx="2.6" ry="3.2" stroke-width="1" />
      <ellipse cx="170" cy="132" rx="2.2" ry="2.8" stroke-width="1" />
    </g>
  </svg>
</template>

<style scoped>
.empty-art {
  width: 180px;
  height: auto;
  color: var(--accent);
  opacity: 0.55;
}
.empty-art__heart {
  transform-box: fill-box;
  transform-origin: 50% 60%;
  animation: seeds-beat 2.4s ease-in-out infinite;
}
@keyframes seeds-beat {
  0%,
  60%,
  100% {
    scale: 1;
  }
  20% {
    scale: 1.06;
  }
}
@media (prefers-reduced-motion: reduce) {
  .empty-art__heart {
    animation: none;
  }
}
</style>
