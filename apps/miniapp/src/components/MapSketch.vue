<script setup lang="ts">
/**
 * Addresses page: a folded paper map with a dashed route from a little house to a location pin. Decorative and alive:
 * the route "marches" toward the pin, the pin bounces with its shadow, the compass needle wavers.
 */
</script>

<template>
  <svg class="sketch-art" viewBox="0 0 300 136" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Three folded panels; the middle one is shaded -->
      <path d="M30 30l80-10v94l-80 10z" fill="var(--surface)" />
      <path d="M110 20l80 10v94l-80-10z" fill="var(--surface)" />
      <path d="M190 30l80-10v94l-80 10z" fill="var(--surface)" />
      <path d="M122 34l10 10M122 50l22 22M130 92l20 20M160 40l20 20M168 96l14 14" stroke-width="0.6" opacity="0.5" />

      <!-- Faint streets and a river -->
      <path d="M36 60l68-8M70 34v84M200 70l64-8M232 30v84" stroke-width="0.7" opacity="0.45" />
      <path d="M116 120q20-30 0-56t10-44" stroke-width="0.8" stroke-dasharray="1 3" opacity="0.6" />

      <!-- Little house at the start -->
      <path d="M52 100v-14h18v14z" fill="var(--bg)" />
      <path d="M49 87l12-10 12 10" />
      <path d="M58 100v-7h4v7" stroke-width="0.9" />

      <!-- Route marching toward the pin -->
      <path class="map__route" d="M72 92C104 108 118 62 150 70S204 98 226 72" stroke-dasharray="4 4" stroke-width="1.4" />

      <!-- Bouncing pin with its shadow -->
      <ellipse class="map__shadow" cx="230" cy="74" rx="6" ry="1.8" fill="currentColor" stroke="none" opacity="0.35" />
      <g class="map__pin">
        <path d="M230 72c-8-10-12-15-12-21a12 12 0 0 1 24 0c0 6-4 11-12 21z" fill="var(--bg)" />
        <circle cx="230" cy="51" r="4" />
      </g>

      <!-- Compass -->
      <circle cx="256" cy="100" r="10" fill="var(--bg)" stroke-width="1" />
      <g class="map__needle">
        <path d="M256 91l3 9-3 9-3-9z" stroke-width="0.9" />
        <path d="M256 91l3 9h-6z" fill="currentColor" stroke="none" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.sketch-art {
  display: block;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  color: var(--accent);
  opacity: 0.45;
}
.map__route {
  animation: route-march 1.2s linear infinite;
}
@keyframes route-march {
  to {
    stroke-dashoffset: -16;
  }
}
.map__pin {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: pin-bounce 1.8s cubic-bezier(0.3, 0, 0.4, 1) infinite;
}
@keyframes pin-bounce {
  0%,
  100% {
    translate: 0 0;
    scale: 1.06 0.94;
  }
  15% {
    scale: 1;
  }
  45% {
    translate: 0 -9px;
  }
  75% {
    translate: 0 0;
    scale: 1;
  }
}
.map__shadow {
  transform-box: fill-box;
  transform-origin: center;
  animation: pin-shadow 1.8s cubic-bezier(0.3, 0, 0.4, 1) infinite;
}
@keyframes pin-shadow {
  0%,
  75%,
  100% {
    scale: 1;
    opacity: 0.35;
  }
  45% {
    scale: 0.55;
    opacity: 0.15;
  }
}
.map__needle {
  transform-box: view-box;
  transform-origin: 256px 100px;
  animation: needle-waver 3.2s ease-in-out infinite;
}
@keyframes needle-waver {
  0%,
  100% {
    rotate: -14deg;
  }
  50% {
    rotate: 10deg;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sketch-art * {
    animation: none !important;
  }
}
</style>
