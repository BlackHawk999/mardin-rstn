import { nextTick, onActivated, onDeactivated, onMounted, onBeforeUnmount } from 'vue';

/** True when the previous page in this tab belongs to the app (so router.back() stays inside it). */
export function canGoBack(): boolean {
  return Boolean((window.history.state as { back?: string | null } | null)?.back);
}

/** True when we arrived here with "back" (there is a page ahead of us in history). */
function cameBack(): boolean {
  return Boolean((window.history.state as { forward?: string | null } | null)?.forward);
}

/** Scrolls to `y` once the page is tall enough (content may still be rendering / loading on a slow phone). */
export function scrollWhenReady(y: number, timeoutMs = 1500): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now();
    const tick = () => {
      const tallEnough = document.documentElement.scrollHeight >= y + window.innerHeight;
      if (tallEnough || performance.now() - started > timeoutMs) {
        window.scrollTo(0, y);
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    tick();
  });
}

/**
 * For kept-alive list pages (Home, Menu): remembers the scroll position while the page is on screen
 * and restores it when the user comes back from a dish page, independent of browser history quirks.
 */
export function useKeepScroll() {
  let y = 0;
  let active = false;
  const onScroll = () => {
    if (active) y = window.scrollY;
  };

  const start = async () => {
    const restore = cameBack() && y > 0;
    active = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    if (restore) {
      await nextTick();
      await scrollWhenReady(y);
    }
  };
  const stop = () => {
    active = false; // freeze `y` before the next page changes window.scrollY
    window.removeEventListener('scroll', onScroll);
  };

  onMounted(start);
  onActivated(start);
  onDeactivated(stop);
  onBeforeUnmount(stop);
}
