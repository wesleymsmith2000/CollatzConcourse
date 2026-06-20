import { describe, expect, it } from "vitest";
import { chooseHeuristicAction, decisionOwnerId } from "../ai/heuristic";
import { addPrime, applyAction, createInitialState, type GameAction, type GameState } from "../engine";

describe("heuristic AI", () => {
  it("starts and ends its own turn", () => {
    const state = createInitialState(2);
    expect(chooseHeuristicAction(state, state.players[0].id)).toEqual({ type: "startTurn" });
    expect(chooseHeuristicAction({ ...state, phase: "FORCED_TURN_END", forcedTurnEnd: true }, state.players[0].id)).toEqual({ type: "endTurn" });
  });

  it("captures a new distinct prime before a larger duplicate", () => {
    const state = createInitialState(2);
    const withCapture: GameState = {
      ...state,
      phase: "STANDARD_CAPTURE",
      players: [{ ...state.players[0], capturedPrimes: addPrime({}, 11) }, state.players[1]],
      pendingCapture: { playerId: state.players[0].id, source: "standard-step", choices: [7, 11] }
    };
    expect(chooseHeuristicAction(withCapture, state.players[0].id)).toEqual({ type: "capturePrime", prime: 7 });
  });

  it("assigns combat follow-up decisions to the victor", () => {
    const state = createInitialState(2);
    const pending: GameState = {
      ...state,
      phase: "COMBAT_RESOLUTION",
      pendingCombatChoice: {
        kind: "damage",
        victorId: state.players[1].id,
        loserId: state.players[0].id,
        sharedPrimes: [2, 5],
        attackKind: "normal"
      }
    };
    expect(decisionOwnerId(pending)).toBe(state.players[1].id);
    expect(chooseHeuristicAction(pending, state.players[0].id)).toBeUndefined();
    expect(chooseHeuristicAction(pending, state.players[1].id)).toEqual({ type: "applyDamage", prime: 5 });
  });

  it("prioritizes Prime Theft when matching an opponent pulse", () => {
    const state = createInitialState(2);
    const optional: GameState = {
      ...state,
      phase: "OPTIONAL_ACTIONS",
      players: [
        { ...state.players[0], pulse: 6, resonance: 3, capturedPrimes: { 2: 1 } },
        { ...state.players[1], pulse: 6, capturedPrimes: { 3: 2 } }
      ]
    };
    expect(chooseHeuristicAction(optional, state.players[0].id)).toEqual({
      type: "attack",
      defenderId: state.players[1].id,
      initiatingPrime: 2,
      attackKind: "prime-theft"
    });
  });

  it("chooses growth when no favorable combat is available", () => {
    const state = createInitialState(2);
    const optional: GameState = {
      ...state,
      phase: "OPTIONAL_ACTIONS",
      players: [{ ...state.players[0], pulse: 4, resonance: 2 }, { ...state.players[1], pulse: 5 }]
    };
    expect(chooseHeuristicAction(optional, state.players[0].id)).toEqual({ type: "forcedJump" });
  });

  it("completes a growth turn without cycling", () => {
    let state = createInitialState(2);
    const aiId = state.players[0].id;
    let actionCount = 0;

    while (state.activePlayerIndex === 0 && actionCount < 30) {
      const chosen = chooseHeuristicAction(state, decisionOwnerId(state));
      expect(chosen).toBeDefined();
      state = applyAction(state, withDeterministicRoll(chosen!));
      actionCount += 1;
    }

    expect(state.activePlayerIndex).toBe(1);
    expect(state.players.find((player) => player.id === aiId)?.capturedPrimes).not.toEqual({});
    expect(actionCount).toBeLessThan(30);
  });
});

function withDeterministicRoll(action: GameAction): GameAction {
  if (action.type === "startTurn" || action.type === "attack") return { ...action, rollDie: () => 4 };
  return action;
}
