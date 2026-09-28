<script setup lang="ts">
import { haptic } from '@/telegram';
import AppIcon from './AppIcon.vue';

defineProps<{ value: number; small?: boolean; min?: number; light?: boolean }>();
const emit = defineEmits<{ (e: 'change', value: number): void }>();

function change(delta: number, current: number) {
  haptic.light();
  emit('change', current + delta);
}
</script>

<template>
  <div
    class="inline-flex items-center rounded-xl"
    :class="[small ? 'h-8' : 'h-11', light ? 'bg-white/90 shadow-sm' : 'bg-surface-2']"
  >
    <button
      type="button"
      class="text-text flex h-full items-center justify-center disabled:opacity-30"
      :class="small ? 'w-8' : 'w-11'"
      :disabled="value <= (min ?? 0)"
      @click="change(-1, value)"
    >
      <AppIcon name="minus" :size="small ? 14 : 18" />
    </button>
    <span class="min-w-[22px] text-center font-semibold tabular-nums" :class="small ? 'text-[13px]' : 'text-base'">{{ value }}</span>
    <button
      type="button"
      class="text-text flex h-full items-center justify-center"
      :class="small ? 'w-8' : 'w-11'"
      @click="change(1, value)"
    >
      <AppIcon name="plus" :size="small ? 14 : 18" />
    </button>
  </div>
</template>
