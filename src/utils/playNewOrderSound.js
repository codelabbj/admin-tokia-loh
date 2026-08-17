/**
 * Débloque l'audio après une première interaction (politique autoplay des navigateurs).
 */
let audioCtx = null;
let unlocked = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

export function unlockNotificationSound() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().then(() => {
      unlocked = true;
    }).catch(() => {});
  } else {
    unlocked = true;
  }
}

/**
 * Petit double bip (type notification commande).
 * Sans fichier audio — Web Audio API.
 */
export function playNewOrderSound() {
  const ctx = getCtx();
  if (!ctx) return;

  const start = () => {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    const playTone = (freq, t0, duration) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0);
      osc.connect(gain);
      osc.start(t0);
      osc.stop(t0 + duration);
    };

    playTone(880, now, 0.16);
    playTone(1174.7, now + 0.14, 0.22);
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(() => {
      unlocked = true;
      start();
    }).catch(() => {});
    return;
  }

  unlocked = true;
  start();
}
