import { forcedJumpPulse, standardPulseStep } from "./collatz";
import { d6 } from "./dice";
import { canDeclarePrimeTheft, eligibleAttackPrimes, resolveCombat } from "./combat";
import {
  addPrime,
  distinctPrimeCount,
  distinctPrimes,
  factorize,
  harmonyScore,
  removePrime,
  sharedPrimeValues
} from "./math";
import { applyResonanceRetention } from "./resonance";
import type { GameAction, GameEvent, GameState, PendingCapture, PlayerId, PlayerState, TurnPhase } from "./types";

export function applyAction(state: GameState, action: GameAction): GameState {
  if (state.winnerId && action.type !== "startTurn") return state;

  switch (action.type) {
    case "startTurn":
      return startTurn(state, action.rollDie);
    case "capturePrime":
      return capturePendingPrime(state, action.prime);
    case "forcedJump":
      return forcedJump(state, action.capturePrime);
    case "modifyPulse":
      return modifyPulse(state, action.prime, action.operation, action.capturePrime);
    case "attack":
      return attack(state, action.defenderId, action.initiatingPrime, action.attackKind, action.rollDie);
    case "applyDamage":
      return applyDamage(state, action.prime);
    case "stealPrime":
      return stealPrime(state, action.prime);
    case "endTurn":
      return endTurn(state);
  }
}

export function activePlayer(state: GameState): PlayerState {
  return state.players[state.activePlayerIndex];
}

export function playerById(state: GameState, id: PlayerId): PlayerState | undefined {
  return state.players.find((player) => player.id === id);
}

export function availableCapturePrimes(player: PlayerState): number[] {
  return distinctPrimes(
    factorize(player.pulse).reduce<Record<number, number>>((map, prime) => ({ ...map, [prime]: (map[prime] ?? 0) + 1 }), {})
  );
}

export function hasVictory(player: PlayerState): boolean {
  return distinctPrimeCount(player.capturedPrimes) >= 10 && harmonyScore(player.capturedPrimes) >= 200;
}

export function legalForcedJump(player: PlayerState): boolean {
  return player.resonance >= player.pulse;
}

export function legalPulseModifications(player: PlayerState): Array<{ prime: number; operation: "add" | "subtract" }> {
  return distinctPrimes(player.capturedPrimes).flatMap((prime) => {
    const options: Array<{ prime: number; operation: "add" | "subtract" }> = [{ prime, operation: "add" }];
    if (player.pulse - prime >= 1) options.push({ prime, operation: "subtract" });
    return options;
  });
}

function startTurn(state: GameState, rollDie = d6): GameState {
  const player = activePlayer(state);
  const roll = rollDie();
  const afterReset = updatePlayer(state, player.id, {
    ...player,
    resonance: player.resonance + roll,
    usedAttackPrimesThisTurn: []
  });
  const withRollLog = log(afterReset, "RESONANCE_ROLL", `${player.name} rolled ${roll} resonance.`);
  const freshPlayer = activePlayer(withRollLog);
  const nextPulse = standardPulseStep(freshPlayer.pulse);
  const steppedPlayer = { ...freshPlayer, pulse: nextPulse };
  const capture = createPendingCapture(steppedPlayer, "standard-step");
  return log(
    {
      ...updatePlayer(withRollLog, freshPlayer.id, steppedPlayer),
      phase: capture ? "STANDARD_CAPTURE" : "OPTIONAL_ACTIONS",
      pendingCapture: capture,
      forcedTurnEnd: false
    },
    "STANDARD_PULSE_STEP",
    `${freshPlayer.name}'s pulse moved from ${freshPlayer.pulse} to ${nextPulse}.`
  );
}

function capturePendingPrime(state: GameState, prime: number): GameState {
  const capture = state.pendingCapture;
  if (!capture || !capture.choices.includes(prime)) {
    return log(state, state.phase, `Capture of ${prime} is not available.`);
  }
  const player = requirePlayer(state, capture.playerId);
  const nextPlayer = { ...player, capturedPrimes: addPrime(player.capturedPrimes, prime) };
  return log(
    {
      ...updatePlayer(state, player.id, nextPlayer),
      pendingCapture: undefined,
      phase: "OPTIONAL_ACTIONS"
    },
    "STANDARD_CAPTURE",
    `${player.name} captured a ${prime}.`
  );
}

function forcedJump(state: GameState, capturePrime?: number): GameState {
  if (!canUseOptionalAction(state)) return state;
  const player = activePlayer(state);
  if (!legalForcedJump(player)) {
    return log(state, "OPTIONAL_ACTIONS", `${player.name} lacks ${player.pulse} resonance for a forced jump.`);
  }
  const oldPulse = player.pulse;
  const nextPulse = forcedJumpPulse(oldPulse);
  let nextState = updatePlayer(state, player.id, { ...player, resonance: player.resonance - oldPulse, pulse: nextPulse });
  nextState = log(nextState, "OPTIONAL_ACTIONS", `${player.name} paid ${oldPulse} resonance and forced ${oldPulse} to ${nextPulse}.`);
  return resolveOptionalCapture(nextState, player.id, "forced-jump", capturePrime);
}

