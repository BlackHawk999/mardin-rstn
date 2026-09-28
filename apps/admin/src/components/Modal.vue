<script setup lang="ts">
defineProps<{ open: boolean; title: string; wide?: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="emit('close')">
      <div class="card flex max-h-[90vh] w-full flex-col" :class="wide ? 'max-w-3xl' : 'max-w-lg'">
        <div class="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 class="text-base font-bold">{{ title }}</h2>
          <button type="button" class="text-muted hover:text-text text-xl leading-none" @click="emit('close')">×</button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <slot />
        </div>
        <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-black/5 px-5 py-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
