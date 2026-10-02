/**
 * New-order alert for the admin panel: a two-note chime followed by a female voice saying «Новый заказ!»
 * (public/sounds/new-order.wav, recorded with the Windows "Irina" voice and normalized).
 *
 * Browsers only allow sound after the page has had a user gesture, so the first click / key press on the page
 * unlocks audio; after that alerts play even when the tab is in the background.
 */
const voice = new Audio(`${import.meta.env.BASE_URL}sounds/new-order.wav`);
voice.preload = 'auto';
voice.volume = 1;

let ctx: AudioContext | null = null;

function unlock() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {
    /* no Web Audio */
  }
  // Priming the element inside a gesture lets later play() calls through.
  voice.muted = true;
  voice
    .play()
    .then(() => {
      voice.pause();
      voice.currentTime = 0;
    })
    .catch(() => {})
    .finally(() => (voice.muted = false));
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
}
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

/** Two rising notes, soft attack and decay, clearly audible but not harsh. Resolves when the chime is over. */
function chime(): Promise<void> {
  if (!ctx) return Promise.resolve();
  const notes = [659.25, 987.77]; // E5 → B5
  const start = ctx.currentTime + 0.02;
  notes.forEach((freq, i) => {
    const t = start + i * 0.2;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  });
  return new Promise((resolve) => window.setTimeout(resolve, 550));
}

export async function playNewOrderSound() {
  try {
    await chime();
    voice.currentTime = 0;
    await voice.play();
  } catch {
    /* audio not unlocked yet or blocked */
  }
}
