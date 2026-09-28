<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue';

/**
 * Header block that stays pinned to the top of the screen while the page scrolls
 * (search button + category filters). Gets a soft shadow once content slides under it.
 */
const scrolled = ref(false);

function onScroll() {
  scrolled.value = window.scrollY > 4;
}
function listen() {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
function unlisten() {
  window.removeEventListener('scroll', onScroll);
}

onMounted(listen);
onActivated(listen); // pages are kept alive between tabs
onDeactivated(unlisten);
onBeforeUnmount(unlisten);
</script>

<template>
  <div class="sticky-top" :class="{ 'sticky-top--scrolled': scrolled }">
    <slot />
  </div>
</template>
