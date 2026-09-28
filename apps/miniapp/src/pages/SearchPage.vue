<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCatalogStore } from '@/stores/catalog';
import { money, name } from '@/utils/format';
import { haptic, hideBackButton, showBackButton } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';
import DishRow from '@/components/DishRow.vue';
import { canGoBack } from '@/composables/useKeepScroll';

const RECENT_KEY = 'recent-searches';
const router = useRouter();
const catalog = useCatalogStore();

const query = ref('');
const inputEl = ref<HTMLInputElement | null>(null);
const recent = ref<string[]>([]);

const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return catalog.dishes.filter((d) => {
    const cat = catalog.categories.find((c) => c.id === d.categoryId);
    return [d.nameRu, d.nameUz, cat?.nameRu, cat?.nameUz].some((s) => s?.toLowerCase().includes(q));
  });
});

function loadRecent() {
  try {
    recent.value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    recent.value = [];
  }
}
function remember(term: string) {
  const t = term.trim();
  if (!t) return;
  recent.value = [t, ...recent.value.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value));
  } catch {
    /* ignore */
  }
}
function clearRecent() {
  recent.value = [];
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}
function useRecent(term: string) {
  haptic.selection();
  query.value = term;
}
function onSubmit() {
  remember(query.value);
  inputEl.value?.blur();
}
function goBack() {
  if (query.value) remember(query.value);
  if (canGoBack()) router.back();
  else router.push({ name: 'home' });
}

onMounted(() => {
  loadRecent();
  showBackButton(goBack);
  window.setTimeout(() => inputEl.value?.focus(), 50);
});
onBeforeUnmount(hideBackButton);
</script>

<template>
  <div class="page space-y-5">
    <header class="flex h-12 items-center gap-2">
      <button type="button" class="icon-btn -ml-1" @click="goBack"><AppIcon name="back" /></button>
      <form class="relative flex-1" @submit.prevent="onSubmit">
        <AppIcon name="search" :size="18" class="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2" />
        <input ref="inputEl" v-model="query" type="search" class="input bg-surface !pl-11" :placeholder="$t('common.search')" enterkeyhint="search" />
        <button v-if="query" type="button" class="text-muted absolute top-1/2 right-3 -translate-y-1/2 p-1" @click="query = ''"><AppIcon name="close" :size="16" /></button>
      </form>
    </header>

    <!-- Results -->
    <template v-if="query.trim()">
      <div v-if="results.length" class="space-y-3">
        <DishRow v-for="d in results" :key="d.id" :dish="d" />
      </div>
      <p v-else class="text-muted py-10 text-center text-sm">{{ $t('common.notFound') }}</p>
    </template>

    <!-- Idle state -->
    <template v-else>
      <section v-if="recent.length">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-[15px] font-bold">{{ $t('search.recent') }}</h2>
          <button type="button" class="text-muted text-[12px]" @click="clearRecent">{{ $t('search.clear') }}</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-for="r in recent" :key="r" type="button" class="chip !h-8 !px-3.5" @click="useRecent(r)">{{ r }}</button>
        </div>
      </section>

      <section v-if="catalog.popular.length">
        <h2 class="mb-2 text-[15px] font-bold">{{ $t('search.popular') }}</h2>
        <div class="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          <RouterLink
            v-for="d in catalog.popular"
            :key="d.id"
            :to="{ name: 'dish', params: { id: String(d.id) } }"
            class="card flex w-[200px] flex-shrink-0 items-center gap-2.5 p-2"
          >
            <img v-if="d.imageUrl" :src="d.imageUrl" class="h-14 w-14 rounded-[10px] object-cover" alt="" />
            <div class="min-w-0">
              <p class="line-clamp-1 text-[13px] font-semibold">{{ name(d) }}</p>
              <p class="text-accent text-[12px] font-bold">{{ money(d.price) }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

      <section>
        <h2 class="mb-2 text-[15px] font-bold">{{ $t('search.categories') }}</h2>
        <div class="card divide-y divide-black/5 overflow-hidden">
          <RouterLink
            v-for="c in catalog.categories"
            :key="c.id"
            :to="{ name: 'menu', query: { category: String(c.id) } }"
            class="flex items-center gap-3 px-3 py-2.5"
          >
            <img v-if="c.imageUrl" :src="c.imageUrl" class="h-11 w-11 rounded-[10px] object-cover" alt="" />
            <span class="flex-1 text-[14px] font-medium">{{ name(c) }}</span>
            <AppIcon name="chevron" :size="18" class="text-muted" />
          </RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>
