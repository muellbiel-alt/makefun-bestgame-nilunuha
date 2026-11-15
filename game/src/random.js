let seedValue = 1;

export function setSeed(seed) {
  seedValue = typeof seed === 'number' ? seed : 1;
}

// Mulberry32 seeded RNG
export function random() {
  let t = seedValue += 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomRange(min, max) {
  return min + random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function randomChoice(arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[randomInt(0, arr.length - 1)];
}
