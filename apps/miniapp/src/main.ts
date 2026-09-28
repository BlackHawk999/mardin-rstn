import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createYmaps } from 'vue-yandex-maps';
import App from './App.vue';
import { router } from './router';
import { i18n } from './i18n';
import { initTelegram } from './telegram';
import './style.css';

initTelegram();

const app = createApp(App).use(createPinia()).use(router).use(i18n);

// Yandex Maps loads lazily on the first map page; without a key the page shows a manual-entry fallback.
if (import.meta.env.VITE_YANDEX_MAPS_KEY) {
  app.use(createYmaps({ apikey: import.meta.env.VITE_YANDEX_MAPS_KEY, lang: 'ru_RU' }));
}

app.mount('#app');
