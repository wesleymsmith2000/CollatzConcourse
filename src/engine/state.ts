import { RACE_HARMONY_TARGETS } from "./race";
import type { GameState, PlayerId, PlayerState, RaceLength } from "./types";

const DEFAULT_NAMES = ["Mira", "Hu", "Keru", "Azura"];

export function createInitialState(playerCount = 2, names = DEFAULT_NAMES, raceLength: RaceLength = "sprint"): GameState {
  if (playerCount < 2 || playerCount > 4) {
    throw new Error("Collatz Concourse supports 2 to 4 players.");
  }

  const players = Array.from({ length: playerCount }, (_, index) =>
    createPlayer(`player-${index + 1}`, names[index] ?? `Player ${index + 1}`)
  );

  return {
    players,
    raceLength,
    harmonyTarget: RACE_HARMONY_TARGETS[raceLength],
    activePlayerIndex: 0,
    phase: "TURN_START",
    turn: 1,
    eventLog: [{ turn: 1, phase: "TURN_START", message: `The ${raceLength} race begins.` }],
    forcedTurnEnd: false
  };
}

export function createPlayer(id: PlayerId, name: string): PlayerState {
  return {
    id,
    name,
    pulse: 1,
    resonance: 0,
    capturedPrimes: {},
    usedAttackPrimesThisTurn: []
  };
}
