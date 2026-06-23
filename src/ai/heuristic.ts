import {
  activePlayer,
  canDeclarePrimeTheft,
  countAssaultHarmonyDice,
  countShieldDissonanceDice,
  distinctPrimeCount,
  eligibleAttackPrimes,
  factorize,
  forcedJumpPulse,
  forcedJumpResonanceCost,
  harmonyScore,
  legalForcedJump,
  legalPrimeDivisions,
  legalPulseModifications,
  primeDivisionResonanceGain,
  primeModificationResonanceCost,
  turbulenceActionCost,
  type GameAction,
  type GameState,
  type PlayerId,
  type PlayerState
} from "../engine";

interface ScoredAction {
  action: GameAction;
  score: number;
}

const DIVIDE_TWO_JUMP_LOOP_BONUS = 250;
const ODD_ENDING_BONUS = 80;
const ODD_END_TURN_VALUE = 120;
const REBUILD_END_TURN_VALUE = 80;

export function decisionOwnerId(state: GameState): PlayerId {
  return state.pendingCapture?.playerId ?? state.pendingCombatChoice?.victorId ?? activePlayer(state).id;
}

export function chooseHeuristicAction(state: GameState, playerId: PlayerId): GameAction | undefined {
  if (state.winnerId || decisionOwnerId(state) !== playerId) return undefined;

  if (state.pendingCapture) {
    const player = requirePlayer(state, playerId);
    return { type: "capturePrime", prime: choosePrime(state.pendingCapture.choices, player, state.distinctPrimeTarget) };
  }

  if (state.pendingCombatChoice) {
    const choice = state.pendingCombatChoice;
    if (choice.kind === "damage") {
      const prime = maxValue(choice.sharedPrimes ?? []);
      return prime === undefined ? undefined : { type: "applyDamage", prime };
    }
    const player = requirePlayer(state, playerId);
    const prime = choosePrime(choice.stealablePrimes ?? [], player, state.distinctPrimeTarget);
    return prime === undefined ? undefined : { type: "stealPrime", prime };
  }

  const player = activePlayer(state);
  if (player.id !== playerId) return undefined;
  if (state.phase === "TURN_START") return { type: "startTurn" };
  if (state.forcedTurnEnd || state.phase === "FORCED_TURN_END") return { type: "endTurn" };
  if (state.phase !== "OPTIONAL_ACTIONS") return undefined;

  return chooseOptionalAction(state, player) ?? { type: "endTurn" };
}

function chooseOptionalAction(state: GameState, player: PlayerState): GameAction | undefined {
  const opponents = state.players.filter((candidate) => candidate.id !== player.id);

  const theft = opponents
    .filter((defender) => canDeclarePrimeTheft(player, defender))
    .flatMap((defender) =>
      eligibleAttackPrimes(player, defender).map<ScoredAction>((prime) => ({
        action: { type: "attack", defenderId: defender.id, initiatingPrime: prime, attackKind: "prime-theft" },
        score: harmonyScore(defender.capturedPrimes) - prime - turbulenceActionCost(player.turbulence)
      }))
    )
    .sort((left, right) => right.score - left.score)[0];
  if (theft) return theft.action;

  const attacks = opponents.flatMap((defender) => {
    const advantage =
      countAssaultHarmonyDice(player.pulse, defender.pulse) -
      countShieldDissonanceDice(player.pulse, defender.pulse);
    if (advantage <= 0) return [];
    return eligibleAttackPrimes(player, defender).map<ScoredAction>((prime) => ({
      action: { type: "attack", defenderId: defender.id, initiatingPrime: prime, attackKind: "normal" },
      score: advantage * 100 + Math.log2(defender.pulse + 1) * 8 - prime - turbulenceActionCost(player.turbulence)
    }));
  });
  const bestAttack = attacks.sort((left, right) => right.score - left.score)[0];
  if (bestAttack) return bestAttack.action;

  const growthActions: ScoredAction[] = [];
  if (legalForcedJump(player)) {
    const destination = forcedJumpPulse(player.pulse);
    if (Number.isSafeInteger(destination)) {
      growthActions.push({
        action: { type: "forcedJump" },
        score: scorePulseDestination(destination, player, state.distinctPrimeTarget) - forcedJumpResonanceCost(player.pulse, player.turbulence) * 4
      });
    }
  }

  for (const option of legalPulseModifications(player)) {
    const destination = option.operation === "add" ? player.pulse + option.prime : player.pulse - option.prime;
    if (!Number.isSafeInteger(destination)) continue;
    growthActions.push({
      action: { type: "modifyPulse", prime: option.prime, operation: option.operation },
      score:
        scorePulseDestination(destination, player, state.distinctPrimeTarget) -
        primeModificationResonanceCost(option.prime, player.turbulence) * 4 -
        primeSacrificePenalty(player, option.prime, state.distinctPrimeTarget)
    });
  }

  for (const prime of legalPrimeDivisions(player)) {
    const turbulenceCost = turbulenceActionCost(player.turbulence);
    const netGain = primeDivisionResonanceGain(player.pulse, prime) - turbulenceCost;
    if (netGain <= 0) continue;
    const isLastCopy = player.capturedPrimes[prime] === 1;
    if (isLastCopy && netGain * netGain < prime) continue;
    growthActions.push({
      action: { type: "dividePulse", prime },
      score:
        netGain * 25 -
        primeDivisionSacrificePenalty(player, prime, state.distinctPrimeTarget) -
        Math.log2(Math.floor(player.pulse / prime) + 1) +
        endPulseStrategicBonus(Math.floor(player.pulse / prime), player) +
        (canFuelDivideTwoJumpLoop(player, prime) ? DIVIDE_TWO_JUMP_LOOP_BONUS : 0)
    });
  }

  const bestGrowth = growthActions.sort((left, right) => right.score - left.score)[0];
  return bestGrowth && bestGrowth.score > strategicEndTurnValue(player) ? bestGrowth.action : undefined;
}

