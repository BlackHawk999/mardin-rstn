<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { OrderDto } from '@rt/shared';
import { STATUS_FLOW } from '@rt/shared';
import { api, ApiError } from '@/api/client';
import { useCartStore } from '@/stores/cart';
import { useCatalogStore } from '@/stores/catalog';
import { formatDate, money, name } from '@/utils/format';
import { haptic } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';
import PageHeader from '@/components/PageHeader.vue';

const props = defineProps<{ id: string }>();
const route = useRoute();
const router = useRouter();
const cart = useCartStore();
const catalog = useCatalogStore();

const order = ref<OrderDto | null>(null);
const error = ref(false);
const justPlaced = computed(() => route.query.placed === '1');
let timer: number | undefined;

const steps = computed(() => (order.value ? STATUS_FLOW[order.value.type] : []));
const currentIndex = computed(() => (order.value ? steps.value.indexOf(order.value.status) : -1));
const isFinal = computed(() => order.value?.status === 'completed' || order.value?.status === 'cancelled');

async function load() {
  try {
    order.value = await api.order(Number(props.id));
    error.value = false;
    if (isFinal.value && timer) window.clearInterval(timer);
  } catch {
    error.value = true;
  }
}

function repeat() {
  if (!order.value) return;
  for (const item of order.value.items) {
    if (item.dishId && catalog.dishById.get(item.dishId)?.isAvailable) cart.add(item.dishId, item.quantity, item.comment ?? '');
  }
  haptic.success();
  router.push({ name: 'cart' });
}

// Self-cancel: only while the restaurant has not accepted the order (the server checks this too).
const REASONS = ['changed_mind', 'mistake', 'too_long', 'other'] as const;
const cancelOpen = ref(false);
const cancelReason = ref<(typeof REASONS)[number]>('changed_mind');
const cancelling = ref(false);
const tooLate = ref(false);

function openCancel() {
  haptic.light();
  tooLate.value = false;
  cancelOpen.value = true;
}

async function confirmCancel() {
  if (!order.value || cancelling.value) return;
  cancelling.value = true;
  try {
    order.value = await api.cancelOrder(order.value.id, cancelReason.value);
    cancelOpen.value = false;
    haptic.success();
    if (timer) window.clearInterval(timer);
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      // The restaurant accepted it in the meantime: show the fresh status and suggest calling.
      tooLate.value = true;
      haptic.error();
      await load();
    } else {
      throw e;
    }
  } finally {
    cancelling.value = false;
  }
}

function itemImage(dishId: number | null) {
  return dishId ? catalog.dishById.get(dishId)?.imageUrl : null;
}

