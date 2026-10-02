<script setup lang="ts">
/** Pencil-style still life matching MardinSketch: tea glass, cezve with a coffee cup, kebab skewer and pide. Decorative. */
</script>

<template>
  <svg class="dishes-sketch" viewBox="0 0 390 112" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
      <!-- Turkish tea: tulip glass on a saucer, steam -->
      <ellipse cx="60" cy="98" rx="26" ry="4.5" />
      <path d="M48 95C43 82 52 74 48 60h24c-4 14 5 22 0 35z" />
      <path d="M49 67h22" stroke-dasharray="2 2.5" />
      <path d="M55 52c-3-4 3-6 0-10M65 52c-3-4 3-6 0-10" />

      <!-- Cezve with a long handle -->
      <path d="M118 98q-6-16 6-26l2-8h24l2 8q12 10 6 26z" />
      <path d="M126 64l-6-3M124 82h28" />
      <path d="M152 70l36-14M154 75l36-14M188 56l2 5" />

      <!-- Coffee cup on a saucer -->
      <ellipse cx="212" cy="98" rx="20" ry="3.5" />
      <path d="M199 78h26l-3 17h-20z" />
      <path d="M225 81a5 5 0 0 1 0 9" />
      <path d="M208 70c-2-3 2-5 0-8M216 70c-2-3 2-5 0-8" />

      <!-- Kebab skewer -->
      <path d="M252 46h96" />
      <circle cx="353" cy="46" r="5" />
      <rect x="262" y="38" width="14" height="16" rx="5" />
      <rect x="279" y="39" width="9" height="14" rx="3" stroke-dasharray="3 2" />
      <rect x="291" y="38" width="14" height="16" rx="5" />
      <rect x="308" y="39" width="9" height="14" rx="3" stroke-dasharray="3 2" />
      <rect x="320" y="38" width="14" height="16" rx="5" />

      <!-- Pide: boat-shaped flatbread with filling -->
      <path d="M248 88q50-22 108 0q-54 20-108 0z" />
      <path d="M266 88q36-12 72 0q-36 11-72 0z" />
      <path d="M282 87h.5M296 85h.5M310 89h.5M322 86h.5M290 90h.5" stroke-width="2.4" />
    </g>
  </svg>
</template>

<style scoped>
.dishes-sketch {
  display: block;
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  color: var(--accent);
  opacity: 0.28;
}
</style>
