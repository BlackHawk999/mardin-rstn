<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useCatalogStore } from '@/stores/catalog';
import { useCartStore } from '@/stores/cart';
import { useFavoritesStore } from '@/stores/favorites';
import BottomNav from '@/components/BottomNav.vue';

const route = useRoute();
const auth = useAuthStore();
const catalog = useCatalogStore();
const cart = useCartStore();
const favorites = useFavoritesStore();

onMounted(async () => {
  await Promise.all([auth.init(), catalog.load(), cart.hydrate()]);
  if (auth.user) void favorites.load();
});
</script>

<template>
  <div v-if="auth.error" class="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
    <p class="text-lg font-semibold">{{ $t('common.error') }}</p>
    <p class="text-muted text-sm">{{ $t(`errors.${auth.error}`, $t('common.error')) }}</p>
    <button class="btn" @click="auth.init()">{{ $t('common.retry') }}</button>
  </div>

  <template v-else>
    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['HomePage', 'MenuPage']">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
    <BottomNav v-if="route.meta.nav" />
  </template>
</template>
