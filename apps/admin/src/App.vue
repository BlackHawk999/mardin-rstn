<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const nav = [
  { name: 'dashboard', label: 'Обзор', icon: '◫' },
  { name: 'orders', label: 'Заказы', icon: '🧾' },
  { name: 'menu', label: 'Меню', icon: '🍽' },
  { name: 'banners', label: 'Баннеры', icon: '🖼' },
  { name: 'customers', label: 'Клиенты', icon: '👥' },
  { name: 'settings', label: 'Настройки', icon: '⚙' },
];

const isPublic = computed(() => Boolean(route.meta.public));

// New-order counter in the sidebar, refreshed every 15s; beeps when it grows.
const newOrders = ref(0);
let timer: number | undefined;
let lastCount: number | null = null;

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* audio not allowed */
  }
}

async function poll() {
  if (!auth.isAuthed()) return;
  try {
    const stats = await api.stats();
    if (lastCount !== null && stats.newOrders > lastCount) beep();
    lastCount = stats.newOrders;
    newOrders.value = stats.newOrders;
  } catch {
    /* offline */
  }
}

onMounted(() => {
  poll();
  timer = window.setInterval(poll, 15000);
});
onUnmounted(() => window.clearInterval(timer));

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <RouterView v-if="isPublic" />

  <div v-else class="flex min-h-screen">
    <aside class="bg-surface flex w-56 flex-shrink-0 flex-col border-r border-black/5 p-4">
      <div class="mb-6 px-2">
        <div class="text-accent text-xl font-bold tracking-[0.12em] uppercase" style="font-family: Georgia, serif">Mardin</div>
        <div class="text-muted text-[10px] tracking-[0.3em] uppercase">Admin</div>
      </div>
      <nav class="flex flex-col gap-1">
        <RouterLink v-for="n in nav" :key="n.name" :to="{ name: n.name }" class="nav-link" :class="{ 'nav-link--active': route.name === n.name || (n.name === 'orders' && route.name === 'order') }">
          <span class="w-5 text-center text-base leading-none">{{ n.icon }}</span>
          <span class="flex-1">{{ n.label }}</span>
          <span v-if="n.name === 'orders' && newOrders > 0" class="badge bg-accent text-white">{{ newOrders }}</span>
        </RouterLink>
      </nav>
      <div class="mt-auto border-t border-black/5 pt-4 text-[13px]">
        <p class="text-muted truncate px-2">{{ auth.name }}</p>
        <button type="button" class="text-danger mt-1 px-2 font-medium" @click="logout">Выйти</button>
      </div>
    </aside>

    <main class="min-w-0 flex-1 p-6">
      <RouterView />
    </main>
  </div>
</template>
