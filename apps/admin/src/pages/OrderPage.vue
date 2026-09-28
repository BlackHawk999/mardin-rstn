<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { AdminOrderDto } from '@rt/shared';
import { STATUS_FLOW } from '@rt/shared';
import { api, ApiError } from '@/api/client';
import { dateTime, money, nextActionLabel, nextStatus, paymentLabel, statusLabel, typeLabel } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge.vue';
import Modal from '@/components/Modal.vue';

const props = defineProps<{ id: string }>();

const order = ref<AdminOrderDto | null>(null);
const couriers = ref<{ id: number; displayName: string; phone: string | null }[]>([]);
const busy = ref(false);
const error = ref('');
const cancelOpen = ref(false);
const cancelReason = ref('');
let timer: number | undefined;

const next = computed(() => (order.value ? nextStatus(order.value.type, order.value.status) : null));
const isFinal = computed(() => order.value?.status === 'completed' || order.value?.status === 'cancelled');
const mapLink = computed(() =>
  order.value?.addressLat && order.value?.addressLng ? `https://yandex.uz/maps/?pt=${order.value.addressLng},${order.value.addressLat}&z=17&l=map` : null,
);

async function load() {
  order.value = await api.order(Number(props.id));
}

async function setStatus(status: AdminOrderDto['status'], extra: { cancelReason?: string } = {}) {
  if (!order.value) return;
  busy.value = true;
  error.value = '';
  try {
    order.value = await api.setOrderStatus(order.value.id, status, extra);
  } catch (e) {
    error.value = e instanceof ApiError ? `Ошибка: ${e.code}` : 'Нет связи';
  } finally {
    busy.value = false;
  }
}

async function assign(courierId: number | null) {
  if (!order.value) return;
  order.value = await api.assignCourier(order.value.id, courierId);
}

function confirmCancel() {
  cancelOpen.value = false;
  setStatus('cancelled', { cancelReason: cancelReason.value.trim() || undefined });
}

onMounted(async () => {
  await Promise.all([load(), api.couriers().then((c) => (couriers.value = c))]);
  timer = window.setInterval(() => !isFinal.value && load(), 10000);
});
onUnmounted(() => window.clearInterval(timer));
</script>

<template>
  <div v-if="order" class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <RouterLink :to="{ name: 'orders' }" class="btn btn-ghost btn-sm">← Заказы</RouterLink>
      <h1 class="text-xl font-bold">Заказ #{{ order.id }}</h1>
      <StatusBadge :status="order.status" />
      <span class="text-muted text-xs">{{ dateTime(order.createdAt) }}</span>
    </div>

    <!-- Progress -->
    <div v-if="order.status !== 'cancelled'" class="card flex items-center gap-2 p-4">
      <template v-for="(s, i) in STATUS_FLOW[order.type]" :key="s">
        <div v-if="i > 0" class="h-0.5 flex-1" :class="STATUS_FLOW[order.type].indexOf(order.status) >= i ? 'bg-accent' : 'bg-surface-2'" />
        <span class="badge" :class="STATUS_FLOW[order.type].indexOf(order.status) >= i ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'">{{ statusLabel[s] }}</span>
      </template>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- Items -->
      <section class="card lg:col-span-2">
        <h2 class="border-b border-black/5 px-4 py-3 font-bold">Состав</h2>
        <table class="table">
          <tbody>
            <tr v-for="i in order.items" :key="i.id">
              <td>
                <span class="font-medium">{{ i.nameRu }}</span>
                <span class="text-muted ml-1 text-xs">{{ i.nameUz }}</span>
                <p v-if="i.comment" class="text-accent mt-0.5 text-xs font-semibold">💬 {{ i.comment }}</p>
              </td>
              <td class="text-muted text-right whitespace-nowrap">{{ money(i.price) }} × {{ i.quantity }}</td>
              <td class="text-right font-semibold whitespace-nowrap">{{ money(i.price * i.quantity) }}</td>
            </tr>
            <tr v-if="order.deliveryFee"><td colspan="2" class="text-muted">Доставка</td><td class="text-right">{{ money(order.deliveryFee) }}</td></tr>
            <tr v-else-if="order.type === 'delivery'"><td colspan="2" class="text-muted">Доставка</td><td class="text-right text-xs">такси, оплачивается отдельно</td></tr>
            <tr><td colspan="2" class="font-bold">Итого · {{ paymentLabel[order.paymentMethod] }}</td><td class="text-right text-base font-bold">{{ money(order.total) }}</td></tr>
          </tbody>
        </table>
        <p v-if="order.comment" class="border-t border-black/5 px-4 py-3 text-[13px]"><span class="text-muted">Комментарий к заказу:</span> {{ order.comment }}</p>
      </section>

      <!-- Sidebar -->
      <div class="space-y-4">
        <section class="card space-y-2 p-4 text-[13px]">
          <h2 class="font-bold">Клиент</h2>
          <p class="font-medium">{{ order.customer.displayName }}</p>
          <p><a v-if="order.customer.phone" :href="`tel:${order.customer.phone}`" class="text-accent">{{ order.customer.phone }}</a><span v-else class="text-muted">нет номера</span></p>
          <p v-if="order.customer.tgUsername"><a :href="`https://t.me/${order.customer.tgUsername}`" target="_blank" class="text-accent">@{{ order.customer.tgUsername }}</a></p>
        </section>

        <section class="card space-y-2 p-4 text-[13px]">
          <h2 class="font-bold">{{ typeLabel[order.type] }}</h2>
          <template v-if="order.type === 'delivery'">
            <p>{{ order.addressText }}</p>
            <p v-if="order.addressComment" class="text-muted">{{ order.addressComment }}</p>
            <a v-if="mapLink" :href="mapLink" target="_blank" class="text-accent font-semibold">Открыть на карте →</a>
            <div class="pt-2">
              <label class="label">Курьер</label>
              <select class="select" :value="order.courier?.id ?? ''" @change="assign(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)">
                <option value="">Не назначен</option>
                <option v-for="c in couriers" :key="c.id" :value="c.id">{{ c.displayName }}{{ c.phone ? ` · ${c.phone}` : '' }}</option>
              </select>
              <p v-if="couriers.length === 0" class="text-muted mt-1 text-xs">Курьеров нет: назначьте роль «Курьер» в разделе Клиенты.</p>
            </div>
          </template>
          <p v-else class="text-muted">Клиент заберёт сам</p>
        </section>

        <section class="card space-y-2 p-4">
          <h2 class="font-bold">Действия</h2>
          <button v-if="next" type="button" class="btn w-full" :disabled="busy" @click="setStatus(next)">{{ nextActionLabel[next] ?? statusLabel[next] }}</button>
          <button v-if="!isFinal" type="button" class="btn btn-danger w-full" :disabled="busy" @click="cancelOpen = true">Отменить заказ</button>
          <p v-if="order.status === 'cancelled' && order.cancelReason" class="text-muted text-xs">Причина: {{ order.cancelReason }}</p>
          <p v-if="error" class="text-danger text-xs">{{ error }}</p>
        </section>
      </div>
    </div>

    <Modal :open="cancelOpen" title="Отменить заказ" @close="cancelOpen = false">
      <label class="label">Причина (увидит только менеджер)</label>
      <input v-model="cancelReason" class="input" placeholder="Например: клиент не отвечает" />
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="cancelOpen = false">Назад</button>
        <button type="button" class="btn btn-danger" @click="confirmCancel">Отменить заказ</button>
      </template>
    </Modal>
  </div>
  <p v-else class="text-muted">Загрузка…</p>
</template>