function scorePulseDestination(destination: number, player: PlayerState, distinctPrimeTarget: number): number {
  const factors = distinctPrimesFromValue(destination);
  const bestPrime = maxValue(factors) ?? 0;
  const hasNewPrime = factors.some((prime) => (player.capturedPrimes[prime] ?? 0) === 0);
  const stillClimbing = distinctPrimeCount(player.capturedPrimes) < distinctPrimeTarget;
  return (
    bestPrime +
    (stillClimbing && hasNewPrime ? 200 : 0) +
    Math.log2(destination + 1) * 8 +
    endPulseStrategicBonus(destination, player)
  );
}

function distinctPrimesFromValue(value: number): number[] {
  return [...new Set(factorize(value))].sort((left, right) => left - right);
}

function choosePrime(choices: number[], player: PlayerState, distinctPrimeTarget: number): number {
  const stillClimbing = distinctPrimeCount(player.capturedPrimes) < distinctPrimeTarget;
  const missingTwo = (player.capturedPrimes[2] ?? 0) === 0;
  const score = (prime: number) =>
    prime +
    (stillClimbing && (player.capturedPrimes[prime] ?? 0) === 0 ? 200 : 0) +
    (missingTwo && prime === 2 ? 50 : 0);
  return [...choices].sort((left, right) => score(right) - score(left) || right - left)[0];
}

function primeSacrificePenalty(player: PlayerState, prime: number, distinctPrimeTarget: number): number {
  const isLastCopy = player.capturedPrimes[prime] === 1;
  const needsEveryDistinctPrime = distinctPrimeCount(player.capturedPrimes) <= distinctPrimeTarget;
  return prime + (isLastCopy && needsEveryDistinctPrime ? 250 : isLastCopy ? 25 : 0);
}

function primeDivisionSacrificePenalty(player: PlayerState, prime: number, distinctPrimeTarget: number): number {
  if (canFuelDivideTwoJumpLoop(player, prime)) return 0;
  if (player.capturedPrimes[prime] > 1) return prime / 4;
  const stillClimbing = distinctPrimeCount(player.capturedPrimes) < distinctPrimeTarget;
  return Math.min(prime, 40) + (stillClimbing ? 30 : 10);
}

function canFuelDivideTwoJumpLoop(player: PlayerState, prime: number): boolean {
  if (prime !== 2 || player.pulse % 4 !== 2 || (player.primeUsesThisTurn[2] ?? 0) > 0) return false;
  const quotient = player.pulse / 2;
  const divisionCost = turbulenceActionCost(player.turbulence);
  const resonanceAfterDivision =
    player.resonance + primeDivisionResonanceGain(player.pulse, 2) - divisionCost;
  const turbulenceAfterDivision = player.turbulence + (player.primeUsesThisTurn[2] ?? 0);
  return resonanceAfterDivision >= forcedJumpResonanceCost(quotient, turbulenceAfterDivision);
}

function strategicEndTurnValue(player: PlayerState): number {
  if (player.pulse % 2 === 1) return ODD_END_TURN_VALUE;
  return isRebuildingLowPrimeBank(player) ? REBUILD_END_TURN_VALUE : 0;
}

function endPulseStrategicBonus(pulse: number, player: PlayerState): number {
  const preferredParity = isRebuildingLowPrimeBank(player) ? 0 : 1;
  return pulse % 2 === preferredParity ? ODD_ENDING_BONUS : 0;
}

function isRebuildingLowPrimeBank(player: PlayerState): boolean {
  const lowPrimeTokens = Object.entries(player.capturedPrimes).reduce(
    (total, [prime, count]) => total + (Number(prime) <= 7 ? count : 0),
    0
  );
  return player.pulse >= 32 && lowPrimeTokens <= 3;
}

function maxValue(values: number[]): number | undefined {
  return values.length > 0 ? Math.max(...values) : undefined;
}

function requirePlayer(state: GameState, playerId: PlayerId): PlayerState {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error(`Unknown AI player: ${playerId}`);
  return player;
}
