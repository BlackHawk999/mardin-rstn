<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { AdminUserDto, UserRole } from '@rt/shared';
import { api } from '@/api/client';
import { date, dateTime, money, roleLabel } from '@/utils/format';

const q = ref('');
const role = ref<UserRole | ''>('');
const page = ref(1);
const pageSize = 30;
const total = ref(0);
const users = ref<AdminUserDto[]>([]);

async function load() {
  const res = await api.users({ q: q.value || undefined, role: role.value || undefined, page: page.value, pageSize });
  users.value = res.items;
  total.value = res.total;
}

async function setRole(u: AdminUserDto, r: UserRole) {
  const updated = await api.updateUser(u.id, { role: r });
  users.value = users.value.map((x) => (x.id === u.id ? { ...x, ...updated } : x));
}

async function toggleBlock(u: AdminUserDto) {
  if (!u.isBlocked && !confirm(`Заблокировать ${u.displayName}? Он не сможет делать заказы.`)) return;
  const updated = await api.updateUser(u.id, { isBlocked: !u.isBlocked });
  users.value = users.value.map((x) => (x.id === u.id ? { ...x, ...updated } : x));
}

let debounce: number | undefined;
watch(q, () => {
  window.clearTimeout(debounce);
  debounce = window.setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});
watch(role, () => {
  page.value = 1;
  load();
});
watch(page, load);
onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold">Клиенты <span class="text-muted text-sm font-normal">{{ total }}</span></h1>
      <div class="flex gap-2">
        <select v-model="role" class="select w-40">
          <option value="">Все роли</option>
          <option value="customer">Клиенты</option>
          <option value="courier">Курьеры</option>
          <option value="admin">Админы</option>
        </select>
        <input v-model="q" class="input w-64" placeholder="Имя, телефон, @username" />
      </div>
    </div>

    <div class="card overflow-x-auto">
      <table class="table">
        <thead>
          <tr><th>Клиент</th><th>Телефон</th><th>Язык</th><th>Заказов</th><th>Сумма покупок</th><th>Последний заказ</th><th>Регистрация</th><th>Роль</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" :class="{ 'opacity-50': u.isBlocked }">
            <td>
              <span class="font-medium">{{ u.displayName }}</span>
              <a v-if="u.tgUsername" :href="`https://t.me/${u.tgUsername}`" target="_blank" class="text-accent block text-xs">@{{ u.tgUsername }}</a>
            </td>
            <td class="whitespace-nowrap">{{ u.phone ?? '—' }}</td>
            <td class="uppercase">{{ u.language }}</td>
            <td>{{ u.ordersCount }}</td>
            <td class="font-semibold whitespace-nowrap">{{ money(u.totalSpent) }}</td>
            <td class="text-muted text-xs whitespace-nowrap">{{ u.lastOrderAt ? dateTime(u.lastOrderAt) : '—' }}</td>
            <td class="text-muted text-xs whitespace-nowrap">{{ date(u.createdAt) }}</td>
            <td>
              <select class="select !h-8 w-28 text-xs" :value="u.role" @change="setRole(u, ($event.target as HTMLSelectElement).value as UserRole)">
                <option v-for="(label, r) in roleLabel" :key="r" :value="r">{{ label }}</option>
              </select>
            </td>
            <td>
              <button type="button" class="btn btn-sm" :class="u.isBlocked ? 'btn-success' : 'btn-danger'" @click="toggleBlock(u)">
                {{ u.isBlocked ? 'Разблокировать' : 'Заблокировать' }}
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0"><td colspan="9" class="text-muted py-10 text-center">Никого не найдено</td></tr>
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
