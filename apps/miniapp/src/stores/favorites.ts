import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';
import { haptic } from '@/telegram';

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<Set<number>>(new Set());
  const loaded = ref(false);

  async function load() {
    if (loaded.value) return;
    try {
      ids.value = new Set(await api.favorites());
      loaded.value = true;
    } catch {
      /* keep empty; will retry on next toggle */
    }
  }

  function has(dishId: number) {
    return ids.value.has(dishId);
  }

  /** Optimistic toggle: flip immediately, roll back if the request fails. */
  async function toggle(dishId: number) {
    const wasFavorite = ids.value.has(dishId);
    const next = new Set(ids.value);
    if (wasFavorite) next.delete(dishId);
    else next.add(dishId);
    ids.value = next;
    haptic.selection();
    try {
      if (wasFavorite) await api.removeFavorite(dishId);
      else await api.addFavorite(dishId);
    } catch {
      const rollback = new Set(ids.value);
      if (wasFavorite) rollback.add(dishId);
      else rollback.delete(dishId);
      ids.value = rollback;
    }
  }

  return { ids, loaded, load, has, toggle };
});
