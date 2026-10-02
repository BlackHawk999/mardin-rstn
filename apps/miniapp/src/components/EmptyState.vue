<script setup lang="ts">
defineProps<{ icon?: string; text: string; actionLabel?: string }>();
const emit = defineEmits<{ (e: 'action'): void }>();
</script>

<template>
  <div class="flex min-h-[58dvh] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
    <!-- A sketch illustration (slot) replaces the emoji icon when given -->
    <slot name="art">
      <span v-if="icon" class="text-5xl">{{ icon }}</span>
    </slot>
    <p class="text-muted text-sm">{{ text }}</p>
    <button v-if="actionLabel" type="button" class="btn btn-sm mt-2" @click="emit('action')">{{ actionLabel }}</button>
  </div>
</template>
