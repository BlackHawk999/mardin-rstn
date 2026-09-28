<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { AddressDto } from '@rt/shared';
import { api, ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useCatalogStore } from '@/stores/catalog';
import { money, name } from '@/utils/format';
import { haptic, showAlert } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';
import PageHeader from '@/components/PageHeader.vue';
import QuantityStepper from '@/components/QuantityStepper.vue';
import EmptyState from '@/components/EmptyState.vue';
import CartSuggestions from '@/components/CartSuggestions.vue';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const cart = useCartStore();
const catalog = useCatalogStore();

const hasMap = Boolean(import.meta.env.VITE_YANDEX_MAPS_KEY);
const addresses = ref<AddressDto[]>([]);
const submitting = ref(false);
const editingKey = ref<string | null>(null);
const editingComment = ref('');

const pickupOnlyKeys = computed(() => cart.items.filter((i) => catalog.dishById.get(i.dishId)?.pickupOnly).map((i) => i.key));
const pickupConflict = computed(() => cart.type === 'delivery' && pickupOnlyKeys.value.length > 0);

function removePickupOnly() {
  for (const key of pickupOnlyKeys.value) cart.remove(key);
}

/** First unmet condition, shown above the disabled order button so the customer knows what to fix. */
const blocker = computed<string | null>(() => {
  if (cart.items.length === 0) return null;
  if (!catalog.isOpen) return t('cart.closed');
  if (!auth.hasPhone) return t('cart.phoneRequired');
  if (pickupConflict.value) return t('cart.hotDrinksBlock');
  if (!cart.meetsMinimum && catalog.settings) return t('cart.minOrder', { amount: money(catalog.settings.minOrderAmount) });
  if (cart.type === 'delivery' && cart.addressId === null) return t('cart.addressRequired');
  return null;
});

const canSubmit = computed(() => cart.items.length > 0 && blocker.value === null);

async function loadAddresses() {
  try {
    addresses.value = await api.addresses();
    if (cart.addressId === null || !addresses.value.some((a) => a.id === cart.addressId)) {
      cart.addressId = addresses.value.find((a) => a.isDefault)?.id ?? addresses.value[0]?.id ?? null;
    }
  } catch {
    /* offline: cart is still visible */
  }
}

function startEditComment(key: string, current: string) {
  editingKey.value = key;
  editingComment.value = current;
}
function saveComment() {
  if (editingKey.value) cart.updateComment(editingKey.value, editingComment.value);
  editingKey.value = null;
}

