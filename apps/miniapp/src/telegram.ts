/**
 * Thin wrapper over window.Telegram.WebApp so the rest of the app never touches the global directly.
 * Outside Telegram (plain browser in dev) every call degrades gracefully.
 */
const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export const isInTelegram = Boolean(tg?.initData);

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  // Fixed palette (see style.css --bg) so the native header matches the page.
  tg.setHeaderColor?.('#f4f3ef');
  tg.setBackgroundColor?.('#f4f3ef');
  tg.setBottomBarColor?.('#f4f3ef');
  tg.enableClosingConfirmation?.();
}

export function getInitData(): string {
  return tg?.initData ?? '';
}

export function getTelegramLanguage(): string | undefined {
  return tg?.initDataUnsafe?.user?.language_code;
}

export function getTelegramPhotoUrl(): string | undefined {
  return (tg?.initDataUnsafe?.user as { photo_url?: string } | undefined)?.photo_url;
}

export const haptic = {
  light: () => tg?.HapticFeedback?.impactOccurred('light'),
  medium: () => tg?.HapticFeedback?.impactOccurred('medium'),
  success: () => tg?.HapticFeedback?.notificationOccurred('success'),
  error: () => tg?.HapticFeedback?.notificationOccurred('error'),
  selection: () => tg?.HapticFeedback?.selectionChanged(),
};

/**
 * Asks Telegram for the user's phone with the native one-tap popup.
 * Resolves with the signed `response` string that the API verifies, or null if the user declined.
 */
export function requestContact(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!tg?.requestContact) return resolve(null);
    // The typings only declare the first argument; Telegram also passes the signed contact payload as the second.
    type ContactCallback = (granted: boolean, data?: { response?: string }) => void;
    (tg.requestContact as unknown as (cb: ContactCallback) => void)((granted, data) => {
      if (!granted || !data?.response) return resolve(null);
      resolve(data.response);
    });
  });
}

/**
 * User's current position: Telegram LocationManager (Bot API 8+) first, browser geolocation as fallback.
 */
export function getLocation(): Promise<{ lat: number; lng: number } | null> {
  type LM = { init: (cb?: (ok: boolean) => void) => void; getLocation: (cb: (d: { latitude: number; longitude: number } | null) => void) => void; isInited: boolean };
  const lm = (tg as unknown as { LocationManager?: LM } | undefined)?.LocationManager;
  if (lm && isInTelegram) {
    return new Promise((resolve) => {
      const ask = () => lm.getLocation((d) => resolve(d ? { lat: d.latitude, lng: d.longitude } : null));
      if (lm.isInited) ask();
      else lm.init(() => ask());
    });
  }
  if (!('geolocation' in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

export function openTelegramLink(url: string) {
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, '_blank');
}

/** Regular web links (maps etc.): Telegram opens them in its in-app browser instead of replacing the mini app. */
export function openExternalLink(url: string) {
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, '_blank');
}

// ---- Main button ----
let mainButtonHandler: (() => void) | null = null;

export function showMainButton(text: string, onClick: () => void, opts: { disabled?: boolean } = {}) {
  if (!tg) return;
  if (mainButtonHandler) tg.MainButton.offClick(mainButtonHandler);
  mainButtonHandler = onClick;
  tg.MainButton.setParams({ text, is_active: !opts.disabled, is_visible: true });
  tg.MainButton.onClick(onClick);
}

export function hideMainButton() {
  if (!tg) return;
  if (mainButtonHandler) tg.MainButton.offClick(mainButtonHandler);
  mainButtonHandler = null;
  tg.MainButton.hide();
}

export function setMainButtonLoading(loading: boolean) {
  if (!tg) return;
  if (loading) tg.MainButton.showProgress(true);
  else tg.MainButton.hideProgress();
}

// ---- Back button ----
let backHandler: (() => void) | null = null;

export function showBackButton(onClick: () => void) {
  if (!tg) return;
  if (backHandler) tg.BackButton.offClick(backHandler);
  backHandler = onClick;
  tg.BackButton.onClick(onClick);
  tg.BackButton.show();
}

export function hideBackButton() {
  if (!tg) return;
  if (backHandler) tg.BackButton.offClick(backHandler);
  backHandler = null;
  tg.BackButton.hide();
}

// ---- Cloud storage (falls back to localStorage outside Telegram) ----
export const cloud = {
  get(key: string): Promise<string | null> {
    if (tg?.CloudStorage && isInTelegram) {
      return new Promise((resolve) => {
        tg.CloudStorage.getItem(key, (err, value) => resolve(err ? null : (value ?? null)));
      });
    }
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },
  set(key: string, value: string): Promise<void> {
    if (tg?.CloudStorage && isInTelegram) {
      return new Promise((resolve) => tg.CloudStorage.setItem(key, value, () => resolve()));
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
    return Promise.resolve();
  },
};

export function showAlert(message: string) {
  if (tg?.showAlert) tg.showAlert(message);
  else alert(message);
}

export function closeApp() {
  tg?.close();
}
