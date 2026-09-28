<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/api/client';

const props = defineProps<{ modelValue: string | null | undefined; aspect?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string | null): void }>();

const uploading = ref(false);
const error = ref('');
const inputEl = ref<HTMLInputElement | null>(null);

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  error.value = '';
  try {
    const { url } = await api.upload(file);
    emit('update:modelValue', url);
  } catch {
    error.value = 'Не удалось загрузить: нужен файл jpg, png, webp или heic до 20 МБ';
  } finally {
    uploading.value = false;
    if (inputEl.value) inputEl.value.value = '';
  }
}
</script>

<template>
  <div>
    <div class="bg-surface-2 relative overflow-hidden rounded-xl" :class="aspect ?? 'aspect-[4/3]'">
      <img v-if="props.modelValue" :src="props.modelValue" class="h-full w-full object-cover" alt="" />
      <div v-else class="text-muted flex h-full items-center justify-center text-xs">Нет фото</div>
      <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-semibold">Загрузка…</div>
    </div>
    <div class="mt-2 flex gap-2">
      <label class="btn btn-secondary btn-sm cursor-pointer">
        {{ props.modelValue ? 'Заменить' : 'Загрузить' }}
        <input ref="inputEl" type="file" accept="image/*" class="hidden" @change="onFile" />
      </label>
      <button v-if="props.modelValue" type="button" class="btn btn-ghost btn-sm" @click="emit('update:modelValue', null)">Убрать</button>
    </div>
    <input :value="props.modelValue ?? ''" class="input mt-2 !h-8 text-xs" placeholder="или ссылка на изображение" @change="emit('update:modelValue', ($event.target as HTMLInputElement).value || null)" />
    <p v-if="error" class="text-danger mt-1 text-xs">{{ error }}</p>
  </div>
</template>
