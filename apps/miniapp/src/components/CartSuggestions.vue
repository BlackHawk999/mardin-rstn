<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { api } from '@/api/client';
import { useCartStore } from '@/stores/cart';
import { useCatalogStore } from '@/stores/catalog';
import { money, name } from '@/utils/format';
import { haptic } from '@/telegram';
import AppIcon from './AppIcon.vue';

const MAX_SHOWN = 8;

const cart = useCartStore();
const catalog = useCatalogStore();

const suggestedIds = ref<number[]>([]);
const togetherCount = ref(0);

// Refetch when the set of dishes in the cart changes (not on quantity changes).
const cartKey = computed(() => [...new Set(cart.items.map((i) => i.dishId))].sort((a, b) => a - b).join(','));

let timer: number | undefined;
watch(
  cartKey,
  (key) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(async () => {
      try {
        const res = await api.recommendations(key ? key.split(',').map(Number) : []);
        suggestedIds.value = res.ids;
        togetherCount.value = res.togetherCount;
      } catch {
        /* keep the previous list */
      }
    }, 250);
  },
  { immediate: true },
);

const inCart = computed(() => new Set(cart.items.map((i) => i.dishId)));

const suggestions = computed(() =>
  suggestedIds.value
    .map((id) => catalog.dishById.get(id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .filter((d) => d.isAvailable && !inCart.value.has(d.id) && !(cart.type === 'delivery' && d.pickupOnly))
    .slice(0, MAX_SHOWN),
);

function add(id: number) {
  haptic.light();
  cart.add(id, 1);
}
</script>

<template>
  <section v-if="suggestions.length" class="-mx-4">
    <h2 class="mb-2 px-4 text-[15px] font-bold">{{ togetherCount > 0 ? $t('cart.suggestTogether') : $t('cart.suggestTitle') }}</h2>
    <TransitionGroup tag="div" name="suggest" class="no-scrollbar relative flex gap-2.5 overflow-x-auto px-4 pb-1">
      <RouterLink
        v-for="d in suggestions"
        :key="d.id"
        :to="{ name: 'dish', params: { id: String(d.id) } }"
        class="card flex w-[132px] flex-shrink-0 flex-col p-2"
      >
        <div class="bg-surface-2 relative aspect-square w-full overflow-hidden rounded-[12px]">
          <img v-if="d.imageUrl" :src="d.imageUrl" :alt="name(d)" class="h-full w-full object-cover" loading="lazy" />
          <button
            type="button"
            class="bg-accent absolute right-1.5 bottom-1.5 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md transition-transform active:scale-90"
            :aria-label="$t('common.toCart')"
            @click.stop.prevent="add(d.id)"
          >
            <AppIcon name="plus" :size="16" />
          </button>
        </div>
        <p class="mt-2 line-clamp-2 text-[12px] leading-tight font-semibold">{{ name(d) }}</p>
        <p class="text-accent mt-auto pt-1 text-[12px] font-bold">{{ money(d.price) }}</p>
      </RouterLink>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.suggest-leave-active {
  transition: opacity 0.2s, transform 0.2s;
  position: absolute;
}
.suggest-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.suggest-move {
  transition: transform 0.25s ease;
}
</style>
