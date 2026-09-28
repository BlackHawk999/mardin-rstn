<script setup lang="ts">
import type { DishDto } from '@rt/shared';
import { useCartStore } from '@/stores/cart';
import { money, name } from '@/utils/format';
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
  <RouterLink :to="{ name: 'dish', params: { id: String(dish.id) } }" class="card flex flex-col p-2.5" :class="{ 'opacity-60': !dish.isAvailable }">
    <div class="bg-surface-2 relative aspect-square w-full overflow-hidden rounded-[14px]">
      <img v-if="dish.imageUrl" :src="dish.imageUrl" :alt="name(dish)" class="h-full w-full object-cover" loading="lazy" />
      <div class="absolute top-2 right-2">
        <FavoriteButton :dish-id="dish.id" />
      </div>
      <div class="absolute top-2 left-2 flex gap-1">
        <span v-if="dish.isNew" class="rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{{ $t('dish.new') }}</span>
        <span v-if="dish.isHit" class="bg-accent rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white">{{ $t('dish.hit') }}</span>
      </div>
      <span v-if="dish.pickupOnly && dish.isAvailable" class="text-accent absolute bottom-2 left-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold">{{ $t('dish.pickupOnly') }}</span>
      <span v-if="!dish.isAvailable" class="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[11px] font-semibold text-white">
        {{ $t('dish.unavailable') }}
      </span>
    </div>

    <div class="flex flex-1 flex-col px-1 pt-2.5">
      <h3 class="line-clamp-2 text-[14px] leading-tight font-semibold">{{ name(dish) }}</h3>
      <p class="text-accent mt-1 text-[13px] font-bold">{{ money(dish.price) }}</p>
      <div class="mt-2.5">
        <div v-if="cart.quantityOf(dish.id) > 0" class="flex justify-center" @click.stop.prevent>
          <QuantityStepper small :value="cart.quantityOf(dish.id)" @change="onStep" />
        </div>
        <button v-else type="button" class="btn btn-secondary btn-sm w-full" :disabled="!dish.isAvailable" @click.stop.prevent="quickAdd">
          <AppIcon name="bag" :size="15" />
          {{ $t('common.toCart') }}
        </button>
      </div>
    </div>
  </RouterLink>
</template>
