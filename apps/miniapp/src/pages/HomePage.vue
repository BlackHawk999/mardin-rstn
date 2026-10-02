<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { BannerDto } from '@rt/shared';
import { useCatalogStore } from '@/stores/catalog';
import { tr } from '@/utils/format';
import AppIcon from '@/components/AppIcon.vue';
import CategoryChips from '@/components/CategoryChips.vue';
import LanternGarland from '@/components/LanternGarland.vue';
import StickyTop from '@/components/StickyTop.vue';
import { useKeepScroll } from '@/composables/useKeepScroll';
import DishCard from '@/components/DishCard.vue';

defineOptions({ name: 'HomePage' });

useKeepScroll();

const router = useRouter();
const catalog = useCatalogStore();

const activeBanner = ref(0);
const bannerEl = ref<HTMLElement | null>(null);

function onBannerScroll() {
  const el = bannerEl.value;
  if (!el || !el.firstElementChild) return;
  const w = (el.firstElementChild as HTMLElement).offsetWidth + 12;
  activeBanner.value = Math.round(el.scrollLeft / w);
}

function openBanner(b: BannerDto) {
  if (b.dishId) router.push({ name: 'dish', params: { id: String(b.dishId) } });
  else if (b.categoryId) router.push({ name: 'menu', query: { category: String(b.categoryId) } });
}

function onCategory(id: number | null) {
  if (id !== null) router.push({ name: 'menu', query: { category: String(id) } });
}

const featured = computed(() => {
  const list = [...catalog.popular, ...catalog.fresh.filter((d) => !catalog.popular.includes(d))];
  return list.length ? list : catalog.dishes.filter((d) => d.isAvailable).slice(0, 6);
});
</script>

<template>
  <div class="page space-y-4">
    <!-- Logo, search and category filters stay pinned while scrolling -->
    <StickyTop>
      <!-- Lantern garland across the top, behind the logo (z -1 inside the sticky header's stacking context) -->
      <div class="home-lanterns" aria-hidden="true"><LanternGarland /></div>
      <header class="mb-2 flex h-12 items-center">
        <div class="w-10" />
        <div class="flex-1 text-center leading-none">
          <div class="serif text-accent text-[24px] font-semibold tracking-[0.14em] uppercase">{{ catalog.settings?.restaurantName ?? 'Mardin' }}</div>
          <div class="text-muted mt-1 text-[9px] tracking-[0.32em]">{{ $t('common.restaurant') }}</div>
        </div>
        <RouterLink :to="{ name: 'search' }" class="icon-btn">
          <AppIcon name="search" :size="20" />
        </RouterLink>
      </header>

      <CategoryChips :categories="catalog.categories" :model-value="null" with-all @update:model-value="onCategory" />
    </StickyTop>

    <div v-if="catalog.settings && !catalog.isOpen" class="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900">
      {{ $t('home.closed', { open: catalog.settings.openTime, close: catalog.settings.closeTime }) }}
    </div>

    <!-- Banners -->
    <section v-if="catalog.banners.length">
      <div ref="bannerEl" class="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4" @scroll.passive="onBannerScroll">
        <button
          v-for="b in catalog.banners"
          :key="b.id"
          type="button"
          class="relative aspect-[2/1] w-[calc(100vw-32px)] flex-shrink-0 snap-center overflow-hidden rounded-[22px] bg-surface-2 text-left"
          @click="openBanner(b)"
        >
          <img :src="b.imageUrl" class="absolute inset-0 h-full w-full object-cover" alt="" />
          <div class="absolute inset-0 bg-gradient-to-r from-[#2a1f18]/80 via-[#2a1f18]/35 to-transparent" />
          <div class="absolute inset-0 flex flex-col justify-center gap-1.5 p-5 pr-[38%] text-white">
            <p class="serif text-[19px] leading-tight font-bold">{{ tr(b.titleUz, b.titleRu) }}</p>
            <p class="text-[12px] leading-snug text-white/85">{{ tr(b.subtitleUz, b.subtitleRu) }}</p>
            <span class="mt-2 inline-flex h-8 w-fit items-center gap-1.5 rounded-full bg-white/90 px-3.5 text-[12px] font-semibold text-accent">
              <AppIcon name="bag" :size="14" /> {{ $t('common.view') }}
            </span>
          </div>
        </button>
      </div>
      <div v-if="catalog.banners.length > 1" class="mt-2.5 flex justify-center gap-1.5">
        <span
          v-for="(b, i) in catalog.banners"
          :key="b.id"
          class="h-1.5 rounded-full transition-all"
          :class="i === activeBanner ? 'bg-accent w-4' : 'bg-accent/25 w-1.5'"
        />
      </div>
    </section>

    <!-- Featured dishes -->
    <section>
      <div class="mb-2.5 flex items-center justify-between">
        <h2 class="text-[17px] font-bold">{{ $t('home.popular') }}</h2>
        <RouterLink :to="{ name: 'menu' }" class="text-accent text-[13px] font-semibold">{{ $t('common.all') }}</RouterLink>
      </div>
      <div v-if="catalog.loading && !featured.length" class="grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="card aspect-[3/4] animate-pulse" />
      </div>
      <div v-else class="grid grid-cols-2 gap-3">
        <DishCard v-for="d in featured" :key="d.id" :dish="d" />
      </div>
    </section>
  </div>
</template>
