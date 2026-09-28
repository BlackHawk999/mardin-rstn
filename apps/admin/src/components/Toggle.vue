<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2 text-[13px]">
    <span class="switch" :class="{ 'switch--on': modelValue }" role="switch" :aria-checked="modelValue" @click.prevent="emit('update:modelValue', !modelValue)" />
    <span v-if="label">{{ label }}</span>
  </label>
</template>
