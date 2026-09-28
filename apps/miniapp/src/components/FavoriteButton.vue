<script setup lang="ts">
import { useFavoritesStore } from '@/stores/favorites';
import AppIcon from './AppIcon.vue';

defineProps<{ dishId: number; size?: 'sm' | 'md' }>();
const favorites = useFavoritesStore();
</script>

<template>
  <button
    type="button"
    class="flex items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur transition-transform active:scale-90"
    :class="[size === 'md' ? 'h-10 w-10' : 'h-8 w-8', favorites.has(dishId) ? 'text-accent' : 'text-muted']"
    :aria-pressed="favorites.has(dishId)"
    @click.stop.prevent="favorites.toggle(dishId)"
  >
    <AppIcon name="heart" :filled="favorites.has(dishId)" :size="size === 'md' ? 20 : 16" />
  </button>
</template>
