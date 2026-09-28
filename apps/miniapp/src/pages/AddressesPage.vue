<script setup lang="ts">
import { onActivated, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { AddressDto } from '@rt/shared';
import { api } from '@/api/client';
import { useCartStore } from '@/stores/cart';
import { haptic } from '@/telegram';
import AppIcon from '@/components/AppIcon.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageHeader from '@/components/PageHeader.vue';

const cart = useCartStore();
const router = useRouter();
const hasMap = Boolean(import.meta.env.VITE_YANDEX_MAPS_KEY);

const addresses = ref<AddressDto[]>([]);
const loading = ref(true);
const form = ref<{ id: number | null; label: string; text: string; comment: string } | null>(null);
const saving = ref(false);

async function load() {
  addresses.value = await api.addresses();
}

function startAdd() {
  if (hasMap) router.push({ name: 'address-map' });
  else form.value = { id: null, label: '', text: '', comment: '' };
}
function startEdit(a: AddressDto) {
  form.value = { id: a.id, label: a.label ?? '', text: a.text, comment: a.comment ?? '' };
}

async function save() {
  if (!form.value || form.value.text.trim().length < 3 || saving.value) return;
  saving.value = true;
  try {
    const payload = { label: form.value.label.trim() || null, text: form.value.text.trim(), comment: form.value.comment.trim() || null };
    if (form.value.id === null) {
      const created = await api.createAddress({ ...payload, label: payload.label ?? undefined, comment: payload.comment ?? undefined });
      if (created.isDefault) cart.addressId = created.id;
    } else {
      await api.updateAddress(form.value.id, payload);
    }
    haptic.success();
    form.value = null;
    await load();
  } finally {
    saving.value = false;
  }
}

async function makeDefault(id: number) {
  haptic.selection();
  await api.setDefaultAddress(id);
  cart.addressId = id;
  await load();
}

async function remove(id: number) {
  await api.deleteAddress(id);
  await load();
  if (cart.addressId === id) cart.addressId = addresses.value.find((a) => a.isDefault)?.id ?? null;
}

onMounted(async () => {
  try {
    await load();
  } finally {
    loading.value = false;
  }
});
onActivated(load);
</script>

<template>
  <div class="page page--bar">
    <PageHeader :title="$t('addresses.title')" back="/profile" />

    <p v-if="loading" class="text-muted py-10 text-center text-sm">{{ $t('common.loading') }}</p>
    <EmptyState v-else-if="addresses.length === 0 && !form" icon="📍" :text="$t('addresses.empty')" />

    <div v-else class="space-y-3">
      <div v-for="a in addresses" :key="a.id" class="card flex items-start gap-3 p-4">
        <button type="button" class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2" :class="a.isDefault ? 'border-accent' : 'border-black/20'" @click="makeDefault(a.id)">
          <span v-if="a.isDefault" class="bg-accent h-2.5 w-2.5 rounded-full" />
        </button>
        <div class="min-w-0 flex-1">
          <p class="text-[14px] font-semibold">
            {{ a.label || a.text }}
            <span v-if="a.isDefault" class="bg-accent-soft text-accent ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold">{{ $t('addresses.default') }}</span>
          </p>
          <p class="text-muted text-[12px] leading-snug">{{ a.label ? a.text : '' }}{{ a.label && a.comment ? ', ' : '' }}{{ a.comment }}</p>
        </div>
        <div class="text-muted flex flex-shrink-0 items-center gap-1">
          <button type="button" class="p-1.5" @click="startEdit(a)"><AppIcon name="edit" :size="17" /></button>
          <button type="button" class="p-1.5" @click="remove(a.id)"><AppIcon name="trash" :size="17" /></button>
        </div>
      </div>
    </div>

    <!-- Add / edit form -->
    <div v-if="form" class="card mt-3 space-y-2.5 p-4">
      <input v-model="form.label" class="input" maxlength="40" :placeholder="$t('addresses.label')" />
      <input v-model="form.text" class="input" maxlength="200" :placeholder="$t('addresses.text')" />
      <input v-model="form.comment" class="input" maxlength="200" :placeholder="$t('addresses.comment')" />
      <div class="flex gap-2 pt-1">
        <button type="button" class="btn btn-ghost btn-sm flex-1" @click="form = null">{{ $t('common.cancel') }}</button>
        <button type="button" class="btn btn-sm flex-1" :disabled="form.text.trim().length < 3 || saving" @click="save">{{ $t('common.save') }}</button>
      </div>
    </div>

    <div v-if="!form" class="action-bar action-bar--above-nav">
      <button type="button" class="btn w-full" @click="startAdd"><AppIcon :name="hasMap ? 'map' : 'plus'" :size="18" /> {{ $t('addresses.add') }}</button>
    </div>
  </div>
</template>