function modifyPulse(
  state: GameState,
  prime: number,
  operation: "add" | "subtract",
  capturePrime?: number
): GameState {
  if (!canUseOptionalAction(state)) return state;
  const player = activePlayer(state);
  if ((player.capturedPrimes[prime] ?? 0) <= 0) {
    return log(state, "OPTIONAL_ACTIONS", `${player.name} does not have a captured ${prime} to discard.`);
  }
  const nextPulse = operation === "add" ? player.pulse + prime : player.pulse - prime;
  if (nextPulse < 1) {
    return log(state, "OPTIONAL_ACTIONS", `${player.name} cannot reduce pulse below 1.`);
  }
  const nextPlayer = {
    ...player,
    pulse: nextPulse,
    capturedPrimes: removePrime(player.capturedPrimes, prime)
  };
  let nextState = updatePlayer(state, player.id, nextPlayer);
  nextState = log(
    nextState,
    "OPTIONAL_ACTIONS",
    `${player.name} discarded a captured ${prime} and changed ${player.pulse} to ${nextPulse}.`
  );
  return resolveOptionalCapture(nextState, player.id, "pulse-modification", capturePrime);
}

function attack(
  state: GameState,
  defenderId: PlayerId,
  initiatingPrime: number,
  attackKind: "normal" | "prime-theft",
  rollDie = d6
): GameState {
  if (!canUseOptionalAction(state)) return state;
  const attacker = activePlayer(state);
  const defender = requirePlayer(state, defenderId);
  const legalPrimes = eligibleAttackPrimes(attacker, defender);
  if (!legalPrimes.includes(initiatingPrime)) {
    return log(state, "OPTIONAL_ACTIONS", `${attacker.name} cannot attack ${defender.name} using prime ${initiatingPrime}.`);
  }
  if (attackKind === "prime-theft" && !canDeclarePrimeTheft(attacker, defender)) {
    return log(state, "OPTIONAL_ACTIONS", `${attacker.name} cannot declare Prime Theft against ${defender.name}.`);
  }

  const paidAttacker = {
    ...attacker,
    resonance: attacker.resonance - initiatingPrime,
    usedAttackPrimesThisTurn: [...attacker.usedAttackPrimesThisTurn, initiatingPrime]
  };
  let nextState = updatePlayer(state, attacker.id, paidAttacker);
  nextState = log(
    nextState,
    "COMBAT_RESOLUTION",
    `${attacker.name} paid ${initiatingPrime} resonance to attack ${defender.name} using prime ${initiatingPrime}.`
  );
  if (attackKind === "prime-theft") {
    nextState = log(nextState, "COMBAT_RESOLUTION", `${attacker.name} declared Prime Theft against ${defender.name}.`);
  }

  const result = resolveCombat(paidAttacker, defender, rollDie);
  nextState = log(
    nextState,
    "COMBAT_RESOLUTION",
    `${attacker.name} rolled ${result.assault.dice} Assault Harmony Dice for ${result.assault.score}; ${defender.name} rolled ${result.shield.dice} Shield Dissonance Dice for ${result.shield.score}.`
  );

  if (result.outcome === "tie") {
    if (attackKind === "prime-theft") {
      return log({ ...nextState, forcedTurnEnd: true, phase: "FORCED_TURN_END" }, "FORCED_TURN_END", "Prime Theft tied and ended the turn.");
    }
    return log(nextState, "COMBAT_RESOLUTION", "The attack tied; no pulse changed.");
  }

  const victorId = result.outcome === "attacker" ? attacker.id : defender.id;
  const loserId = result.outcome === "attacker" ? defender.id : attacker.id;
  const victor = requirePlayer(nextState, victorId);
  const loser = requirePlayer(nextState, loserId);

  if (attackKind === "prime-theft") {
    const stealablePrimes = distinctPrimes(loser.capturedPrimes);
    return {
      ...log(nextState, "COMBAT_RESOLUTION", `${victor.name} won the Prime Theft exchange against ${loser.name}.`),
      pendingCombatChoice: { kind: "prime-theft", victorId, loserId, stealablePrimes, attackKind },
      phase: "COMBAT_RESOLUTION",
      forcedTurnEnd: true
    };
  }

  return {
    ...log(nextState, "COMBAT_RESOLUTION", `${victor.name} won the combat against ${loser.name}.`),
    pendingCombatChoice: {
      kind: "damage",
      victorId,
      loserId,
      sharedPrimes: sharedPrimeValues(victor.pulse, loser.pulse),
      attackKind
    },
    phase: "COMBAT_RESOLUTION"
  };
}

