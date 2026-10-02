<script setup lang="ts">
/** Empty cart: a copper tray with its cloche lifted and floating above: nothing served yet. Decorative. */
</script>

<template>
  <svg class="empty-art" viewBox="0 0 200 150" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <!-- Tray with an engraved inner ring -->
      <ellipse cx="100" cy="124" rx="72" ry="13" />
      <ellipse cx="100" cy="122" rx="58" ry="8" stroke-dasharray="3 3" opacity="0.7" />
      <path d="M28 124v4c0 7 32 13 72 13s72-6 72-13v-4" />

      <!-- Lift traces -->
      <path d="M62 104q38-8 76 0" stroke-dasharray="2 4" opacity="0.6" />

      <!-- Floating cloche -->
      <g class="empty-art__float">
        <path d="M48 92a52 42 0 0 1 104 0z" fill="var(--bg)" />
        <path d="M42 92h116" />
        <path d="M68 70a36 30 0 0 1 22-18" opacity="0.7" />
        <circle cx="100" cy="45" r="5" fill="var(--bg)" />
      </g>

      <!-- Sparkles -->
      <path d="M34 46v10M29 51h10M166 30v8M162 34h8M172 78v6M169 81h6" stroke-width="1.1" />
    </g>
  </svg>
</template>

<style scoped>
.empty-art {
  width: 190px;
  height: auto;
  color: var(--accent);
  opacity: 0.55;
}
.empty-art__float {
  animation: cloche-float 3.2s ease-in-out infinite;
}
@keyframes cloche-float {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -5px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .empty-art__float {
    animation: none;
  }
}
</style>