onMounted(() => {
  load();
  timer = window.setInterval(load, 15000); // status pushes also arrive via the bot chat
});
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <div class="page page--no-nav space-y-3">
    <PageHeader :title="order ? $t('order.title', { id: order.id }) : ''" :back="justPlaced ? '/' : '/orders'" />

    <p v-if="error" class="text-muted py-10 text-center text-sm">{{ $t('common.error') }}</p>
    <p v-else-if="!order" class="text-muted py-10 text-center text-sm">{{ $t('common.loading') }}</p>

    <template v-else>
      <div v-if="justPlaced" class="card p-5 text-center">
        <p class="text-4xl">🎉</p>
        <h2 class="mt-2 text-[18px] font-bold">{{ $t('order.placed') }}</h2>
        <p class="text-muted mt-1 text-[13px]">{{ $t('order.placedHint') }}</p>
      </div>

      <!-- Status -->
      <section class="card p-4">
        <div class="mb-3 flex items-center justify-between">
          <p class="font-bold" :class="order.status === 'cancelled' ? 'text-danger' : ''">{{ $t(`order.status.${order.status}`) }}</p>
          <span class="text-muted text-[12px]">{{ formatDate(order.createdAt) }}</span>
        </div>
        <template v-if="order.status !== 'cancelled'">
          <div class="flex items-center">
            <template v-for="(s, i) in steps" :key="s">
              <div v-if="i > 0" class="h-[3px] flex-1 rounded-full transition-colors" :class="i <= currentIndex ? 'bg-accent' : 'bg-surface-2'" />
              <div
                class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors"
                :class="i <= currentIndex ? 'bg-accent text-white' : 'bg-surface-2'"
              >
                <AppIcon v-if="i < currentIndex" name="check" :size="12" />
                <span v-else-if="i === currentIndex" class="h-2 w-2 rounded-full bg-white" />
              </div>
            </template>
          </div>
          <div class="mt-1.5 flex justify-between text-[10px]">
            <span v-for="(s, i) in steps" :key="s" :class="i <= currentIndex ? 'text-text font-semibold' : 'text-muted'">{{ $t(`order.steps.${s}`) }}</span>
          </div>
        </template>
      </section>

      <!-- Details -->
      <section class="card space-y-1.5 p-4 text-[13px]">
        <p class="flex justify-between"><span class="text-muted">{{ $t('cart.type') }}</span><span class="font-medium">{{ $t(order.type === 'delivery' ? 'cart.delivery' : 'cart.pickup') }}</span></p>
        <p v-if="order.addressText" class="flex justify-between gap-4"><span class="text-muted flex-shrink-0">{{ $t('cart.address') }}</span><span class="text-right font-medium">{{ order.addressText }}<span v-if="order.addressComment">, {{ order.addressComment }}</span></span></p>
        <p class="flex justify-between"><span class="text-muted">{{ $t('cart.payment') }}</span><span class="font-medium">{{ $t(order.paymentMethod === 'cash' ? 'cart.cash' : 'cart.transfer') }}</span></p>
        <p v-if="order.comment" class="flex justify-between gap-4"><span class="text-muted flex-shrink-0">{{ $t('cart.comment') }}</span><span class="text-right">{{ order.comment }}</span></p>
      </section>

      <!-- Items -->
      <section class="card p-4">
        <h2 class="mb-2 text-[15px] font-bold">{{ $t('order.items') }}</h2>
        <div v-for="item in order.items" :key="item.id" class="flex items-center gap-3 py-2">
          <div class="bg-surface-2 h-12 w-12 flex-shrink-0 overflow-hidden rounded-[10px]">
            <img v-if="itemImage(item.dishId)" :src="itemImage(item.dishId)!" class="h-full w-full object-cover" alt="" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[14px] font-medium">{{ name(item) }} <span class="text-muted">× {{ item.quantity }}</span></p>
            <p v-if="item.comment" class="text-muted text-[12px]">💬 {{ item.comment }}</p>
          </div>
          <span class="text-[14px] font-semibold whitespace-nowrap">{{ money(item.price * item.quantity) }}</span>
        </div>
        <div class="mt-2 space-y-1 border-t border-black/5 pt-2 text-[14px]">
          <div v-if="order.deliveryFee" class="flex justify-between"><span class="text-muted">{{ $t('cart.deliveryFee') }}</span><span>{{ money(order.deliveryFee) }}</span></div>
          <div v-else-if="order.type === 'delivery'" class="flex justify-between"><span class="text-muted">{{ $t('cart.deliveryFee') }}</span><span>{{ $t('cart.deliveryByAddress') }}</span></div>
          <div class="flex justify-between text-[16px] font-bold"><span>{{ $t('cart.total') }}</span><span>{{ money(order.total) }}</span></div>
        </div>
      </section>

      <!-- Cancel: confirmation with an optional reason -->
      <section v-if="cancelOpen && order.status === 'new'" class="card space-y-3 p-4">
        <div>
          <h2 class="text-[16px] font-bold">{{ $t('order.cancel.title') }}</h2>
          <p class="text-muted mt-0.5 text-[13px]">{{ $t('order.cancel.reasonHint') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="r in REASONS"
            :key="r"
            type="button"
            class="chip"
            :class="{ 'chip--active': cancelReason === r }"
            @click="haptic.selection(); cancelReason = r"
          >
            {{ $t(`order.cancel.reasons.${r}`) }}
          </button>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn btn-ghost flex-1" @click="cancelOpen = false">{{ $t('order.cancel.keep') }}</button>
          <button type="button" class="btn btn-danger flex-1" :disabled="cancelling" @click="confirmCancel">
            {{ cancelling ? $t('common.loading') : $t('order.cancel.confirm') }}
          </button>
        </div>
      </section>

      <div v-if="tooLate" class="rounded-2xl bg-amber-100 px-4 py-3 text-[13px] font-medium text-amber-900">
        {{ $t('order.cancel.tooLate') }}
      </div>

      <div class="space-y-2 pt-1">
        <button type="button" class="btn w-full" @click="repeat">{{ $t('order.repeat') }}</button>
        <a v-if="catalog.settings?.restaurantPhone" :href="`tel:${catalog.settings.restaurantPhone}`" class="btn btn-ghost w-full">
          <AppIcon name="phone" :size="18" /> {{ $t('order.callRestaurant') }}
        </a>
        <button v-if="order.status === 'new' && !cancelOpen" type="button" class="text-danger w-full py-2 text-[14px] font-semibold" @click="openCancel">
          {{ $t('order.cancel.button') }}
        </button>
      </div>
    </template>
  </div>
</template>
