<script setup lang="ts">
import type { DishDto } from '@rt/shared';
import { useCartStore } from '@/stores/cart';
import { description, money, name } from '@/utils/format';
import { haptic } from '@/telegram';
import AppIcon from './AppIcon.vue';
import FavoriteButton from './FavoriteButton.vue';
import QuantityStepper from './QuantityStepper.vue';

const props = defineProps<{ dish: DishDto }>();
const cart = useCartStore();

function quickAdd() {
  if (!props.dish.isAvailable) return;
  haptic.light();
  cart.add(props.dish.id, 1);
}
function onStep(next: number) {
  if (next > cart.quantityOf(props.dish.id)) cart.add(props.dish.id, 1);
  else cart.decrementDish(props.dish.id);
}
</script>

<template>
  <RouterLink :to="{ name: 'dish', params: { id: String(dish.id) } }" class="card flex gap-3 p-2.5" :class="{ 'opacity-60': !dish.isAvailable }">
    <div class="bg-surface-2 relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-[14px]">
      <img v-if="dish.imageUrl" :src="dish.imageUrl" :alt="name(dish)" class="h-full w-full object-cover" loading="lazy" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex items-start justify-between gap-2">
        <h3 class="line-clamp-1 text-[14px] leading-snug font-semibold">{{ name(dish) }}</h3>
        <FavoriteButton :dish-id="dish.id" class="-mt-0.5 -mr-0.5 !bg-transparent !shadow-none" />
      </div>
      <p class="text-muted mt-0.5 line-clamp-2 text-[12px] leading-snug">
        {{ description(dish) || dish.weight }}
      </p>
      <span v-if="dish.pickupOnly" class="bg-accent-soft text-accent mt-1 w-fit rounded-md px-1.5 py-0.5 text-[10px] font-semibold">{{ $t('dish.pickupOnly') }}</span>
      <div class="mt-auto flex items-center justify-between pt-2">
        <span class="text-accent text-[13px] font-bold">{{ money(dish.price) }}</span>
        <div v-if="cart.quantityOf(dish.id) > 0" @click.stop.prevent>
          <QuantityStepper small :value="cart.quantityOf(dish.id)" @change="onStep" />
        </div>
        <button v-else type="button" class="btn btn-secondary btn-xs" :disabled="!dish.isAvailable" @click.stop.prevent="quickAdd">
          <AppIcon name="bag" :size="14" />
          {{ dish.isAvailable ? $t('common.toCart') : $t('dish.unavailable') }}
        </button>
      </div>
    </div>
  </RouterLink>
</template>