function applyDamage(state: GameState, prime: number): GameState {
  const choice = state.pendingCombatChoice;
  if (!choice || choice.kind !== "damage" || !choice.sharedPrimes?.includes(prime)) {
    return log(state, state.phase, `Damage with ${prime} is not available.`);
  }
  const victor = requirePlayer(state, choice.victorId);
  const loser = requirePlayer(state, choice.loserId);
  const damaged = { ...loser, pulse: loser.pulse / prime };
  return log(
    { ...updatePlayer(state, loser.id, damaged), pendingCombatChoice: undefined, phase: "OPTIONAL_ACTIONS" },
    "COMBAT_RESOLUTION",
    `${victor.name} divided a ${prime} out of ${loser.name}'s pulse.`
  );
}

function stealPrime(state: GameState, prime: number): GameState {
  const choice = state.pendingCombatChoice;
  if (!choice || choice.kind !== "prime-theft" || !choice.stealablePrimes?.includes(prime)) {
    return log(state, state.phase, `Stealing ${prime} is not available.`);
  }
  const victor = requirePlayer(state, choice.victorId);
  const loser = requirePlayer(state, choice.loserId);
  const afterLoss = updatePlayer(state, loser.id, { ...loser, capturedPrimes: removePrime(loser.capturedPrimes, prime) });
  const afterGain = updatePlayer(afterLoss, victor.id, { ...victor, capturedPrimes: addPrime(victor.capturedPrimes, prime) });
  return log(
    {
      ...afterGain,
      pendingCombatChoice: undefined,
      phase: "FORCED_TURN_END",
      forcedTurnEnd: true
    },
    "FORCED_TURN_END",
    `${victor.name} stole a ${prime} from ${loser.name}. Prime Theft ended the turn.`
  );
}

function endTurn(state: GameState): GameState {
  const player = activePlayer(state);
  const retained = applyResonanceRetention(player.resonance, player.pulse);
  const retainedPlayer = { ...player, resonance: retained, usedAttackPrimesThisTurn: [] };
  let nextState = updatePlayer(state, player.id, retainedPlayer);
  if (retained !== player.resonance) {
    nextState = log(nextState, "RESONANCE_RETENTION", `${player.name} retained ${retained} resonance after excess was halved.`);
  }
  const winner = hasVictory(retainedPlayer) ? retainedPlayer : undefined;
  if (winner) {
    return log({ ...nextState, winnerId: winner.id, phase: "VICTORY_CHECK" }, "VICTORY_CHECK", `${winner.name} reached ${harmonyScore(winner.capturedPrimes)} Harmony with ${distinctPrimeCount(winner.capturedPrimes)} distinct primes and won.`);
  }
  const nextIndex = (state.activePlayerIndex + 1) % state.players.length;
  const nextTurnState = log(
    {
      ...nextState,
      activePlayerIndex: nextIndex,
      phase: "TURN_START",
      turn: state.turn + 1,
      pendingCapture: undefined,
      pendingCombatChoice: undefined,
      forcedTurnEnd: false
    },
    "NEXT_PLAYER",
    `${state.players[nextIndex].name} is now active.`
  );
  return { ...nextTurnState, phase: "TURN_START" };
}

function resolveOptionalCapture(
  state: GameState,
  playerId: PlayerId,
  source: PendingCapture["source"],
  capturePrime?: number
): GameState {
  const capture = createPendingCapture(requirePlayer(state, playerId), source);
  if (!capture) return { ...state, pendingCapture: undefined, phase: "OPTIONAL_ACTIONS" };
  const withPending = { ...state, pendingCapture: capture, phase: "STANDARD_CAPTURE" as TurnPhase };
  return capturePrime === undefined ? withPending : capturePendingPrime(withPending, capturePrime);
}

function createPendingCapture(player: PlayerState, source: PendingCapture["source"]): PendingCapture | undefined {
  const choices = availableCapturePrimes(player);
  return choices.length > 0 ? { playerId: player.id, source, choices } : undefined;
}

function canUseOptionalAction(state: GameState): boolean {
  return !state.pendingCapture && !state.pendingCombatChoice && !state.forcedTurnEnd;
}

function updatePlayer(state: GameState, playerId: PlayerId, nextPlayer: PlayerState): GameState {
  return {
    ...state,
    players: state.players.map((player) => (player.id === playerId ? nextPlayer : player))
  };
}

function requirePlayer(state: GameState, playerId: PlayerId): PlayerState {
  const player = playerById(state, playerId);
  if (!player) throw new Error(`Unknown player: ${playerId}`);
  return player;
}

function log(state: GameState, phase: TurnPhase, message: string): GameState {
  const event: GameEvent = { turn: state.turn, phase, message };
  return { ...state, eventLog: [...state.eventLog, event] };
}
