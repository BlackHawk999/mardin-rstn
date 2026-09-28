/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEV_TELEGRAM_ID?: string;
  readonly VITE_YANDEX_MAPS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare global {
  /** Mini app version from package.json (injected by Vite). */
  const __APP_VERSION__: string;

  interface Window {
    Telegram?: import('@twa-dev/types').Telegram;
  }
}
export {};
