<script setup lang="ts">
import type { OrderStatus } from '@rt/shared';
import { statusColor, statusLabel } from '@/utils/format';

defineProps<{ status: OrderStatus }>();
</script>

<template>
  <span class="badge" :class="statusColor[status]">{{ statusLabel[status] }}</span>
</template>
