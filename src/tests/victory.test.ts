import { describe, expect, it } from "vitest";
import { distinctPrimeCount, harmonyScore, hasVictory } from "../engine";

describe("Harmony and victory", () => {
  it("counts duplicates for Harmony and ignores duplicates for distinct count", () => {
    const capturedPrimes = { 2: 2, 3: 1, 5: 2, 7: 1 };
    expect(harmonyScore(capturedPrimes)).toBe(24);
    expect(distinctPrimeCount(capturedPrimes)).toBe(4);
  });

  it("requires both 200 Harmony and 10 distinct primes", () => {
    const player = { id: "p", name: "P", pulse: 1, resonance: 0, usedAttackPrimesThisTurn: [], capturedPrimes: {} };
    expect(hasVictory({ ...player, capturedPrimes: { 101: 2 } })).toBe(false);
    expect(hasVictory({ ...player, capturedPrimes: { 2: 1, 3: 1, 5: 1, 7: 1, 11: 1, 13: 1, 17: 1, 19: 1, 23: 1, 29: 1 } })).toBe(false);
    expect(hasVictory({ ...player, capturedPrimes: { 2: 1, 3: 1, 5: 1, 7: 1, 11: 1, 13: 1, 17: 1, 19: 1, 23: 1, 101: 1 } })).toBe(true);
  });
});
