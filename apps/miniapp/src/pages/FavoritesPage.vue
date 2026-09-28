<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCatalogStore } from '@/stores/catalog';
import { useFavoritesStore } from '@/stores/favorites';
import AppIcon from '@/components/AppIcon.vue';
import DishRow from '@/components/DishRow.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageHeader from '@/components/PageHeader.vue';

const router = useRouter();
const catalog = useCatalogStore();
const favorites = useFavoritesStore();

const dishes = computed(() => catalog.dishes.filter((d) => favorites.has(d.id)));
</script>

<template>
  <div class="page">
    <PageHeader :title="$t('favorites.title')">
      <template #right>
        <RouterLink :to="{ name: 'search' }" class="icon-btn"><AppIcon name="search" :size="20" /></RouterLink>
      </template>
    </PageHeader>
    <EmptyState v-if="dishes.length === 0" icon="♥" :text="$t('favorites.empty')" :action-label="$t('cart.goToMenu')" @action="router.push({ name: 'menu' })" />
    <div v-else class="space-y-3">
      <DishRow v-for="d in dishes" :key="d.id" :dish="d" />
    </div>
  </div>
</template>
