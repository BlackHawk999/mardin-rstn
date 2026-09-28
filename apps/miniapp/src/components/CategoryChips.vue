<script setup lang="ts">
import { watch } from 'vue';
import type { CategoryDto } from '@rt/shared';
import { name } from '@/utils/format';
import { haptic } from '@/telegram';

const props = defineProps<{ categories: CategoryDto[]; modelValue: number | null; withAll?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>();

const chipEls = new Map<number | null, HTMLElement>();
function setRef(id: number | null, el: unknown) {
  if (el instanceof HTMLElement) chipEls.set(id, el);
}

function select(id: number | null) {
  haptic.selection();
  emit('update:modelValue', id);
}

watch(
  () => props.modelValue,
  (id) => chipEls.get(id)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }),
);
</script>

<template>
  <div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
    <button
      v-if="withAll"
      :ref="(el: unknown) => setRef(null, el)"
      type="button"
      class="chip"
      :class="{ 'chip--active': modelValue === null }"
      @click="select(null)"
    >
      {{ $t('common.all') }}
    </button>
    <button
      v-for="c in categories"
      :key="c.id"
      :ref="(el: unknown) => setRef(c.id, el)"
      type="button"
      class="chip"
      :class="{ 'chip--active': modelValue === c.id }"
      @click="select(c.id)"
    >
      {{ name(c) }}
    </button>
  </div>
</template>
