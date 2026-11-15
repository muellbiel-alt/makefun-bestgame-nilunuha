let audioCtx = null;
let muted = false;
let ambientOsc = null;

function initAudio() {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
      startAmbientPad();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function startAmbientPad() {
  if (!audioCtx || ambientOsc) return;
  try {
    ambientOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    ambientOsc.type = 'sine';
    ambientOsc.frequency.setValueAtTime(110, audioCtx.currentTime); // A2
    gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    ambientOsc.connect(gain);
    gain.connect(audioCtx.destination);
    ambientOsc.start();
  } catch {}
}

export function setMuted(m) {
  muted = m;
  if (audioCtx && audioCtx.destination) {
    // If muted, we can lower destination or skip
  }
}

export function isMuted() {
  return muted;
}

export function playPickup(combo = 1) {
  if (muted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const baseFreq = 440 + Math.min(combo * 50, 1000);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

export function playFire() {
  if (muted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

export function playExplosion() {
  if (muted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const bufferSize = audioCtx.sampleRate * 0.3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.linearRampToValueAtTime(100, now + 0.3);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start(now);
  noise.stop(now + 0.3);
}

export function playLevelUp() {
  if (muted) return;
  initAudio();
  if (!audioCtx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const now = audioCtx.currentTime + idx * 0.08;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  });
}

export function playWin() {
  if (muted) return;
  initAudio();
  if (!audioCtx) return;

  const chord = [440, 554.37, 659.25, 880, 1108.73];
  chord.forEach((freq, idx) => {
    const now = audioCtx.currentTime + idx * 0.12;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  });
}

export function playGameOver() {
  if (muted) return;
  initAudio();
  if (!audioCtx) return;

  const notes = [330, 311.13, 293.66, 220];
  notes.forEach((freq, idx) => {
    const now = audioCtx.currentTime + idx * 0.15;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  });
}
