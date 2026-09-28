<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const login = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  busy.value = true;
  error.value = '';
  const err = await auth.login(login.value.trim(), password.value);
  busy.value = false;
  if (err) {
    error.value = err;
    return;
  }
  router.replace(typeof route.query.next === 'string' ? route.query.next : { name: 'dashboard' });
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <form class="card w-full max-w-sm space-y-4 p-8" @submit.prevent="submit">
      <div class="text-center">
        <div class="text-accent text-2xl font-bold tracking-[0.14em] uppercase" style="font-family: Georgia, serif">Mardin</div>
        <div class="text-muted text-[10px] tracking-[0.3em] uppercase">Панель управления</div>
      </div>
      <div>
        <label class="label">Логин</label>
        <input v-model="login" class="input" autocomplete="username" required />
      </div>
      <div>
        <label class="label">Пароль</label>
        <input v-model="password" type="password" class="input" autocomplete="current-password" required />
      </div>
      <p v-if="error" class="text-danger text-xs">{{ error }}</p>
      <button type="submit" class="btn w-full" :disabled="busy">Войти</button>
    </form>
  </div>
</template>
