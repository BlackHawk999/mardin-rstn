<script setup lang="ts">
/** End of the menu list: an eight-pointed Seljuk star between two rules and "Afiyet olsun!" (Turkish "bon appétit"). */
</script>

<template>
  <div class="menu-end" aria-hidden="true">
    <div class="flex items-center gap-3">
      <span class="menu-end__rule" />
      <svg viewBox="0 0 24 24" class="text-accent h-6 w-6">
        <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round">
          <rect x="6" y="6" width="12" height="12" />
          <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
          <circle cx="12" cy="12" r="2.2" />
        </g>
      </svg>
      <span class="menu-end__rule menu-end__rule--right" />
    </div>
    <p class="serif text-accent mt-2 text-[17px] italic">Afiyet olsun!</p>
    <p class="text-muted text-[11.5px]">{{ $t('menuEnd.bonAppetit') }}</p>
  </div>
</template>

<style scoped>
.menu-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 0 8px;
  opacity: 0.85;
}
.menu-end__rule {
  width: 72px;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 45%, transparent));
}
.menu-end__rule--right {
  transform: scaleX(-1);
}
</style>
