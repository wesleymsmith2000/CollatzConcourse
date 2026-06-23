import { describe, expect, it } from "vitest";
import { chooseHeuristicAction, decisionOwnerId } from "../ai/heuristic";
import {
  applyAction,
  createInitialState,
  distinctPrimeCount,
  harmonyScore,
  type GameAction
} from "../engine";

describe("AI race tempo", () => {
  it("converts discovery into a sprint victory without abandoning Prime Division", () => {
    let state = createInitialState(2, ["A", "B"], "sprint", "sprint");
    const actionCounts: Record<string, number> = {};
    const rolls = [4, 2, 6, 3, 5, 1];
    let rollIndex = 0;

    for (let step = 0; step < 2_000 && !state.winnerId; step += 1) {
      const action = chooseHeuristicAction(state, decisionOwnerId(state));
      if (!action) throw new Error(`AI stalled in ${state.phase}`);
      actionCounts[action.type] = (actionCounts[action.type] ?? 0) + 1;
      state = applyAction(state, withRoll(action, () => rolls[rollIndex++ % rolls.length]));
    }

    const winner = state.players.find((player) => player.id === state.winnerId);
    expect(winner).toBeDefined();
    expect(state.turn).toBeLessThanOrEqual(65);
    expect(actionCounts.dividePulse).toBeGreaterThan(0);
    expect(harmonyScore(winner!.capturedPrimes)).toBeGreaterThanOrEqual(state.harmonyTarget);
    expect(distinctPrimeCount(winner!.capturedPrimes)).toBeGreaterThanOrEqual(state.distinctPrimeTarget);
  });
});

function withRoll(action: GameAction, roll: () => number): GameAction {
  return action.type === "startTurn" || action.type === "attack" ? { ...action, rollDie: roll } : action;
}
