<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { LngLat, YMap } from '@yandex/ymaps3-types';
import { YandexMap, YandexMapDefaultFeaturesLayer, YandexMapDefaultSchemeLayer, YandexMapListener } from 'vue-yandex-maps';
import { api } from '@/api/client';
import { useCartStore } from '@/stores/cart';
import { useCatalogStore } from '@/stores/catalog';
import { getLocation, haptic, hideBackButton, showBackButton } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';

const { locale } = useI18n();
const router = useRouter();
const cart = useCartStore();
const catalog = useCatalogStore();

const hasKey = Boolean(import.meta.env.VITE_YANDEX_MAPS_KEY);

const map = shallowRef<YMap | null>(null);
// Yandex Maps JS API v3 uses [lng, lat]
const center = ref<[number, number]>([catalog.settings?.restaurantLng ?? 69.2401, catalog.settings?.restaurantLat ?? 41.3111]);
const zoom = ref(16);
const moving = ref(false);
const geocoding = ref(false);
const locating = ref(false);

const addressText = ref('');
const label = ref('');
const comment = ref('');
const saving = ref(false);

let debounce: number | undefined;

async function reverseGeocode() {
  if (!hasKey) return;
  geocoding.value = true;
  try {
    const [lng, lat] = center.value;
    const res = await api.reverseGeocode(lat, lng, locale.value as 'ru' | 'uz');
    addressText.value = res.text || res.full;
  } catch {
    /* keep previous text; user can type manually */
  } finally {
    geocoding.value = false;
  }
}

function onUpdate(e: { location: { center: LngLat; zoom: number } }) {
  center.value = [e.location.center[0], e.location.center[1]];
  zoom.value = e.location.zoom;
  moving.value = true;
  window.clearTimeout(debounce);
  debounce = window.setTimeout(() => {
    moving.value = false;
    reverseGeocode();
  }, 400);
}

/** Moves the map to the user's position. Returns false when it is unavailable or the user declined. */
async function locateMe(withHaptic = true): Promise<boolean> {
  locating.value = true;
  if (withHaptic) haptic.light();
  try {
    const pos = await getLocation();
    if (!pos) return false;
    center.value = [pos.lng, pos.lat];
    map.value?.setLocation({ center: [pos.lng, pos.lat], zoom: 17, duration: 500 });
    await reverseGeocode();
    return true;
  } finally {
    locating.value = false;
  }
}

const canSave = computed(() => addressText.value.trim().length >= 3 && !saving.value);

async function save() {
  if (!canSave.value) return;
  saving.value = true;
  try {
    const [lng, lat] = center.value;
    const created = await api.createAddress({
      label: label.value.trim() || undefined,
      text: addressText.value.trim(),
      comment: comment.value.trim() || undefined,
      lat,
      lng,
    });
    cart.addressId = created.id;
    haptic.success();
    router.back();
  } finally {
    saving.value = false;
  }
}

function goBack() {
  router.back();
}

// A new delivery address starts where the user is; the restaurant is only the fallback when location is unavailable.
onMounted(async () => {
  showBackButton(goBack);
  await catalog.load();
  if (await locateMe(false)) return;
  center.value = [catalog.settings?.restaurantLng ?? 69.2401, catalog.settings?.restaurantLat ?? 41.3111];
  map.value?.setLocation({ center: center.value, zoom: 16 });
  if (hasKey) reverseGeocode();
});
onBeforeUnmount(() => {
  hideBackButton();
  window.clearTimeout(debounce);
});
</script>

<template>
  <div class="fixed inset-0 flex flex-col">
    <!-- Map -->
    <div class="relative flex-1 bg-surface-2">
      <template v-if="hasKey">
        <YandexMap v-model="map" :settings="{ location: { center, zoom }, showScaleInCopyrights: true }" height="100%" width="100%">
          <YandexMapDefaultSchemeLayer />
          <YandexMapDefaultFeaturesLayer />
          <YandexMapListener :settings="{ onUpdate }" />
        </YandexMap>

        <!-- Center pin (stays fixed while the map moves underneath) -->
        <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full transition-transform" :class="moving ? '-translate-y-[calc(100%+10px)]' : ''">
          <div class="relative flex flex-col items-center">
            <div class="bg-accent flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white text-white shadow-lg">
              <AppIcon name="pin" :size="18" filled />
            </div>
            <div class="bg-accent -mt-0.5 h-3 w-[3px] rounded-full" />
            <div class="absolute -bottom-1 h-1.5 w-4 rounded-full bg-black/25 blur-[1px]" />
          </div>
        </div>
      </template>

      <div v-else class="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <AppIcon name="pin" :size="36" class="text-muted" />
        <p class="text-[14px] font-semibold">{{ $t('map.noKeyTitle') }}</p>
        <p class="text-muted text-[12px]">{{ $t('map.noKeyHint') }}</p>
      </div>

      <!-- Overlay controls -->
      <div class="absolute inset-x-0 top-0 flex items-start justify-between p-4" :style="{ paddingTop: 'calc(16px + var(--safe-top))' }">
        <button type="button" class="icon-btn icon-btn--glass" @click="goBack"><AppIcon name="back" /></button>
        <button type="button" class="icon-btn icon-btn--glass" :disabled="locating" @click="locateMe()">
          <AppIcon name="target" :size="20" :class="locating ? 'animate-pulse' : ''" />
        </button>
      </div>
    </div>

    <!-- Bottom sheet -->
    <div class="bg-surface rounded-t-[26px] px-4 pt-3 shadow-[0_-10px_30px_rgba(42,31,24,0.12)]" :style="{ paddingBottom: 'calc(16px + var(--safe-bottom))' }">
      <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10" />

      <p class="text-muted mb-1 text-[11px] font-semibold tracking-wide uppercase">{{ $t('map.deliveryAddress') }}</p>
      <div class="flex min-h-[44px] items-center gap-2">
        <AppIcon name="pin" :size="18" class="text-accent flex-shrink-0" />
        <p v-if="(locating || geocoding) && !addressText" class="text-muted text-[14px]">{{ locating ? $t('map.findingYou') : $t('map.locating') }}</p>
        <input v-else v-model="addressText" class="input !h-10 !bg-transparent !px-0 text-[15px] font-medium" :placeholder="$t('addresses.text')" />
      </div>
      <div class="mt-1 space-y-2">
        <input v-model="label" class="input" maxlength="40" :placeholder="$t('addresses.label')" />
        <input v-model="comment" class="input" maxlength="200" :placeholder="$t('addresses.comment')" />
      </div>
      <button type="button" class="btn mt-3 w-full" :disabled="!canSave" @click="save">
        {{ saving ? $t('common.loading') : $t('addresses.save') }}
      </button>
    </div>
  </div>
</template>
