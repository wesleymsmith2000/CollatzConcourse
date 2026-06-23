import { describe, expect, it } from "vitest";
import {
  applyAction,
  createInitialState,
  decayTurbulence,
  forcedJumpResonanceCost,
  recordOptionalAction,
  turbulenceActionCost,
  type GameState
} from "../engine";

describe("plasma turbulence", () => {
  it("adds the number of previous same-prime uses", () => {
    let player = createInitialState(2).players[0];
    player = recordOptionalAction(player, 2);
    player = recordOptionalAction(player, 2);
    player = recordOptionalAction(player, 2);
    player = recordOptionalAction(player, 2);

    expect(player.primeUsesThisTurn).toEqual({ 2: 4 });
    expect(player.turbulence).toBe(6);
    expect(player.optionalActionsThisTurn).toBe(4);
  });

  it("uses floor(log2(turbulence + 1)) as the universal optional-action surcharge", () => {
    expect(turbulenceActionCost(0)).toBe(0);
    expect(turbulenceActionCost(1)).toBe(1);
    expect(turbulenceActionCost(3)).toBe(2);
    expect(turbulenceActionCost(7)).toBe(3);
    expect(turbulenceActionCost(8)).toBe(3);
    expect(forcedJumpResonanceCost(20, 7)).toBe(7);
  });

  it("tracks repeated prime use across different action types", () => {
    const base = createInitialState(2);
    let state: GameState = {
      ...base,
      phase: "OPTIONAL_ACTIONS" as const,
      players: [
        { ...base.players[0], pulse: 20, resonance: 20, capturedPrimes: { 2: 3 } },
        base.players[1]
      ]
    };

    state = applyAction(state, { type: "modifyPulse", prime: 2, operation: "add", capturePrime: 2 });
    state = applyAction(state, { type: "dividePulse", prime: 2 });

    expect(state.players[0].primeUsesThisTurn).toEqual({ 2: 2 });
    expect(state.players[0].turbulence).toBe(1);
    expect(state.players[0].optionalActionsThisTurn).toBe(2);
  });

  it("halves each turn and receives an additional halving after an idle optional phase", () => {
    expect(decayTurbulence(9, true)).toBe(4);
    expect(decayTurbulence(9, false)).toBe(2);

    const base = createInitialState(2);
    const active = { ...base.players[0], turbulence: 9, optionalActionsThisTurn: 0 };
    const ended = applyAction(
      { ...base, phase: "OPTIONAL_ACTIONS", players: [active, base.players[1]] },
      { type: "endTurn" }
    );

    expect(ended.players[0].turbulence).toBe(2);
    expect(ended.players[0].primeUsesThisTurn).toEqual({});
  });
});
