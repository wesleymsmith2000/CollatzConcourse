import { describe, expect, it } from "vitest";
import {
  addPrime,
  applyAction,
  countAssaultHarmonyDice,
  countShieldDissonanceDice,
  createInitialState,
  createSequenceD6,
  eligibleAttackPrimes,
  resolveCombat
} from "../engine";

describe("combat dice", () => {
  it("counts repeated matching and unmatched factors individually", () => {
    expect(countAssaultHarmonyDice(60, 70)).toBe(3);
    expect(countShieldDissonanceDice(60, 98)).toBe(2);
  });

  it("rerolls 2 and 3 until resolved and scores successes minus failures", () => {
    const result = resolveCombat(
      { id: "a", name: "A", pulse: 2, resonance: 0, capturedPrimes: {}, usedAttackPrimesThisTurn: [] },
      { id: "d", name: "D", pulse: 6, resonance: 0, capturedPrimes: {}, usedAttackPrimesThisTurn: [] },
      createSequenceD6([2, 3, 4, 1])
    );
    expect(result.assault.score).toBe(1);
    expect(result.shield.score).toBe(-1);
    expect(result.outcome).toBe("attacker");
    expect(result.assault.rolls[0].rolls).toEqual([2, 3, 4]);
  });
});

describe("attacks", () => {
  it("requires shared primes, cost, and one use per prime per turn", () => {
    const base = createInitialState(2);
    const state = {
      ...base,
      phase: "OPTIONAL_ACTIONS" as const,
      players: [
        { ...base.players[0], pulse: 60, resonance: 7 },
        { ...base.players[1], pulse: 70 }
      ]
    };

    expect(eligibleAttackPrimes(state.players[0], state.players[1])).toEqual([2, 5]);
    const attacked = applyAction(state, {
      type: "attack",
      defenderId: "player-2",
      initiatingPrime: 2,
      attackKind: "normal",
      rollDie: createSequenceD6([4, 4, 4])
    });

    expect(attacked.players[0].resonance).toBe(5);
    expect(attacked.players[0].usedAttackPrimesThisTurn).toEqual([2]);
  });

  it("tie causes no damage", () => {
    const base = createInitialState(2);
    const state = {
      ...base,
      phase: "OPTIONAL_ACTIONS" as const,
      players: [
        { ...base.players[0], pulse: 2, resonance: 2 },
        { ...base.players[1], pulse: 6 }
      ]
    };
    const attacked = applyAction(state, {
      type: "attack",
      defenderId: "player-2",
      initiatingPrime: 2,
      attackKind: "normal",
      rollDie: createSequenceD6([4])
    });
    expect(attacked.pendingCombatChoice).toBeUndefined();
    expect(attacked.players[0].pulse).toBe(2);
    expect(attacked.players[1].pulse).toBe(6);
  });

  it("standard damage divides one shared prime and grants no capture", () => {
    const base = createInitialState(2);
    const state = {
      ...base,
      phase: "OPTIONAL_ACTIONS" as const,
      players: [
        { ...base.players[0], pulse: 60, resonance: 2 },
        { ...base.players[1], pulse: 70 }
      ]
    };
    const attacked = applyAction(state, {
      type: "attack",
      defenderId: "player-2",
      initiatingPrime: 2,
      attackKind: "normal",
      rollDie: createSequenceD6([4, 4, 4, 1, 1])
    });
    const damaged = applyAction(attacked, { type: "applyDamage", prime: 5 });
    expect(damaged.players[1].pulse).toBe(14);
    expect(damaged.pendingCapture).toBeUndefined();
  });
});

describe("prime theft", () => {
  it("transfers one captured prime, leaves pulses unchanged, and forces turn end", () => {
    const base = createInitialState(2);
    const state = {
      ...base,
      phase: "OPTIONAL_ACTIONS" as const,
      players: [
        { ...base.players[0], pulse: 30, resonance: 2, capturedPrimes: addPrime({}, 11) },
        { ...base.players[1], pulse: 30, capturedPrimes: addPrime({}, 13) }
      ]
    };

    const attacked = applyAction(state, {
      type: "attack",
      defenderId: "player-2",
      initiatingPrime: 2,
      attackKind: "prime-theft",
      rollDie: createSequenceD6([4, 4, 4])
    });
    const stolen = applyAction(attacked, { type: "stealPrime", prime: 13 });
    expect(stolen.players[0].capturedPrimes).toEqual({ 11: 1, 13: 1 });
    expect(stolen.players[1].capturedPrimes).toEqual({});
    expect(stolen.players[0].pulse).toBe(30);
    expect(stolen.players[1].pulse).toBe(30);
    expect(stolen.forcedTurnEnd).toBe(true);
  });
});
