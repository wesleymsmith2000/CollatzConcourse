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

  it("switches to the highest-Harmony capture after securing the distinct target", () => {
    const state = createInitialState(2);
    const securedPrimes = Object.fromEntries([2, 3, 5, 7, 11, 13, 17, 19, 23, 29].map((prime) => [prime, 1]));
    const withCapture: GameState = {
      ...state,
      phase: "STANDARD_CAPTURE",
      players: [{ ...state.players[0], capturedPrimes: securedPrimes }, state.players[1]],
      pendingCapture: { playerId: state.players[0].id, source: "standard-step", choices: [31, 101] }
    };

    expect(chooseHeuristicAction(withCapture, state.players[0].id)).toEqual({ type: "capturePrime", prime: 101 });
  });

  it("restocks a missing 2 before taking a larger new capture", () => {
    const state = createInitialState(2);
    const withCapture: GameState = {
      ...state,
      phase: "STANDARD_CAPTURE",
      pendingCapture: { playerId: state.players[0].id, source: "forced-jump", choices: [2, 17] }
    };

    expect(chooseHeuristicAction(withCapture, state.players[0].id)).toEqual({ type: "capturePrime", prime: 2 });
  });

  it("uses division by 2 to fuel a jump and recover the spent reserve", () => {
    const base = createInitialState(2);
    let state: GameState = {
      ...base,
      phase: "OPTIONAL_ACTIONS",
      players: [
        { ...base.players[0], pulse: 22, resonance: 4, capturedPrimes: { 2: 1 } },
        { ...base.players[1], pulse: 5 }
      ]
    };

    const division = chooseHeuristicAction(state, state.players[0].id);
    expect(division).toEqual({ type: "dividePulse", prime: 2 });
    state = applyAction(state, division!);

    const jump = chooseHeuristicAction(state, state.players[0].id);
    expect(jump).toEqual({ type: "forcedJump" });
    state = applyAction(state, jump!);

    expect(chooseHeuristicAction(state, state.players[0].id)).toEqual({ type: "capturePrime", prime: 2 });
  });

  it("ends on an odd pulse when another jump offers no important capture", () => {
    const base = createInitialState(2);
    const optional: GameState = {
      ...base,
      phase: "OPTIONAL_ACTIONS",
      players: [
        { ...base.players[0], pulse: 11, resonance: 10, capturedPrimes: { 2: 1, 17: 1 } },
        { ...base.players[1], pulse: 5 }
      ]
    };

    expect(chooseHeuristicAction(optional, base.players[0].id)).toEqual({ type: "endTurn" });
  });

  it("uses an even pulse to reach a valuable odd ending", () => {
    const base = createInitialState(2);
    const optional: GameState = {
      ...base,
      phase: "OPTIONAL_ACTIONS",
      players: [
        { ...base.players[0], pulse: 10, resonance: 4 },
        { ...base.players[1], pulse: 7 }
      ]
    };

    expect(chooseHeuristicAction(optional, base.players[0].id)).toEqual({ type: "forcedJump" });
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

  it("sacrifices a duplicate low prime to reset a high pulse and rebuild its bank", () => {
    const state = createInitialState(2);
    const optional: GameState = {
      ...state,
      phase: "OPTIONAL_ACTIONS",
      players: [
        { ...state.players[0], pulse: 900, capturedPrimes: { 2: 1, 5: 2, 97: 1 } },
        { ...state.players[1], pulse: 7 }
      ]
    };

    expect(chooseHeuristicAction(optional, state.players[0].id)).toEqual({ type: "dividePulse", prime: 5 });
  });

  it("protects a scarce unique high prime when division produces no resonance", () => {
    const state = createInitialState(2);
    const optional: GameState = {
      ...state,
      phase: "OPTIONAL_ACTIONS",
      players: [
        { ...state.players[0], pulse: 100, capturedPrimes: { 97: 1 } },
        { ...state.players[1], pulse: 7 }
      ]
    };

    expect(chooseHeuristicAction(optional, state.players[0].id)).toEqual({ type: "endTurn" });
  });

  it("rejects a low-yield division that burns a unique midpoint prime", () => {
    const state = createInitialState(2);
    const optional: GameState = {
      ...state,
      phase: "OPTIONAL_ACTIONS",
      players: [
        { ...state.players[0], pulse: 28, resonance: 2, capturedPrimes: { 19: 1 } },
        { ...state.players[1], pulse: 5 }
      ]
    };

    expect(chooseHeuristicAction(optional, state.players[0].id)).toEqual({ type: "endTurn" });
  });

  it("breaks out into another jump after using 2 once in the turn", () => {
    const state = createInitialState(2);
    const optional: GameState = {
      ...state,
      phase: "OPTIONAL_ACTIONS",
      players: [
        {
          ...state.players[0],
          pulse: 34,
          resonance: 5,
          capturedPrimes: { 2: 1 },
          primeUsesThisTurn: { 2: 1 },
          optionalActionsThisTurn: 2
        },
        { ...state.players[1], pulse: 7 }
      ]
    };

    expect(chooseHeuristicAction(optional, state.players[0].id)).toEqual({ type: "forcedJump" });
  });

  it("reinvests available resonance into a climb instead of descending automatically", () => {
    const state = createInitialState(2);
    const optional: GameState = {
      ...state,
      phase: "OPTIONAL_ACTIONS",
      players: [
        { ...state.players[0], pulse: 80, resonance: 8, capturedPrimes: { 2: 1 } },
        { ...state.players[1], pulse: 7 }
      ]
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
