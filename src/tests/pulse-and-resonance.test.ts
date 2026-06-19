import { describe, expect, it } from "vitest";
import {
  addPrime,
  applyAction,
  applyResonanceRetention,
  createInitialState,
  createSequenceD6,
  harmonyScore,
  standardPulseStep
} from "../engine";

describe("standard pulse step", () => {
  it("follows Collatz movement", () => {
    expect(standardPulseStep(1)).toBe(4);
    expect(standardPulseStep(4)).toBe(2);
    expect(standardPulseStep(2)).toBe(1);
    expect(standardPulseStep(7)).toBe(22);
  });
});

describe("captures", () => {
  it("capture adds one copy and does not alter pulse", () => {
    const started = applyAction(createInitialState(2), { type: "startTurn", rollDie: createSequenceD6([4]) });
    const captured = applyAction(started, { type: "capturePrime", prime: 2 });

    expect(captured.players[0].pulse).toBe(4);
    expect(captured.players[0].capturedPrimes).toEqual({ 2: 1 });
    expect(harmonyScore(captured.players[0].capturedPrimes)).toBe(2);
  });

  it("no capture is possible from pulse 1", () => {
    const state = createInitialState(2);
    const captured = applyAction({ ...state, pendingCapture: undefined }, { type: "capturePrime", prime: 2 });
    expect(captured.players[0].capturedPrimes).toEqual({});
  });
});

describe("forced jump", () => {
  it("costs the pre-jump pulse and grants one capture opportunity", () => {
    let state = createInitialState(2);
    state = {
      ...state,
      phase: "OPTIONAL_ACTIONS",
      players: [{ ...state.players[0], pulse: 2, resonance: 2 }, state.players[1]]
    };

    const jumped = applyAction(state, { type: "forcedJump" });
    expect(jumped.players[0].pulse).toBe(7);
    expect(jumped.players[0].resonance).toBe(0);
    expect(jumped.pendingCapture?.choices).toEqual([7]);
  });

  it("fails when resonance is insufficient", () => {
    const state = {
      ...createInitialState(2),
      phase: "OPTIONAL_ACTIONS" as const,
      players: [{ ...createInitialState(2).players[0], pulse: 4, resonance: 3 }, createInitialState(2).players[1]]
    };
    const jumped = applyAction(state, { type: "forcedJump" });
    expect(jumped.players[0].pulse).toBe(4);
  });
});

describe("pulse modification", () => {
  it("discards a captured prime, updates Harmony, and grants capture", () => {
    const base = createInitialState(2);
    const state = {
      ...base,
      phase: "OPTIONAL_ACTIONS" as const,
      players: [
        { ...base.players[0], pulse: 14, capturedPrimes: addPrime({}, 2) },
        base.players[1]
      ]
    };

    const modified = applyAction(state, { type: "modifyPulse", prime: 2, operation: "subtract" });
    expect(modified.players[0].pulse).toBe(12);
    expect(modified.players[0].capturedPrimes).toEqual({});
    expect(modified.pendingCapture?.choices).toEqual([2, 3]);
  });

  it("rejects subtraction below 1", () => {
    const base = createInitialState(2);
    const state = {
      ...base,
      phase: "OPTIONAL_ACTIONS" as const,
      players: [
        { ...base.players[0], pulse: 2, capturedPrimes: addPrime({}, 5) },
        base.players[1]
      ]
    };
    const modified = applyAction(state, { type: "modifyPulse", prime: 5, operation: "subtract" });
    expect(modified.players[0].pulse).toBe(2);
    expect(modified.players[0].capturedPrimes).toEqual({ 5: 1 });
  });
});

describe("resonance retention", () => {
  it("retains threshold and halves excess downward", () => {
    expect(applyResonanceRetention(0, 1)).toBe(0);
    expect(applyResonanceRetention(3, 2)).toBe(2);
    expect(applyResonanceRetention(8, 4)).toBe(5);
    expect(applyResonanceRetention(9, 8)).toBe(6);
  });
});

describe("turn advancement", () => {
  it("enters optional actions after the mandatory capture", () => {
    let state = createInitialState(2);
    state = applyAction(state, { type: "startTurn", rollDie: createSequenceD6([4]) });
    state = applyAction(state, { type: "capturePrime", prime: 2 });

    expect(state.phase).toBe("OPTIONAL_ACTIONS");
    expect(state.pendingCapture).toBeUndefined();
  });

  it("ends a completed turn and leaves the next player ready to start", () => {
    let state = createInitialState(2);
    state = applyAction(state, { type: "startTurn", rollDie: createSequenceD6([4]) });
    state = applyAction(state, { type: "capturePrime", prime: 2 });
    state = applyAction(state, { type: "endTurn" });

    expect(state.activePlayerIndex).toBe(1);
    expect(state.phase).toBe("TURN_START");
    expect(state.players[1].name).toBe("Hu");
  });
});
