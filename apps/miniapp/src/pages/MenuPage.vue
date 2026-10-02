<script setup lang="ts">
import { computed, onActivated, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCatalogStore } from '@/stores/catalog';
import { name } from '@/utils/format';
import AppIcon from '@/components/AppIcon.vue';
import CategoryChips from '@/components/CategoryChips.vue';
import SpiceBazaar from '@/components/SpiceBazaar.vue';
import MenuEndOrnament from '@/components/MenuEndOrnament.vue';
import DishRow from '@/components/DishRow.vue';
import PageHeader from '@/components/PageHeader.vue';
import StickyTop from '@/components/StickyTop.vue';
import { useKeepScroll } from '@/composables/useKeepScroll';

defineOptions({ name: 'MenuPage' });

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();

const selected = ref<number | null>(null);

function applyRoute() {
  const id = Number(route.query.category);
  selected.value = id && catalog.categories.some((c) => c.id === id) ? id : null;
}
// Kept alive: these watchers keep running while a dish page is open, so only react when the menu is on screen.
const onMenu = () => route.name === 'menu';
watch(() => route.query.category, () => onMenu() && applyRoute(), { immediate: true });
watch(() => catalog.categories.length, () => onMenu() && applyRoute());

// Picking another filter while scrolled down: jump back to the top so the new list starts in view.
watch(selected, () => {
  if (onMenu() && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
});

/**
 * The chosen category is kept in the address (/menu?category=13). "Back" from a dish returns to exactly
 * this address, so the filter survives even if the phone re-creates the page (WebView cache, low memory, reload).
 */
function selectCategory(id: number | null) {
  selected.value = id;
  router.replace({ name: 'menu', query: id === null ? {} : { category: String(id) } });
}

useKeepScroll();
onActivated(applyRoute);

const sections = computed(() => {
  const cats = selected.value === null ? catalog.categories : catalog.categories.filter((c) => c.id === selected.value);
  return cats
    .map((c) => ({ category: c, dishes: catalog.dishesByCategory.get(c.id) ?? [] }))
    .filter((s) => s.dishes.length > 0);
});
</script>

<template>
  <div class="page">
    <!-- Title, search and category filters stay pinned while scrolling -->
    <StickyTop>
      <!-- Spice bazaar sketch between the title and the search button (z -1 inside the sticky header) -->
      <div class="menu-spices" aria-hidden="true"><SpiceBazaar /></div>
      <PageHeader :title="$t('nav.menu')" class="!mb-2">
        <template #right>
          <RouterLink :to="{ name: 'search' }" class="icon-btn"><AppIcon name="search" :size="20" /></RouterLink>
        </template>
      </PageHeader>
      <CategoryChips :model-value="selected" :categories="catalog.categories" with-all @update:model-value="selectCategory" />
    </StickyTop>

    <p v-if="catalog.loading && !catalog.categories.length" class="text-muted py-10 text-center text-sm">{{ $t('common.loading') }}</p>

    <section v-for="s in sections" :key="s.category.id" class="pt-3 pb-2">
      <h2 v-if="selected === null" class="mb-2.5 text-[17px] font-bold">{{ name(s.category) }}</h2>
      <div class="space-y-3">
        <DishRow v-for="d in s.dishes" :key="d.id" :dish="d" />
      </div>
    </section>

    <MenuEndOrnament v-if="sections.length" />
  </div>
</template>
