import { floorLog2 } from "./math";
import type { PrimeMultiset } from "./types";

export function ownedPrimeCount(capturedPrimes: PrimeMultiset): number {
  return Object.values(capturedPrimes).reduce((total, count) => total + count, 0);
}

export function resonanceRetentionThreshold(capturedPrimes: PrimeMultiset): number {
  return floorLog2(ownedPrimeCount(capturedPrimes));
}

export function applyResonanceRetention(currentResonance: number, capturedPrimes: PrimeMultiset): number {
  const threshold = resonanceRetentionThreshold(capturedPrimes);
  if (currentResonance <= threshold) return currentResonance;
  return threshold + Math.floor((currentResonance - threshold) / 2);
}
