<script setup lang="ts">
/** "−15%" pill for dish photos. Renders nothing without a discount. */
defineProps<{ percent: number }>();
</script>

<template>
  <span v-if="percent > 0" class="discount-badge">−{{ percent }}%</span>
</template>

<style scoped>
.discount-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--sale);
  color: #fff;
  font-size: 10.5px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: 0 2px 6px -2px color-mix(in srgb, var(--sale) 70%, transparent);
}
</style>
