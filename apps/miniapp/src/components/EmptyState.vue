<script setup lang="ts">
defineProps<{ icon?: string; text: string; actionLabel?: string }>();
const emit = defineEmits<{ (e: 'action'): void }>();
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <span v-if="icon" class="text-5xl">{{ icon }}</span>
    <p class="text-muted text-sm">{{ text }}</p>
    <button v-if="actionLabel" type="button" class="btn btn-sm mt-2" @click="emit('action')">{{ actionLabel }}</button>
  </div>
</template>
