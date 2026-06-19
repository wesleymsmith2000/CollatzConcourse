import type { CombatRollLog, DieRoller, PoolScore } from "./types";

export function d6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function createSeededD6(seed: number): DieRoller {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return (state % 6) + 1;
  };
}

export function createSequenceD6(rolls: number[]): DieRoller {
  let index = 0;
  return () => {
    const roll = rolls[index] ?? rolls[rolls.length - 1] ?? 4;
    index += 1;
    return roll;
  };
}

export function scoreCombatDice(dice: number, rollDie: DieRoller = d6): PoolScore {
  const logs: CombatRollLog[] = [];
  let score = 0;

  for (let dieIndex = 0; dieIndex < dice; dieIndex += 1) {
    const rolls: number[] = [];
    let resolved = false;
    while (!resolved) {
      const roll = rollDie();
      rolls.push(roll);
      if (roll === 1) {
        score -= 1;
        resolved = true;
      } else if (roll >= 4) {
        score += 1;
        resolved = true;
      }
    }
    logs.push({ dieIndex, rolls, result: rolls[rolls.length - 1] === 1 ? "failure" : "success" });
  }

  return { dice, score, rolls: logs };
}
