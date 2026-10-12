<script setup lang="ts">
import { money } from '@/utils/format';

/**
 * A price, with the old one crossed out when there is a discount.
 * `stack` puts the old price on its own line below (narrow cards, rows next to a button), so numbers never collide;
 * `inline` puts it to the right (dish page, where there is room). Each number is kept on one line.
 */
withDefaults(defineProps<{ price: number; basePrice?: number; size?: 'sm' | 'md' | 'lg'; layout?: 'stack' | 'inline' }>(), {
  basePrice: 0,
  size: 'md',
  layout: 'stack',
});
</script>

<template>
  <div class="price-tag" :class="[`price-tag--${size}`, `price-tag--${layout}`, { 'price-tag--sale': basePrice > price }]">
    <span class="price-tag__now">{{ money(price) }}</span>
    <s v-if="basePrice > price" class="price-tag__was">{{ money(basePrice) }}</s>
  </div>
</template>

<style scoped>
.price-tag {
  display: flex;
  min-width: 0;
  line-height: 1.15;
}
.price-tag--stack {
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}
.price-tag--inline {
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 8px;
}
.price-tag__now,
.price-tag__was {
  white-space: nowrap;
}
.price-tag__now {
  color: var(--accent);
  font-weight: 700;
}
.price-tag--sale .price-tag__now {
  color: var(--sale);
}
.price-tag__was {
  color: var(--muted);
  font-weight: 500;
  text-decoration-thickness: 1px;
}
.price-tag--sm .price-tag__now {
  font-size: 12px;
}
.price-tag--sm .price-tag__was {
  font-size: 10.5px;
}
.price-tag--md .price-tag__now {
  font-size: 13px;
}
.price-tag--md .price-tag__was {
  font-size: 11px;
}
.price-tag--lg .price-tag__now {
  font-size: 22px;
}
.price-tag--lg .price-tag__was {
  font-size: 15px;
}
</style>
