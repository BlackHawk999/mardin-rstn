<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { useCatalogStore } from '@/stores/catalog';
import { description, ingredients, money, name } from '@/utils/format';
import { haptic, hideBackButton, showBackButton } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';
import { canGoBack } from '@/composables/useKeepScroll';
import FavoriteButton from '@/components/FavoriteButton.vue';
import QuantityStepper from '@/components/QuantityStepper.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();
const cart = useCartStore();
const catalog = useCatalogStore();

const quantity = ref(1);
const comment = ref('');

const dish = computed(() => catalog.dishById.get(Number(props.id)) ?? null);
const total = computed(() => (dish.value ? dish.value.price * quantity.value : 0));

function goBack() {
  if (canGoBack()) router.back();
  else if (dish.value) router.replace({ name: 'menu', query: { category: String(dish.value.categoryId) } });
  else router.replace({ name: 'home' });
}

function addToCart() {
  if (!dish.value || !dish.value.isAvailable) return;
  cart.add(dish.value.id, quantity.value, comment.value);
  haptic.success();
  goBack();
}

onMounted(() => {
  catalog.load();
  showBackButton(goBack);
});
onBeforeUnmount(hideBackButton);
</script>

<template>
  <div class="page--bar-only">
    <p v-if="!dish && catalog.loading" class="text-muted py-20 text-center text-sm">{{ $t('common.loading') }}</p>
    <p v-else-if="!dish" class="text-muted py-20 text-center text-sm">{{ $t('common.notFound') }}</p>

    <template v-else>
      <!-- Hero -->
      <div class="bg-surface-2 relative h-[320px] overflow-hidden rounded-b-[28px]">
        <img v-if="dish.imageUrl" :src="dish.imageUrl" :alt="name(dish)" class="h-full w-full object-cover" />
        <div class="absolute inset-x-0 top-0 flex items-center justify-between p-4" :style="{ paddingTop: 'calc(16px + var(--safe-top))' }">
          <button type="button" class="icon-btn icon-btn--glass" @click="goBack"><AppIcon name="back" /></button>
          <FavoriteButton :dish-id="dish.id" size="md" class="icon-btn--glass" />
        </div>
      </div>

      <div class="space-y-4 px-4 pt-4">
        <div>
          <div class="flex items-start justify-between gap-3">
            <h1 class="text-[22px] leading-tight font-bold">{{ name(dish) }}</h1>
            <span v-if="dish.weight" class="text-muted mt-1 text-[13px] whitespace-nowrap">{{ dish.weight }}</span>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span v-if="dish.isHit" class="tag bg-accent-soft text-accent">{{ $t('dish.recommended') }}</span>
            <span v-if="dish.isNew" class="tag bg-emerald-50 text-emerald-700">{{ $t('dish.new') }}</span>
            <span v-if="!dish.isAvailable" class="tag bg-red-50 text-red-600">{{ $t('dish.unavailable') }}</span>
          </div>
          <p class="text-accent mt-3 text-[22px] font-bold">{{ money(dish.price) }}</p>
          <p v-if="dish.pickupOnly" class="bg-accent-soft text-accent mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-[13px]">
            <AppIcon name="bag" :size="16" class="mt-0.5 flex-shrink-0" />{{ $t('dish.pickupOnlyHint') }}
          </p>
        </div>

        <p v-if="description(dish)" class="text-[14px] leading-relaxed">{{ description(dish) }}</p>

        <section v-if="ingredients(dish).length">
          <h2 class="mb-2 text-[15px] font-bold">{{ $t('dish.ingredients') }}</h2>
          <div class="flex flex-wrap gap-2">
            <span v-for="ing in ingredients(dish)" :key="ing" class="tag">{{ ing }}</span>
          </div>
        </section>

        <section>
          <h2 class="mb-2 text-[15px] font-bold">{{ $t('dish.commentLabel') }}</h2>
          <textarea v-model="comment" class="input" rows="2" maxlength="200" :placeholder="$t('dish.commentPlaceholder')" />
        </section>
      </div>

      <div class="action-bar flex items-center gap-3">
        <QuantityStepper :value="quantity" :min="1" light @change="quantity = $event" />
        <button type="button" class="btn flex-1" :disabled="!dish.isAvailable" @click="addToCart">
          {{ dish.isAvailable ? $t('dish.addFor', { price: money(total) }) : $t('dish.unavailable') }}
        </button>
      </div>
    </template>
  </div>
</template>
