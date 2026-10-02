import { initYmaps, yandexMapLoadError, yandexMapLoadStatus, yandexMapScript } from 'vue-yandex-maps';

const hasYmaps = () => typeof (window as { ymaps3?: unknown }).ymaps3 !== 'undefined';

/**
 * Loads the Yandex Maps JS API, recovering from an earlier failure.
 *
 * When the API script fails to load (key not accepted yet, flaky network), vue-yandex-maps records the error but stays in
 * the "loading" state, so every map opened later in the session waits forever on a blank screen. Here a failed attempt is
 * reset and the script is requested again. Resolves false on failure or timeout; the caller shows a retry button.
 */
export async function loadYmaps(timeoutMs = 12_000): Promise<boolean> {
  if (hasYmaps()) return true;
  if (yandexMapLoadError.value || yandexMapLoadStatus.value === 'error') {
    yandexMapScript.value?.remove();
    yandexMapScript.value = null;
    yandexMapLoadError.value = null;
    yandexMapLoadStatus.value = 'pending';
  }
  let timer: number | undefined;
  try {
    await Promise.race([
      initYmaps(),
      new Promise((_, reject) => (timer = window.setTimeout(() => reject(new Error('Yandex Maps load timeout')), timeoutMs))),
    ]);
    return hasYmaps();
  } catch (e) {
    // Mark the attempt as failed so the next call starts over with a fresh script.
    if (!hasYmaps()) yandexMapLoadError.value ??= e instanceof Error ? e : new Error(String(e));
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}
