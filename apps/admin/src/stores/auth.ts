import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, ApiError, setUnauthorizedHandler, tokenStore } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const name = ref<string | null>(null);
  const ready = ref(false);

  async function init() {
    setUnauthorizedHandler(() => logout());
    if (tokenStore.get()) {
      try {
        name.value = (await api.me()).name;
      } catch {
        tokenStore.set(null);
      }
    }
    ready.value = true;
  }

  async function login(login: string, password: string): Promise<string | null> {
    try {
      const { token } = await api.login(login, password);
      tokenStore.set(token);
      name.value = login;
      return null;
    } catch (e) {
      return e instanceof ApiError && e.status === 401 ? 'Неверный логин или пароль' : 'Нет связи с сервером';
    }
  }

  function logout() {
    tokenStore.set(null);
    name.value = null;
  }

  return { name, ready, init, login, logout, isAuthed: () => name.value !== null };
});
