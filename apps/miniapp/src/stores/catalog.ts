import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CatalogDto, DishDto } from '@rt/shared';
import { api, ApiError } from '@/api/client';

export const useCatalogStore = defineStore('catalog', () => {
  const data = ref<CatalogDto | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const categories = computed(() => data.value?.categories ?? []);
  const dishes = computed(() => data.value?.dishes ?? []);
  const banners = computed(() => data.value?.banners ?? []);
  const settings = computed(() => data.value?.settings ?? null);
  const isOpen = computed(() => data.value?.isOpen ?? true);

  const dishById = computed(() => new Map(dishes.value.map((d) => [d.id, d])));
  const dishesByCategory = computed(() => {
    const map = new Map<number, DishDto[]>();
    for (const d of dishes.value) {
      const list = map.get(d.categoryId) ?? [];
      list.push(d);
      map.set(d.categoryId, list);
    }
    return map;
  });
  const popular = computed(() => dishes.value.filter((d) => d.isHit && d.isAvailable).slice(0, 8));
  const fresh = computed(() => dishes.value.filter((d) => d.isNew && d.isAvailable).slice(0, 8));

  async function load(force = false) {
    if (data.value && !force) return;
    loading.value = true;
    error.value = null;
    try {
      data.value = await api.catalog();
    } catch (e) {
      error.value = e instanceof ApiError ? e.code : 'network';
    } finally {
      loading.value = false;
    }
  }

  function search(query: string): DishDto[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return dishes.value.filter((d) => d.nameRu.toLowerCase().includes(q) || d.nameUz.toLowerCase().includes(q));
  }

  return { data, loading, error, categories, dishes, banners, settings, isOpen, dishById, dishesByCategory, popular, fresh, load, search };
});
