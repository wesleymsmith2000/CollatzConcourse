import { describe, expect, it } from "vitest";
import { createInitialState, distinctPrimeCount, harmonyScore, hasVictory, RACE_HARMONY_TARGETS } from "../engine";

describe("Harmony and victory", () => {
  it("counts duplicates for Harmony and ignores duplicates for distinct count", () => {
    const capturedPrimes = { 2: 2, 3: 1, 5: 2, 7: 1 };
    expect(harmonyScore(capturedPrimes)).toBe(24);
    expect(distinctPrimeCount(capturedPrimes)).toBe(4);
  });

  it("requires both 1000 Harmony and 10 distinct primes", () => {
    const player = { id: "p", name: "P", pulse: 1, resonance: 0, usedAttackPrimesThisTurn: [], capturedPrimes: {} };
    expect(hasVictory({ ...player, capturedPrimes: { 501: 2 } })).toBe(false);
    expect(hasVictory({ ...player, capturedPrimes: { 2: 1, 3: 1, 5: 1, 7: 1, 11: 1, 13: 1, 17: 1, 19: 1, 23: 1, 29: 1 } })).toBe(false);
    expect(hasVictory({ ...player, capturedPrimes: { 2: 1, 3: 1, 5: 1, 7: 1, 11: 1, 13: 1, 17: 1, 19: 1, 23: 1, 901: 1 } })).toBe(true);
  });

  it("configures Sprint, Run, and Marathon Harmony targets", () => {
    expect(RACE_HARMONY_TARGETS).toEqual({ sprint: 1_000, run: 50_000, marathon: 1_000_000 });
    expect(createInitialState(2, undefined, "run").harmonyTarget).toBe(50_000);
    expect(createInitialState(2, undefined, "marathon").harmonyTarget).toBe(1_000_000);
  });

  it("checks victory against the selected Harmony target", () => {
    const player = {
      id: "p",
      name: "P",
      pulse: 1,
      resonance: 0,
      usedAttackPrimesThisTurn: [],
      capturedPrimes: { 2: 1, 3: 1, 5: 1, 7: 1, 11: 1, 13: 1, 17: 1, 19: 1, 23: 1, 49_951: 1 }
    };
    expect(hasVictory(player, RACE_HARMONY_TARGETS.run)).toBe(true);
    expect(hasVictory(player, RACE_HARMONY_TARGETS.marathon)).toBe(false);
  });
});
