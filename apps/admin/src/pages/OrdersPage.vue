<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import type { AdminOrderDto, OrderStatus } from '@rt/shared';
import { api } from '@/api/client';
import { dateTime, money, nextActionLabel, nextStatus, statusLabel, typeLabel } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge.vue';

type Filter = 'active' | 'all' | OrderStatus;
const filters: { key: Filter; label: string }[] = [
  { key: 'active', label: 'В работе' },
  { key: 'new', label: 'Новые' },
  { key: 'cooking', label: 'Готовятся' },
  { key: 'delivering', label: 'Доставляются' },
  { key: 'completed', label: 'Завершённые' },
  { key: 'cancelled', label: 'Отменённые' },
  { key: 'all', label: 'Все' },
];

const filter = ref<Filter>('active');
const q = ref('');
const page = ref(1);
const pageSize = 30;
const total = ref(0);
const orders = ref<AdminOrderDto[]>([]);
const loading = ref(false);
let timer: number | undefined;

async function load() {
  loading.value = true;
  try {
    const res = await api.orders({
      active: filter.value === 'active' ? true : undefined,
      status: filter.value !== 'active' && filter.value !== 'all' ? filter.value : undefined,
      q: q.value || undefined,
      page: page.value,
      pageSize,
    });
    orders.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function advance(o: AdminOrderDto) {
  const next = nextStatus(o.type, o.status);
  if (!next) return;
  const updated = await api.setOrderStatus(o.id, next);
  orders.value = orders.value.map((x) => (x.id === o.id ? updated : x));
}

watch([filter, q], () => {
  page.value = 1;
  load();
});
watch(page, load);

onMounted(() => {
  load();
  timer = window.setInterval(load, 10000);
});
onUnmounted(() => window.clearInterval(timer));
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold">Заказы <span class="text-muted text-sm font-normal">{{ total }}</span></h1>
      <input v-model="q" class="input w-64" placeholder="Поиск: № заказа, телефон, имя" />
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in filters"
        :key="f.key"
        type="button"
        class="btn btn-sm"
        :class="filter === f.key ? '' : 'btn-ghost'"
        @click="filter = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="card overflow-x-auto">
      <table class="table">
        <thead>
          <tr><th>№</th><th>Клиент</th><th>Тип / адрес</th><th>Состав</th><th>Сумма</th><th>Статус</th><th>Курьер</th><th>Создан</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id" class="cursor-pointer" @click="$router.push({ name: 'order', params: { id: String(o.id) } })">
            <td class="font-semibold">#{{ o.id }}</td>
            <td>{{ o.customer.displayName }}<span class="text-muted block text-xs">{{ o.customer.phone ?? '—' }}</span></td>
            <td>
              <span class="badge bg-surface-2">{{ typeLabel[o.type] }}</span>
              <span v-if="o.addressText" class="text-muted mt-1 block max-w-[220px] truncate text-xs">{{ o.addressText }}</span>
            </td>
            <td class="max-w-[260px] text-xs">
              <div v-for="i in o.items" :key="i.id" class="truncate">{{ i.nameRu }} × {{ i.quantity }}<span v-if="i.comment" class="text-accent"> · {{ i.comment }}</span></div>
            </td>
            <td class="font-semibold whitespace-nowrap">{{ money(o.total) }}</td>
            <td><StatusBadge :status="o.status" /></td>
            <td class="text-xs">{{ o.courier?.displayName ?? '—' }}</td>
            <td class="text-muted text-xs whitespace-nowrap">{{ dateTime(o.createdAt) }}</td>
            <td @click.stop>
              <button v-if="nextStatus(o.type, o.status)" type="button" class="btn btn-success btn-sm" @click="advance(o)">
                {{ nextActionLabel[nextStatus(o.type, o.status)!] ?? statusLabel[nextStatus(o.type, o.status)!] }}
              </button>
            </td>
          </tr>
          <tr v-if="!loading && orders.length === 0"><td colspan="9" class="text-muted py-10 text-center">Заказов нет</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > pageSize" class="flex items-center justify-end gap-2 text-xs">
      <button type="button" class="btn btn-ghost btn-sm" :disabled="page === 1" @click="page--">←</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="page * pageSize >= total" @click="page++">→</button>
    </div>
  </div>
</template>
