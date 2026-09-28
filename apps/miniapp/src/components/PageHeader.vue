<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { hideBackButton, showBackButton } from '@/telegram';
import AppIcon from './AppIcon.vue';
import { canGoBack } from '@/composables/useKeepScroll';

const props = defineProps<{ title?: string; back?: boolean | string }>();
const router = useRouter();

function goBack() {
  if (typeof props.back === 'string') router.push(props.back);
  else if (canGoBack()) router.back();
  else router.push({ name: 'home' });
}

onMounted(() => {
  if (props.back) showBackButton(goBack);
});
onBeforeUnmount(() => {
  if (props.back) hideBackButton();
});
</script>

<template>
  <header class="mb-4 flex h-11 items-center gap-2">
    <button v-if="back" type="button" class="icon-btn -ml-1" @click="goBack">
      <AppIcon name="back" />
    </button>
    <div class="min-w-0 flex-1" :class="back ? 'text-center' : ''">
      <slot name="title">
        <h1 class="truncate text-[17px] font-bold" :class="back ? 'pr-10' : 'text-[22px]'">{{ title }}</h1>
      </slot>
    </div>
    <div class="flex items-center gap-2">
      <slot name="right" />
    </div>
  </header>
</template>
