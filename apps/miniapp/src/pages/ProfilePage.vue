<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCatalogStore } from '@/stores/catalog';
import { getTelegramPhotoUrl, haptic, openExternalLink, openTelegramLink } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';
import PageHeader from '@/components/PageHeader.vue';
import MardinSketch from '@/components/MardinSketch.vue';
import DishesSketch from '@/components/DishesSketch.vue';
import { useSkyPhase, useWeather } from '@/utils/sky';

const auth = useAuthStore();
const catalog = useCatalogStore();

const photoUrl = getTelegramPhotoUrl();
const appVersion = __APP_VERSION__;
const initial = computed(() => (auth.user?.displayName ?? '?').trim().charAt(0).toUpperCase());

const editingName = ref(false);
const nameDraft = ref('');
const nameSaved = ref(false);

function startEditName() {
  nameDraft.value = auth.user?.displayName ?? '';
  editingName.value = true;
}
async function saveName() {
  const value = nameDraft.value.trim();
  editingName.value = false;
  if (!value || value === auth.user?.displayName) return;
  await auth.updateName(value);
  haptic.success();
  nameSaved.value = true;
  window.setTimeout(() => (nameSaved.value = false), 1500);
}

function toggleLanguage() {
  haptic.selection();
  auth.setLanguage(auth.user?.language === 'uz' ? 'ru' : 'uz');
}

const DEVELOPER_TELEGRAM = 'https://t.me/+998886480700';
function openDeveloper() {
  haptic.selection();
  openTelegramLink(DEVELOPER_TELEGRAM);
}

const settings = computed(() => catalog.settings);
const weather = useWeather();
const sky = useSkyPhase(computed(() => settings.value && { lat: settings.value.restaurantLat, lng: settings.value.restaurantLng }));
const phoneHref = computed(() => `tel:${settings.value?.restaurantPhone.replace(/[^\d+]/g, '') ?? ''}`);

function openMap() {
  const s = settings.value;
  if (s?.restaurantLat == null || s.restaurantLng == null) return;
  haptic.selection();
  // whatshere opens the address card for the point (with the "Route" button), not just a bare pin.
  const p = `${s.restaurantLng},${s.restaurantLat}`;
  openExternalLink(`https://yandex.uz/maps/?ll=${p}&z=17&pt=${p}&whatshere%5Bpoint%5D=${p}&whatshere%5Bzoom%5D=17`);
}

function support() {
  const phone = catalog.settings?.restaurantPhone?.replace(/\D/g, '');
  if (phone) openTelegramLink(`https://t.me/+${phone}`);
}
</script>

