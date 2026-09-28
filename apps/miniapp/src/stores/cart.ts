import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { OrderType, PaymentMethod } from '@rt/shared';
import { cloud } from '@/telegram';
import { useCatalogStore } from './catalog';

export interface CartItem {
  key: string; // `${dishId}|${comment}` — same dish with different comments = different lines
  dishId: number;
  quantity: number;
  comment: string;
}

const STORAGE_KEY = 'cart:v1';

const makeKey = (dishId: number, comment: string) => `${dishId}|${comment.trim()}`;

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const type = ref<OrderType>('delivery');
  const paymentMethod = ref<PaymentMethod>('cash');
  const addressId = ref<number | null>(null);
  const comment = ref('');
  const hydrated = ref(false);

  const catalog = useCatalogStore();

  const count = computed(() => items.value.reduce((n, i) => n + i.quantity, 0));
  const itemsTotal = computed(() =>
    items.value.reduce((sum, i) => sum + (catalog.dishById.get(i.dishId)?.price ?? 0) * i.quantity, 0),
  );
  const byTaxi = computed(() => type.value === 'delivery' && Boolean(catalog.settings?.deliveryByTaxi));
  const deliveryFee = computed(() => (type.value === 'delivery' && !byTaxi.value ? (catalog.settings?.deliveryFee ?? 0) : 0));
  const total = computed(() => itemsTotal.value + deliveryFee.value);
  // Minimum order applies to delivery only.
  const meetsMinimum = computed(() => type.value === 'pickup' || itemsTotal.value >= (catalog.settings?.minOrderAmount ?? 0));

  /** Total quantity of a dish across all its comment variants (used by menu cards). */
  function quantityOf(dishId: number): number {
    return items.value.filter((i) => i.dishId === dishId).reduce((n, i) => n + i.quantity, 0);
  }

  function add(dishId: number, quantity = 1, itemComment = '') {
    const key = makeKey(dishId, itemComment);
    const existing = items.value.find((i) => i.key === key);
    if (existing) existing.quantity += quantity;
    else items.value.push({ key, dishId, quantity, comment: itemComment.trim() });
  }

  function setQuantity(key: string, quantity: number) {
    const idx = items.value.findIndex((i) => i.key === key);
    if (idx === -1) return;
    if (quantity <= 0) items.value.splice(idx, 1);
    else items.value[idx]!.quantity = quantity;
  }

  /** Quick "-" from the menu card: decrements the plain (no-comment) line first, then the last one. */
  function decrementDish(dishId: number) {
    const plain = items.value.find((i) => i.dishId === dishId && !i.comment);
    const target = plain ?? [...items.value].reverse().find((i) => i.dishId === dishId);
    if (target) setQuantity(target.key, target.quantity - 1);
  }

  function updateComment(key: string, newComment: string) {
    const item = items.value.find((i) => i.key === key);
    if (!item) return;
    const newKey = makeKey(item.dishId, newComment);
    const clash = items.value.find((i) => i.key === newKey && i !== item);
    if (clash) {
      clash.quantity += item.quantity;
      remove(key);
    } else {
      item.comment = newComment.trim();
      item.key = newKey;
    }
  }

  function remove(key: string) {
    items.value = items.value.filter((i) => i.key !== key);
  }

  function clear() {
    items.value = [];
    comment.value = '';
  }

  /** Drops lines whose dish disappeared or became unavailable. Returns how many were removed. */
  function pruneUnavailable(): number {
    const before = items.value.length;
    items.value = items.value.filter((i) => catalog.dishById.get(i.dishId)?.isAvailable);
    return before - items.value.length;
  }

  async function hydrate() {
    try {
      const raw = await cloud.get(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<{ items: CartItem[]; type: OrderType; paymentMethod: PaymentMethod; addressId: number | null; comment: string }>;
        items.value = saved.items ?? [];
        type.value = saved.type ?? 'delivery';
        paymentMethod.value = saved.paymentMethod ?? 'cash';
        addressId.value = saved.addressId ?? null;
        comment.value = saved.comment ?? '';
      }
    } catch {
      /* corrupted storage: start empty */
    }
    hydrated.value = true;
  }

  watch(
    [items, type, paymentMethod, addressId, comment],
    () => {
      if (!hydrated.value) return;
      void cloud.set(
        STORAGE_KEY,
        JSON.stringify({ items: items.value, type: type.value, paymentMethod: paymentMethod.value, addressId: addressId.value, comment: comment.value }),
      );
    },
    { deep: true },
  );

  return {
    items, type, paymentMethod, addressId, comment, hydrated,
    count, itemsTotal, deliveryFee, byTaxi, total, meetsMinimum,
    quantityOf, add, setQuantity, decrementDish, updateComment, remove, clear, pruneUnavailable, hydrate,
  };
});
