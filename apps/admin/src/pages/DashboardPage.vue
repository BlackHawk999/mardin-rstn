<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { AdminOrderDto, AdminStatsDto } from '@rt/shared';
import { api } from '@/api/client';
import { dateTime, money, typeLabel } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge.vue';

const stats = ref<AdminStatsDto | null>(null);
const active = ref<AdminOrderDto[]>([]);
let timer: number | undefined;

async function load() {
  const [s, o] = await Promise.all([api.stats(), api.orders({ active: true, pageSize: 20 })]);
  stats.value = s;
  active.value = o.items;
}

onMounted(() => {
  load();
  timer = window.setInterval(load, 15000);
});
onUnmounted(() => window.clearInterval(timer));
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold">Обзор</h1>

    <div v-if="stats" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="card p-4">
        <p class="label">Сегодня</p>
        <p class="text-2xl font-bold">{{ stats.today.orders }}</p>
        <p class="text-muted text-xs">заказов · {{ money(stats.today.revenue) }}</p>
      </div>
      <div class="card p-4">
        <p class="label">7 дней</p>
        <p class="text-2xl font-bold">{{ stats.week.orders }}</p>
        <p class="text-muted text-xs">заказов · {{ money(stats.week.revenue) }}</p>
      </div>
      <div class="card p-4">
        <p class="label">В работе</p>
        <p class="text-2xl font-bold">{{ stats.activeOrders }}</p>
        <p class="text-xs" :class="stats.newOrders ? 'text-danger font-semibold' : 'text-muted'">новых: {{ stats.newOrders }}</p>
      </div>
      <div class="card p-4">
        <p class="label">Клиентов</p>
        <p class="text-2xl font-bold">{{ stats.customers }}</p>
        <p class="text-muted text-xs">всего в базе</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <section class="card lg:col-span-2">
        <div class="flex items-center justify-between px-4 py-3">
          <h2 class="font-bold">Активные заказы</h2>
          <RouterLink :to="{ name: 'orders' }" class="text-accent text-xs font-semibold">Все заказы →</RouterLink>
        </div>
        <table class="table">
          <thead>
            <tr><th>№</th><th>Клиент</th><th>Тип</th><th>Сумма</th><th>Статус</th><th>Время</th></tr>
          </thead>
          <tbody>
            <tr v-for="o in active" :key="o.id" class="cursor-pointer" @click="$router.push({ name: 'order', params: { id: String(o.id) } })">
              <td class="font-semibold">#{{ o.id }}</td>
              <td>{{ o.customer.displayName }}<span class="text-muted block text-xs">{{ o.customer.phone }}</span></td>
              <td>{{ typeLabel[o.type] }}</td>
              <td class="font-semibold">{{ money(o.total) }}</td>
              <td><StatusBadge :status="o.status" /></td>
              <td class="text-muted text-xs">{{ dateTime(o.createdAt) }}</td>
            </tr>
            <tr v-if="active.length === 0"><td colspan="6" class="text-muted py-8 text-center">Нет активных заказов</td></tr>
          </tbody>
        </table>
      </section>

      <section class="card p-4">
        <h2 class="mb-3 font-bold">Топ блюд за неделю</h2>
        <ol class="space-y-2">
          <li v-for="(d, i) in stats?.topDishes ?? []" :key="i" class="flex items-center justify-between text-[13px]">
            <span><span class="text-muted mr-2">{{ i + 1 }}.</span>{{ d.nameRu }}</span>
            <span class="font-semibold">× {{ d.quantity }}</span>
          </li>
          <li v-if="stats && stats.topDishes.length === 0" class="text-muted text-xs">Пока нет данных</li>
        </ol>
      </section>
    </div>
  </div>
</template>