<template>
  <div class="page relative isolate space-y-4">
    <!-- Decorative old-town sketch behind the header -->
    <div class="profile-sketch" aria-hidden="true"><MardinSketch :phase="sky" :weather="weather" /></div>

    <PageHeader :title="$t('profile.title')" />

    <!-- Identity -->
    <section class="flex items-center gap-4">
      <div class="bg-accent-soft text-accent flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-bold">
        <img v-if="photoUrl" :src="photoUrl" alt="" class="h-full w-full object-cover" />
        <span v-else>{{ initial }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <div v-if="editingName" class="flex gap-2">
          <input v-model="nameDraft" class="input !h-10" maxlength="60" autofocus @keyup.enter="saveName" @blur="saveName" />
        </div>
        <template v-else>
          <p class="truncate text-[18px] font-bold">{{ auth.user?.displayName }}</p>
          <p class="text-muted text-[13px]">{{ auth.user?.phone ?? $t('profile.noPhone') }}</p>
          <p v-if="nameSaved" class="text-success text-[12px]">{{ $t('profile.saved') }}</p>
        </template>
      </div>
    </section>

    <!-- Phone call-to-action when missing -->
    <button v-if="!auth.hasPhone" type="button" class="btn w-full" @click="auth.sharePhone()">
      <AppIcon name="phone" :size="18" /> {{ $t('profile.addPhone') }}
    </button>

    <!-- Menu -->
    <section class="card divide-y divide-black/5 overflow-hidden">
      <RouterLink :to="{ name: 'orders' }" class="flex items-center gap-3 px-4 py-3.5">
        <span class="bg-surface-2 text-accent flex h-9 w-9 items-center justify-center rounded-xl"><AppIcon name="clock" :size="18" /></span>
        <span class="flex-1 text-[14px] font-medium">{{ $t('profile.orders') }}</span>
        <AppIcon name="chevron" :size="18" class="text-muted" />
      </RouterLink>
      <RouterLink :to="{ name: 'addresses' }" class="flex items-center gap-3 px-4 py-3.5">
        <span class="bg-surface-2 text-accent flex h-9 w-9 items-center justify-center rounded-xl"><AppIcon name="pin" :size="18" /></span>
        <span class="flex-1 text-[14px] font-medium">{{ $t('profile.addresses') }}</span>
        <AppIcon name="chevron" :size="18" class="text-muted" />
      </RouterLink>
      <button type="button" class="flex w-full items-center gap-3 px-4 py-3.5 text-left" @click="startEditName">
        <span class="bg-surface-2 text-accent flex h-9 w-9 items-center justify-center rounded-xl"><AppIcon name="edit" :size="18" /></span>
        <span class="flex-1 text-[14px] font-medium">{{ $t('profile.editName') }}</span>
        <AppIcon name="chevron" :size="18" class="text-muted" />
      </button>
      <button type="button" class="flex w-full items-center gap-3 px-4 py-3.5 text-left" @click="toggleLanguage">
        <span class="bg-surface-2 text-accent flex h-9 w-9 items-center justify-center rounded-xl"><AppIcon name="globe" :size="18" /></span>
        <span class="flex-1 text-[14px] font-medium">{{ $t('profile.language') }}</span>
        <span class="text-muted text-[13px]">{{ auth.user?.language === 'uz' ? "O'zbekcha" : 'Русский' }}</span>
        <AppIcon name="chevron" :size="18" class="text-muted" />
      </button>
      <button type="button" class="flex w-full items-center gap-3 px-4 py-3.5 text-left" @click="support">
        <span class="bg-surface-2 text-accent flex h-9 w-9 items-center justify-center rounded-xl"><AppIcon name="help" :size="18" /></span>
        <span class="flex-1 text-[14px] font-medium">{{ $t('profile.help') }}</span>
        <AppIcon name="chevron" :size="18" class="text-muted" />
      </button>
    </section>

    <!-- Restaurant: live status, address, phone -->
    <section v-if="settings" class="card px-4 pt-3.5 pb-1">
      <div class="flex items-center justify-between gap-3">
        <p class="text-[15px] font-bold">{{ settings.restaurantName }}</p>
        <span class="status-chip" :class="catalog.isOpen ? 'status-chip--open' : 'status-chip--closed'">
          <i class="status-chip__dot" />
          {{ catalog.isOpen ? $t('profile.openUntil', { time: settings.closeTime }) : $t('profile.closedUntil', { time: settings.openTime }) }}
        </span>
      </div>
      <p class="text-muted mt-0.5 text-[12.5px]">{{ $t('profile.hours', { open: settings.openTime, close: settings.closeTime }) }}</p>
      <div class="mt-3 divide-y divide-dashed divide-black/10 border-t border-dashed border-black/10">
        <button v-if="settings.restaurantAddress" type="button" class="flex w-full items-center gap-3 py-3 text-left" @click="openMap">
          <AppIcon name="pin" :size="18" class="text-accent flex-shrink-0" />
          <span class="flex-1 text-[13px] leading-snug">{{ settings.restaurantAddress }}</span>
          <AppIcon name="chevron" :size="16" class="text-muted" />
        </button>
        <a v-if="settings.restaurantPhone" :href="phoneHref" class="flex items-center gap-3 py-3">
          <AppIcon name="phone" :size="18" class="text-accent flex-shrink-0" />
          <span class="flex-1 text-[13px]">{{ settings.restaurantPhone }}</span>
          <span class="text-accent text-[12.5px] font-semibold">{{ $t('profile.call') }}</span>
        </a>
      </div>
    </section>

    <!-- Still life sketch, continues the old-town drawing at the top -->
    <DishesSketch class="pt-4" />

    <!-- Credit -->
    <footer class="text-muted pt-1 pb-2 text-center text-[12px] leading-relaxed">
      <p>
        Made with <span class="text-accent inline-block animate-[heartbeat_1.6s_ease-in-out_infinite]" aria-label="love">♥</span> by
        <a :href="DEVELOPER_TELEGRAM" class="credit-link" @click.prevent="openDeveloper">Elyor</a>
      </p>
      <p class="mt-0.5 text-[11px] opacity-70">{{ catalog.settings?.restaurantName ?? 'Mardin' }} · v{{ appVersion }}</p>
    </footer>
  </div>
</template>
