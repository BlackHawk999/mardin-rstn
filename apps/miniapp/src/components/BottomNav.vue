<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { haptic } from '@/telegram';
import AppIcon from './AppIcon.vue';

const route = useRoute();
const cart = useCartStore();

const tabs = [
  { name: 'home', label: 'nav.home', icon: 'home' },
  { name: 'menu', label: 'nav.menu', icon: 'grid' },
  { name: 'cart', label: 'nav.cart', icon: 'cart' },
  { name: 'favorites', label: 'nav.favorites', icon: 'heart' },
  { name: 'profile', label: 'nav.profile', icon: 'user' },
] as const;

// Secondary screens light up the tab they belong to.
const parentTab: Record<string, (typeof tabs)[number]['name']> = {
  search: 'home',
  dish: 'menu',
  orders: 'profile',
  order: 'profile',
  addresses: 'profile',
};
const activeTab = computed(() => {
  const n = String(route.name ?? '');
  return tabs.some((t) => t.name === n) ? (n as (typeof tabs)[number]['name']) : (parentTab[n] ?? 'home');
});
const activeIndex = computed(() => tabs.findIndex((t) => t.name === activeTab.value));
</script>

<template>
  <nav class="glass-nav flex" aria-label="Main">
    <div class="glass-nav__indicator" :style="{ '--i': activeIndex }" :key="activeIndex" />
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="glass-nav__tab"
      :class="{ 'glass-nav__tab--active': activeTab === tab.name }"
      @click="haptic.selection()"
    >
      <AppIcon :name="tab.icon" :filled="activeTab === tab.name" />
      <span>{{ $t(tab.label) }}</span>
      <span v-if="tab.name === 'cart' && cart.count > 0" class="glass-nav__badge">{{ cart.count }}</span>
    </RouterLink>
  </nav>
</template>
