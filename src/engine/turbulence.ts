import { floorLog2 } from "./math";
import type { PlayerState } from "./types";

export function turbulenceActionCost(turbulence: number): number {
  return floorLog2(Math.max(0, turbulence) + 1);
}

export function recordOptionalAction(player: PlayerState, prime?: number): PlayerState {
  if (prime === undefined) {
    return { ...player, optionalActionsThisTurn: player.optionalActionsThisTurn + 1 };
  }

  const previousUses = player.primeUsesThisTurn[prime] ?? 0;
  return {
    ...player,
    turbulence: player.turbulence + previousUses,
    primeUsesThisTurn: { ...player.primeUsesThisTurn, [prime]: previousUses + 1 },
    optionalActionsThisTurn: player.optionalActionsThisTurn + 1
  };
}

export function decayTurbulence(turbulence: number, tookOptionalAction: boolean): number {
  const once = Math.floor(Math.max(0, turbulence) / 2);
  return tookOptionalAction ? once : Math.floor(once / 2);
}
