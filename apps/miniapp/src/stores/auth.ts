import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { UserDto } from '@rt/shared';
import { api, ApiError } from '@/api/client';
import { i18n } from '@/i18n';
import { requestContact, isInTelegram } from '@/telegram';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const hasPhone = computed(() => Boolean(user.value?.phone));

  async function init() {
    loading.value = true;
    error.value = null;
    try {
      user.value = await api.me();
      i18n.global.locale.value = user.value.language;
    } catch (e) {
      error.value = e instanceof ApiError ? e.code : 'network';
    } finally {
      loading.value = false;
    }
  }

  async function updateName(displayName: string) {
    user.value = await api.updateMe({ displayName });
  }

  async function setLanguage(language: 'ru' | 'uz') {
    i18n.global.locale.value = language;
    user.value = await api.updateMe({ language });
  }

  /** One-tap phone sharing through Telegram. Returns true when the phone was saved. */
  async function sharePhone(): Promise<boolean> {
    if (isInTelegram) {
      const response = await requestContact();
      if (!response) return false;
      user.value = await api.savePhone({ response });
      return true;
    }
    // Dev fallback outside Telegram.
    const phone = window.prompt('Dev mode: enter phone', '+998901234567');
    if (!phone) return false;
    user.value = await api.savePhone({ phone });
    return true;
  }

  return { user, loading, error, hasPhone, init, updateName, setLanguage, sharePhone };
});
