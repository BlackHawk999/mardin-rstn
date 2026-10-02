<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { OrderDto } from '@rt/shared';
import { api } from '@/api/client';
import { useCatalogStore } from '@/stores/catalog';
import { formatDate, money } from '@/utils/format';
import { haptic } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';
import EmptyState from '@/components/EmptyState.vue';
import CourierSketch from '@/components/CourierSketch.vue';
import PageHeader from '@/components/PageHeader.vue';

const catalog = useCatalogStore();

type Tab = 'all' | 'active' | 'done' | 'cancelled';
const tabs: Tab[] = ['all', 'active', 'done', 'cancelled'];
const tab = ref<Tab>('all');
const orders = ref<OrderDto[]>([]);
const loading = ref(true);

const filtered = computed(() =>
  orders.value.filter((o) => {
    if (tab.value === 'all') return true;
    if (tab.value === 'done') return o.status === 'completed';
    if (tab.value === 'cancelled') return o.status === 'cancelled';
    return o.status !== 'completed' && o.status !== 'cancelled';
  }),
);

function statusClass(status: OrderDto['status']) {
  if (status === 'completed') return 'text-success';
  if (status === 'cancelled') return 'text-danger';
  return 'text-warning';
}

function firstImage(o: OrderDto) {
  const item = o.items.find((i) => i.dishId && catalog.dishById.get(i.dishId)?.imageUrl);
  return item?.dishId ? catalog.dishById.get(item.dishId)?.imageUrl : null;
}

onMounted(async () => {
  try {
    orders.value = await api.orders();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <PageHeader :title="$t('orders.title')" back="/profile" />

    <div class="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 py-1">
      <button v-for="t in tabs" :key="t" type="button" class="chip" :class="{ 'chip--active': tab === t }" @click="haptic.selection(); tab = t">
        {{ $t(`orders.tabs.${t}`) }}
      </button>
    </div>

    <p v-if="loading" class="text-muted py-10 text-center text-sm">{{ $t('common.loading') }}</p>
    <EmptyState v-else-if="filtered.length === 0" :text="$t('orders.empty')">
      <template #art><CourierSketch /></template>
    </EmptyState>

    <div v-else class="space-y-3">
      <RouterLink v-for="o in filtered" :key="o.id" :to="{ name: 'order', params: { id: String(o.id) } }" class="card flex items-center gap-3 p-3">
        <div class="bg-surface-2 h-16 w-16 flex-shrink-0 overflow-hidden rounded-[12px]">
          <img v-if="firstImage(o)" :src="firstImage(o)!" class="h-full w-full object-cover" alt="" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <p class="text-[14px] font-bold">#{{ o.id }}</p>
            <span class="flex items-center gap-1 text-[12px] font-semibold" :class="statusClass(o.status)">
              <span class="h-1.5 w-1.5 rounded-full bg-current" />
              {{ $t(`order.status.${o.status}`) }}
            </span>
          </div>
          <p class="text-muted text-[12px]">{{ $t('orders.items', { n: o.items.reduce((n, i) => n + i.quantity, 0) }, o.items.reduce((n, i) => n + i.quantity, 0)) }}</p>
          <div class="mt-1 flex items-center justify-between">
            <p class="text-[14px] font-bold">{{ money(o.total) }}</p>
            <p class="text-muted text-[12px]">{{ formatDate(o.createdAt, false) }}</p>
          </div>
        </div>
        <AppIcon name="chevron" :size="18" class="text-muted flex-shrink-0" />
      </RouterLink>

      <!-- A courier on the way: fills the space under the list -->
      <CourierSketch class="!mt-10" />
    </div>
  </div>
</template>
