<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { AdminBannerDto, AdminCategoryDto, AdminDishDto } from '@rt/shared';
import { api, ApiError, type BannerInput } from '@/api/client';
import ImageUpload from '@/components/ImageUpload.vue';
import Modal from '@/components/Modal.vue';
import Toggle from '@/components/Toggle.vue';

const banners = ref<AdminBannerDto[]>([]);
const categories = ref<AdminCategoryDto[]>([]);
const dishes = ref<AdminDishDto[]>([]);

const open = ref(false);
const editing = ref<number | null>(null);
const form = ref<BannerInput>({});
const error = ref('');

async function load() {
  [banners.value, categories.value, dishes.value] = await Promise.all([api.banners(), api.categories(), api.dishes()]);
}

function openEditor(b?: AdminBannerDto) {
  editing.value = b?.id ?? null;
  form.value = b
    ? { imageUrl: b.imageUrl, titleRu: b.titleRu, titleUz: b.titleUz, subtitleRu: b.subtitleRu, subtitleUz: b.subtitleUz, categoryId: b.categoryId, dishId: b.dishId, isActive: b.isActive }
    : { imageUrl: '', titleRu: '', titleUz: '', subtitleRu: '', subtitleUz: '', categoryId: null, dishId: null, isActive: true };
  error.value = '';
  open.value = true;
}

async function save() {
  try {
    if (editing.value === null) await api.createBanner(form.value);
    else await api.updateBanner(editing.value, form.value);
    open.value = false;
    await load();
  } catch (e) {
    error.value = e instanceof ApiError ? 'Нужно изображение' : 'Нет связи';
  }
}

async function toggleActive(b: AdminBannerDto) {
  await api.updateBanner(b.id, { isActive: !b.isActive });
  await load();
}

async function remove(b: AdminBannerDto) {
  if (!confirm('Удалить баннер?')) return;
  await api.deleteBanner(b.id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Баннеры</h1>
      <button type="button" class="btn" @click="openEditor()">+ Баннер</button>
    </div>
    <p class="text-muted text-xs">Показываются каруселью на главной. Тап по баннеру ведёт в категорию или на блюдо.</p>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="b in banners" :key="b.id" class="card overflow-hidden" :class="{ 'opacity-50': !b.isActive }">
        <div class="relative aspect-[2/1] bg-surface-2">
          <img :src="b.imageUrl" class="h-full w-full object-cover" alt="" />
          <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent p-4 text-white">
            <p class="font-bold">{{ b.titleRu }}</p>
            <p class="text-xs opacity-90">{{ b.subtitleRu }}</p>
          </div>
        </div>
        <div class="flex items-center justify-between p-3">
          <Toggle :model-value="b.isActive" label="Активен" @update:model-value="toggleActive(b)" />
          <div class="flex gap-1">
            <button type="button" class="btn btn-ghost btn-sm" @click="openEditor(b)">Изменить</button>
            <button type="button" class="btn btn-danger btn-sm" @click="remove(b)">Удалить</button>
          </div>
        </div>
      </div>
      <p v-if="banners.length === 0" class="text-muted col-span-full py-10 text-center">Баннеров нет</p>
    </div>

    <Modal :open="open" :title="editing === null ? 'Новый баннер' : 'Баннер'" wide @close="open = false">
      <div class="grid gap-5 md:grid-cols-[1fr_260px]">
        <div class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="label">Заголовок (рус)</label><input v-model="form.titleRu" class="input" /></div>
            <div><label class="label">Sarlavha (o'zb)</label><input v-model="form.titleUz" class="input" /></div>
            <div><label class="label">Подзаголовок (рус)</label><input v-model="form.subtitleRu" class="input" /></div>
            <div><label class="label">Izoh (o'zb)</label><input v-model="form.subtitleUz" class="input" /></div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="label">Ведёт в категорию</label>
              <select v-model="form.categoryId" class="select"><option :value="null">—</option><option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nameRu }}</option></select>
            </div>
            <div>
              <label class="label">или на блюдо</label>
              <select v-model="form.dishId" class="select"><option :value="null">—</option><option v-for="d in dishes" :key="d.id" :value="d.id">{{ d.nameRu }}</option></select>
            </div>
          </div>
          <Toggle v-model="form.isActive as boolean" label="Активен" />
        </div>
        <div><label class="label">Изображение (2:1)</label><ImageUpload v-model="form.imageUrl" aspect="aspect-[2/1]" /></div>
      </div>
      <p v-if="error" class="text-danger mt-2 text-xs">{{ error }}</p>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="open = false">Отмена</button>
        <button type="button" class="btn" @click="save">Сохранить</button>
      </template>
    </Modal>
  </div>
</template>
