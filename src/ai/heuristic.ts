import {
  activePlayer,
  canDeclarePrimeTheft,
  countAssaultHarmonyDice,
  countShieldDissonanceDice,
  eligibleAttackPrimes,
  factorize,
  forcedJumpPulse,
  forcedJumpResonanceCost,
  harmonyScore,
  legalForcedJump,
  legalPulseModifications,
  primeModificationResonanceCost,
  type GameAction,
  type GameState,
  type PlayerId,
  type PlayerState
} from "../engine";

interface ScoredAction {
  action: GameAction;
  score: number;
}

export function decisionOwnerId(state: GameState): PlayerId {
  return state.pendingCapture?.playerId ?? state.pendingCombatChoice?.victorId ?? activePlayer(state).id;
}

export function chooseHeuristicAction(state: GameState, playerId: PlayerId): GameAction | undefined {
  if (state.winnerId || decisionOwnerId(state) !== playerId) return undefined;

  if (state.pendingCapture) {
    const player = requirePlayer(state, playerId);
    return { type: "capturePrime", prime: choosePrime(state.pendingCapture.choices, player) };
  }

  if (state.pendingCombatChoice) {
    const choice = state.pendingCombatChoice;
    if (choice.kind === "damage") {
      const prime = maxValue(choice.sharedPrimes ?? []);
      return prime === undefined ? undefined : { type: "applyDamage", prime };
    }
    const player = requirePlayer(state, playerId);
    const prime = choosePrime(choice.stealablePrimes ?? [], player);
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
        score: harmonyScore(defender.capturedPrimes) - prime
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
      score: advantage * 100 + Math.log2(defender.pulse + 1) * 8 - prime
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
        score: scorePulseDestination(destination, player) - forcedJumpResonanceCost(player.pulse) * 4
      });
    }
  }

  for (const option of legalPulseModifications(player)) {
    const destination = option.operation === "add" ? player.pulse + option.prime : player.pulse - option.prime;
    if (!Number.isSafeInteger(destination)) continue;
    growthActions.push({
      action: { type: "modifyPulse", prime: option.prime, operation: option.operation },
      score:
        scorePulseDestination(destination, player) -
        primeModificationResonanceCost(option.prime) * 4 -
        option.prime
    });
  }

  const bestGrowth = growthActions.sort((left, right) => right.score - left.score)[0];
  return bestGrowth && bestGrowth.score > 0 ? bestGrowth.action : undefined;
}

function scorePulseDestination(destination: number, player: PlayerState): number {
  const factors = distinctPrimesFromValue(destination);
  const bestPrime = maxValue(factors) ?? 0;
  const hasNewPrime = factors.some((prime) => (player.capturedPrimes[prime] ?? 0) === 0);
  return bestPrime + (hasNewPrime ? 200 : 0) + Math.log2(destination + 1) * 8;
}

function distinctPrimesFromValue(value: number): number[] {
  return [...new Set(factorize(value))].sort((left, right) => left - right);
}

function choosePrime(choices: number[], player: PlayerState): number {
  return [...choices].sort((left, right) => {
    const leftNew = (player.capturedPrimes[left] ?? 0) === 0 ? 1 : 0;
    const rightNew = (player.capturedPrimes[right] ?? 0) === 0 ? 1 : 0;
    return rightNew - leftNew || right - left;
  })[0];
}

function maxValue(values: number[]): number | undefined {
  return values.length > 0 ? Math.max(...values) : undefined;
}

function requirePlayer(state: GameState, playerId: PlayerId): PlayerState {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error(`Unknown AI player: ${playerId}`);
  return player;
}
