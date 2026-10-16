/** Tiny synthesized sound effects (Web Audio) so no audio assets or licences are needed. */
export type SoundName = 'correct' | 'wrong' | 'tap' | 'success' | 'chest' | 'badge' | 'unlock';

const STORAGE_KEY = 'okuma-sound';

let ctx: AudioContext | null = null;
let enabled = typeof localStorage === 'undefined' || localStorage.getItem(STORAGE_KEY) !== 'off';

export const isSoundOn = () => enabled;

export function setSoundOn(on: boolean) {
  enabled = on;
  localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
}

type Note = [freq: number, start: number, duration: number, type?: OscillatorType];

const SOUNDS: Record<SoundName, Note[]> = {
  tap: [[660, 0, 0.05, 'triangle']],
  correct: [
    [660, 0, 0.1],
    [990, 0.08, 0.16],
  ],
  wrong: [
    [220, 0, 0.15, 'square'],
    [180, 0.12, 0.2, 'square'],
  ],
  success: [
    [523, 0, 0.12],
    [659, 0.1, 0.12],
    [784, 0.2, 0.25],
  ],
  chest: [
    [392, 0, 0.1, 'triangle'],
    [523, 0.1, 0.1, 'triangle'],
    [659, 0.2, 0.1, 'triangle'],
    [1047, 0.3, 0.4, 'triangle'],
  ],
  badge: [
    [784, 0, 0.1],
    [1047, 0.1, 0.1],
    [1319, 0.2, 0.3],
  ],
  unlock: [
    [330, 0, 0.12, 'sawtooth'],
    [494, 0.12, 0.12, 'sawtooth'],
    [659, 0.24, 0.3, 'sawtooth'],
  ],
};

export function playSound(name: SoundName) {
  if (!enabled || typeof AudioContext === 'undefined') return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  const now = ctx.currentTime;
  for (const [freq, start, duration, type = 'sine'] of SOUNDS[name]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.15, now + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.02);
  }
}
