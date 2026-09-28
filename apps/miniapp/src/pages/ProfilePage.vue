<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCatalogStore } from '@/stores/catalog';
import { getTelegramPhotoUrl, haptic, openTelegramLink } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';
import PageHeader from '@/components/PageHeader.vue';

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

function support() {
  const phone = catalog.settings?.restaurantPhone?.replace(/\D/g, '');
  if (phone) openTelegramLink(`https://t.me/+${phone}`);
}
</script>

<template>
  <div class="page space-y-4">
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

    <!-- Credit -->
    <footer class="text-muted pt-6 pb-2 text-center text-[12px] leading-relaxed">
      <p>
        Made with <span class="text-accent inline-block animate-[heartbeat_1.6s_ease-in-out_infinite]" aria-label="love">♥</span> by
        <span class="text-text font-semibold">Elyor</span>
      </p>
      <p class="mt-0.5 text-[11px] opacity-70">{{ catalog.settings?.restaurantName ?? 'Mardin' }} · v{{ appVersion }}</p>
    </footer>
  </div>
</template>
