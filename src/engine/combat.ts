import { countAssaultHarmonyDice, countShieldDissonanceDice, sharedPrimeValues } from "./math";
import { scoreCombatDice } from "./dice";
import type { CombatResult, DieRoller, PlayerState } from "./types";
import { turbulenceActionCost } from "./turbulence";

export function eligibleAttackPrimes(attacker: PlayerState, defender: PlayerState): number[] {
  const used = new Set(attacker.usedAttackPrimesThisTurn);
  return sharedPrimeValues(attacker.pulse, defender.pulse).filter(
    (prime) => !used.has(prime) && attacker.resonance >= prime + turbulenceActionCost(attacker.turbulence)
  );
}

export function canDeclarePrimeTheft(attacker: PlayerState, defender: PlayerState): boolean {
  return (
    attacker.pulse === defender.pulse &&
    Object.keys(attacker.capturedPrimes).length > 0 &&
    Object.keys(defender.capturedPrimes).length > 0
  );
}

export function resolveCombat(attacker: PlayerState, defender: PlayerState, rollDie?: DieRoller): CombatResult {
  const assault = scoreCombatDice(countAssaultHarmonyDice(attacker.pulse, defender.pulse), rollDie);
  const shield = scoreCombatDice(countShieldDissonanceDice(attacker.pulse, defender.pulse), rollDie);
  const outcome = assault.score > shield.score ? "attacker" : shield.score > assault.score ? "defender" : "tie";
  return { assault, shield, outcome };
}
