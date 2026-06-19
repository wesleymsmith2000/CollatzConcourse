import { floorLog2 } from "./math";

export function resonanceRetentionThreshold(pulse: number): number {
  return floorLog2(pulse);
}

export function applyResonanceRetention(currentResonance: number, pulse: number): number {
  const threshold = resonanceRetentionThreshold(pulse);
  if (currentResonance <= threshold) return currentResonance;
  return threshold + Math.floor((currentResonance - threshold) / 2);
}