async function submit() {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  try {
    const order = await api.createOrder({
      type: cart.type,
      paymentMethod: cart.paymentMethod,
      addressId: cart.type === 'delivery' ? (cart.addressId ?? undefined) : undefined,
      comment: cart.comment || undefined,
      items: cart.items.map((i) => ({ dishId: i.dishId, quantity: i.quantity, comment: i.comment || undefined })),
    });
    haptic.success();
    cart.clear();
    router.replace({ name: 'order', params: { id: String(order.id) }, query: { placed: '1' } });
  } catch (e) {
    haptic.error();
    if (e instanceof ApiError) {
      if (e.code === 'dish_unavailable') {
        await catalog.load(true);
        cart.pruneUnavailable();
      }
      showAlert(t(`errors.${e.code}`, t('common.error')));
    } else {
      showAlert(t('errors.network'));
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(loadAddresses);
onActivated(loadAddresses);
</script>

<template>
  <div class="page" :class="{ 'page--bar': cart.items.length > 0 }">
    <PageHeader :title="$t('cart.title')" />

    <EmptyState v-if="cart.items.length === 0" icon="🛒" :text="$t('cart.empty')" :action-label="$t('cart.goToMenu')" @action="router.push({ name: 'menu' })" />

    <div v-else class="space-y-3">
      <div v-if="!catalog.isOpen" class="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900">{{ $t('cart.closed') }}</div>

      <div v-if="!auth.hasPhone" class="card space-y-2 p-4">
        <p class="text-sm">{{ $t('cart.phoneRequired') }}</p>
        <button type="button" class="btn w-full" @click="auth.sharePhone()">{{ $t('cart.sharePhone') }}</button>
      </div>

      <!-- Items -->
      <div v-for="item in cart.items" :key="item.key" class="card flex gap-3 p-2.5">
        <div class="bg-surface-2 h-[84px] w-[84px] flex-shrink-0 overflow-hidden rounded-[14px]">
          <img v-if="catalog.dishById.get(item.dishId)?.imageUrl" :src="catalog.dishById.get(item.dishId)!.imageUrl!" class="h-full w-full object-cover" alt="" />
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex items-start justify-between gap-2">
            <p class="line-clamp-1 text-[14px] font-semibold">{{ catalog.dishById.get(item.dishId) ? name(catalog.dishById.get(item.dishId)!) : '—' }}</p>
            <button type="button" class="text-muted -mt-0.5 -mr-1 p-1" @click="cart.remove(item.key)"><AppIcon name="trash" :size="18" /></button>
          </div>
          <p class="text-accent text-[13px] font-bold">{{ money(catalog.dishById.get(item.dishId)?.price ?? 0) }}</p>
          <span
            v-if="catalog.dishById.get(item.dishId)?.pickupOnly"
            class="mt-0.5 w-fit rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            :class="cart.type === 'delivery' ? 'text-danger bg-red-50' : 'bg-accent-soft text-accent'"
          >{{ $t('dish.pickupOnly') }}</span>

          <div v-if="editingKey === item.key" class="mt-1.5 flex gap-2">
            <input v-model="editingComment" class="input !h-8 !rounded-lg text-[13px]" maxlength="200" :placeholder="$t('dish.commentPlaceholder')" @keyup.enter="saveComment" />
            <button type="button" class="btn btn-xs" @click="saveComment">{{ $t('common.save') }}</button>
          </div>
          <button v-else type="button" class="mt-1 block text-left text-[12px]" @click="startEditComment(item.key, item.comment)">
            <span v-if="item.comment" class="text-text">💬 {{ item.comment }}</span>
            <span v-else class="text-muted">+ {{ $t('dish.commentLabel') }}</span>
          </button>

          <div class="mt-auto flex items-center justify-between pt-1.5">
            <QuantityStepper small :value="item.quantity" @change="cart.setQuantity(item.key, $event)" />
            <span class="text-[14px] font-bold">{{ money((catalog.dishById.get(item.dishId)?.price ?? 0) * item.quantity) }}</span>
          </div>
        </div>
      </div>

      <!-- Upsell: "ordered together" + add-ons -->
      <CartSuggestions />

      <!-- Hot drinks in a delivery order -->
      <div v-if="pickupConflict" class="card space-y-3 border border-red-100 p-4">
        <p class="text-[13px] leading-snug">{{ $t('cart.pickupOnlyWarning') }}</p>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm flex-1" @click="cart.type = 'pickup'">{{ $t('cart.switchToPickup') }}</button>
          <button type="button" class="btn btn-ghost btn-sm flex-1" @click="removePickupOnly">{{ $t('cart.removePickupOnly') }}</button>
        </div>
      </div>

      <!-- Delivery type + address -->
      <section class="card p-4">
        <h2 class="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">{{ $t('cart.type') }}</h2>
        <div class="bg-surface-2 flex rounded-xl p-1 text-[13px] font-semibold">
          <button type="button" class="flex-1 rounded-lg py-2 transition-colors" :class="cart.type === 'delivery' ? 'bg-surface shadow-sm' : 'text-muted'" @click="cart.type = 'delivery'">
            {{ $t('cart.delivery') }}
          </button>
          <button type="button" class="flex-1 rounded-lg py-2 transition-colors" :class="cart.type === 'pickup' ? 'bg-surface shadow-sm' : 'text-muted'" @click="cart.type = 'pickup'">
            {{ $t('cart.pickup') }}
          </button>
        </div>

        <div v-if="cart.type === 'delivery'" class="mt-3 space-y-2">
          <h3 class="text-[14px] font-semibold">{{ $t('cart.address') }}</h3>
          <p v-if="addresses.length === 0" class="text-muted rounded-xl border border-dashed border-black/15 px-3 py-2.5 text-[13px]">
            {{ $t('cart.noAddressYet') }}
          </p>
          <button
            v-for="a in addresses"
            :key="a.id"
            type="button"
            class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors"
            :class="cart.addressId === a.id ? 'border-accent bg-accent-soft/40' : 'border-black/5'"
            @click="cart.addressId = a.id"
          >
            <span class="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2" :class="cart.addressId === a.id ? 'border-accent' : 'border-black/20'">
              <span v-if="cart.addressId === a.id" class="bg-accent h-2 w-2 rounded-full" />
            </span>
            <span class="min-w-0">
              <span class="block text-[14px] font-medium">{{ a.label || a.text }}</span>
              <span class="text-muted block text-[12px]">{{ a.label ? a.text : '' }}{{ a.label && a.comment ? ', ' : '' }}{{ a.comment }}</span>
            </span>
          </button>
          <RouterLink :to="{ name: hasMap ? 'address-map' : 'addresses' }" class="text-accent inline-flex items-center gap-1 text-[13px] font-semibold">
            <AppIcon :name="hasMap ? 'map' : 'plus'" :size="14" /> {{ $t('cart.addAddress') }}
          </RouterLink>
        </div>
        <p v-else class="text-muted mt-3 text-[13px]"><AppIcon name="pin" :size="14" class="mr-1 inline" />{{ catalog.settings?.restaurantAddress }}</p>
      </section>

      <!-- Payment -->
      <section class="card p-4">
        <h2 class="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">{{ $t('cart.payment') }}</h2>
        <div class="bg-surface-2 flex rounded-xl p-1 text-[13px] font-semibold">
          <button type="button" class="flex-1 rounded-lg py-2 transition-colors" :class="cart.paymentMethod === 'cash' ? 'bg-surface shadow-sm' : 'text-muted'" @click="cart.paymentMethod = 'cash'">
            {{ $t('cart.cash') }}
          </button>
          <button type="button" class="flex-1 rounded-lg py-2 transition-colors" :class="cart.paymentMethod === 'transfer' ? 'bg-surface shadow-sm' : 'text-muted'" @click="cart.paymentMethod = 'transfer'">
            {{ $t('cart.transfer') }}
          </button>
        </div>
      </section>

      <!-- Comment -->
      <section class="card p-4">
        <h2 class="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">{{ $t('cart.comment') }}</h2>
        <textarea v-model="cart.comment" class="input" rows="2" maxlength="500" :placeholder="$t('cart.commentPlaceholder')" />
      </section>

      <!-- Summary -->
      <section class="card space-y-1.5 p-4 text-[14px]">
        <h2 class="mb-2 text-[15px] font-bold">{{ $t('cart.summary') }}</h2>
        <div class="flex justify-between"><span class="text-muted">{{ $t('cart.products', { n: cart.count }) }}</span><span>{{ money(cart.itemsTotal) }}</span></div>
        <div v-if="cart.type === 'delivery'" class="flex justify-between">
          <span class="text-muted">{{ $t('cart.deliveryFee') }}</span>
          <span>{{ cart.byTaxi ? $t('cart.deliveryByAddress') : money(cart.deliveryFee) }}</span>
        </div>
        <div class="flex justify-between border-t border-black/5 pt-2 text-[16px] font-bold">
          <span>{{ cart.byTaxi ? $t('cart.totalWithoutDelivery') : $t('cart.total') }}</span><span>{{ money(cart.total) }}</span>
        </div>
        <p v-if="cart.byTaxi" class="bg-accent-soft text-accent mt-2 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[12px] leading-snug">
          <AppIcon name="info" :size="16" class="mt-px flex-shrink-0" />{{ $t('cart.taxiNote') }}
        </p>
        <p v-if="!cart.meetsMinimum && catalog.settings" class="text-danger pt-1 text-[12px]">
          {{ $t('cart.minOrder', { amount: money(catalog.settings.minOrderAmount) }) }}
        </p>
      </section>
    </div>

    <div v-if="cart.items.length > 0" class="action-bar action-bar--above-nav">
      <p v-if="blocker" class="bg-surface/95 text-text mx-auto mb-2 w-fit max-w-full rounded-full px-3.5 py-1.5 text-center text-[12px] leading-snug shadow-sm backdrop-blur">{{ blocker }}</p>
      <button type="button" class="btn w-full" :disabled="!canSubmit || submitting" @click="submit">
        <span class="flex-1 text-center">{{ $t('cart.placeOrder') }}</span>
        <AppIcon name="arrow-right" :size="20" />
      </button>
    </div>
  </div>
</template>
