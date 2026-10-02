<script setup lang="ts">
/**
 * Orders page: a courier on a scooter with a thermal food box, riding along a road. Decorative and alive:
 * wheels spin, road marks and roadside trees stream past (two speeds, for depth), the scooter idles with a slight bob
 * and steam rises from the hot box.
 */
// Road dashes: one pattern period (dash + gap) = 24, drawn a period wider than the view so the loop is seamless.
const dashes = Array.from({ length: 15 }, (_, i) => `M${i * 24 - 24} 110h12`).join('');
// Roadside trees, one every 100 units.
const trees = [-100, 0, 100, 200, 300];
</script>

<template>
  <svg class="sketch-art" viewBox="0 0 300 122" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Background: trees drifting past slowly -->
      <g class="courier__trees" opacity="0.55" stroke-width="1">
        <g v-for="x in trees" :key="x" :transform="`translate(${x} 0)`">
          <circle cx="40" cy="62" r="11" />
          <path d="M40 73v27M36 80l4 4 4-6" />
        </g>
      </g>

      <!-- Road edge and moving centre marks -->
      <path d="M0 100h300" />
      <path class="courier__road" :d="dashes" stroke-width="1.6" />

      <!-- Speed lines behind the scooter -->
      <path class="courier__speed" d="M84 58h18M78 70h22M88 82h14" stroke-width="1" />

      <!-- Scooter + rider idle bob -->
      <g class="courier__ride">
        <!-- Wheels with spinning spokes -->
        <circle cx="130" cy="90" r="10" fill="var(--bg)" />
        <circle cx="194" cy="90" r="10" fill="var(--bg)" />
        <path class="courier__spokes" d="M130 82v16M122 90h16" stroke-width="0.9" />
        <path class="courier__spokes" d="M194 82v16M186 90h16" stroke-width="0.9" />

        <!-- Body: rear cowl, deck, steering column, front fender, headlight -->
        <path d="M118 86q2-18 22-18h14q4 0 4 6v14H120z" fill="var(--bg)" />
        <path d="M158 88h22" />
        <path d="M180 88l8-32M182 54h14" />
        <path d="M183 84a11 11 0 0 1 22 0" />
        <circle cx="192" cy="61" r="3" />

        <!-- Rider -->
        <circle cx="166" cy="34" r="6.5" fill="var(--bg)" />
        <path d="M160 31a7 7 0 0 1 13 0" stroke-width="2" />
        <path d="M152 68l11-27M161 48l22 7M154 68l15 11 8 9" />

        <!-- Thermal food box with steam -->
        <rect x="116" y="44" width="28" height="23" rx="2.5" fill="var(--bg)" />
        <path d="M122 55l4-5 4 5 4-5 4 5" stroke-width="0.9" />
        <path class="courier__steam" d="M124 40q-3-4 0-7q3-4 0-7" stroke-width="0.9" />
        <path class="courier__steam courier__steam--late" d="M134 40q-3-4 0-7q3-4 0-7" stroke-width="0.9" />
      </g>

      <!-- Exhaust puffs -->
      <circle class="courier__puff" cx="114" cy="88" r="2.4" />
      <circle class="courier__puff courier__puff--late" cx="114" cy="88" r="1.8" />
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
.courier__road {
  animation: road-move 0.5s linear infinite;
}
@keyframes road-move {
  to {
    translate: -24px 0;
  }
}
.courier__trees {
  animation: trees-move 4s linear infinite;
}
@keyframes trees-move {
  to {
    translate: -100px 0;
  }
}
.courier__spokes {
  transform-box: fill-box;
  transform-origin: center;
  animation: wheel-spin 0.45s linear infinite;
}
@keyframes wheel-spin {
  to {
    rotate: 360deg;
  }
}
.courier__ride {
  animation: ride-bob 0.35s ease-in-out infinite alternate;
}
@keyframes ride-bob {
  to {
    translate: 0 -1.2px;
  }
}
.courier__speed {
  animation: speed-flicker 0.7s ease-in-out infinite alternate;
}
@keyframes speed-flicker {
  from {
    opacity: 0.2;
    translate: 4px 0;
  }
  to {
    opacity: 0.9;
    translate: -4px 0;
  }
}
.courier__steam {
  animation: box-steam 2.6s ease-out infinite;
}
.courier__steam--late {
  animation-delay: -1.3s;
}
@keyframes box-steam {
  from {
    translate: 0 4px;
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  to {
    translate: -3px -6px;
    opacity: 0;
  }
}
.courier__puff {
  animation: exhaust 1.2s ease-out infinite;
}
.courier__puff--late {
  animation-delay: -0.6s;
}
@keyframes exhaust {
  from {
    translate: 0 0;
    opacity: 0.8;
  }
  to {
    translate: -16px -4px;
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sketch-art * {
    animation: none !important;
  }
}
</style>
