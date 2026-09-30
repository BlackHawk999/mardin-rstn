<script setup lang="ts">
import { nextTick, onActivated, ref, watch } from 'vue';
import type { CategoryDto } from '@rt/shared';
import { name } from '@/utils/format';
import { haptic } from '@/telegram';

const props = defineProps<{ categories: CategoryDto[]; modelValue: number | null; withAll?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>();

const scroller = ref<HTMLElement>();
const chipEls = new Map<number | null, HTMLElement>();
function setRef(id: number | null, el: unknown) {
  if (el instanceof HTMLElement) chipEls.set(id, el);
}

function select(id: number | null) {
  haptic.selection();
  emit('update:modelValue', id);
}

/** Centers the active chip by scrolling only the strip (scrollIntoView could also scroll the page). */
function centerActive(behavior: ScrollBehavior) {
  const box = scroller.value;
  const chip = chipEls.get(props.modelValue);
  if (!box || !chip) return;
  box.scrollTo({ left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2, behavior });
}

// On mount (e.g. /menu?category=13 opened from the home page) jump straight to the active chip;
// categories may arrive after mount, so re-run when they do. Later selections scroll smoothly.
let shown = false;
watch(
  () => [props.modelValue, props.categories.length] as const,
  async () => {
    await nextTick();
    centerActive(shown ? 'smooth' : 'instant');
    if (chipEls.has(props.modelValue)) shown = true;
  },
  { immediate: true },
);
// Pages are kept alive (App.vue): coming back re-attaches the DOM with the strip's scroll reset to 0.
onActivated(() => centerActive('instant'));
</script>

<template>
  <div ref="scroller" class="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
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
