import { describe, expect, it } from "vitest";
import { createInitialState, type GameAction, type GameState } from "../engine";
import { soundForTransition } from "../ui/soundEffects";

function transition(action: GameAction, changes: Partial<GameState> = {}) {
  const previous = createInitialState(2);
  const next = { ...previous, ...changes };
  return soundForTransition(previous, next, action);
}

describe("sound effect transitions", () => {
  it("maps core game actions to their cues", () => {
    expect(transition({ type: "startTurn" })).toBe("startTurn");
    expect(transition({ type: "capturePrime", prime: 2 })).toBe("capture");
    expect(transition({ type: "forcedJump" })).toBe("forcedJump");
    expect(transition({ type: "modifyPulse", prime: 2, operation: "add" })).toBe("modifyPulse");
    expect(transition({ type: "endTurn" })).toBe("endTurn");
  });

  it("distinguishes successful and failed attacks", () => {
    const previous = createInitialState(2);
    const action: GameAction = {
      type: "attack",
      defenderId: previous.players[1].id,
      initiatingPrime: 2,
      attackKind: "normal"
    };
    const successful = {
      ...previous,
      pendingCombatChoice: {
        kind: "damage" as const,
        victorId: previous.players[0].id,
        loserId: previous.players[1].id,
        attackKind: "normal" as const
      }
    };
    expect(soundForTransition(previous, successful, action)).toBe("attackSuccess");
    expect(soundForTransition(previous, { ...successful, pendingCombatChoice: undefined }, action)).toBe("attackFail");
  });

  it("uses error and victory cues when they supersede the action cue", () => {
    const previous = createInitialState(2);
    const errorState = {
      ...previous,
      eventLog: [...previous.eventLog, { turn: 1, phase: "OPTIONAL_ACTIONS" as const, message: "Mira lacks 3 resonance." }]
    };
    expect(soundForTransition(previous, errorState, { type: "forcedJump" })).toBe("error");
    expect(soundForTransition(previous, { ...errorState, winnerId: previous.players[0].id }, { type: "endTurn" })).toBe("victory");
  });
});
