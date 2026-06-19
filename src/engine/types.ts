export type PlayerId = string;
export type PrimeMultiset = Record<number, number>;

export type TurnPhase =
  | "TURN_START"
  | "RESONANCE_ROLL"
  | "STANDARD_PULSE_STEP"
  | "STANDARD_CAPTURE"
  | "OPTIONAL_ACTIONS"
  | "COMBAT_RESOLUTION"
  | "FORCED_TURN_END"
  | "RESONANCE_RETENTION"
  | "VICTORY_CHECK"
  | "NEXT_PLAYER";

export interface PlayerState {
  id: PlayerId;
  name: string;
  pulse: number;
  resonance: number;
  capturedPrimes: PrimeMultiset;
  usedAttackPrimesThisTurn: number[];
}

export interface GameEvent {
  turn: number;
  phase: TurnPhase;
  message: string;
}

export interface GameState {
  players: PlayerState[];
  activePlayerIndex: number;
  phase: TurnPhase;
  turn: number;
  winnerId?: PlayerId;
  eventLog: GameEvent[];
  pendingCapture?: PendingCapture;
  pendingCombatChoice?: PendingCombatChoice;
  forcedTurnEnd: boolean;
}

export interface PendingCapture {
  playerId: PlayerId;
  source: "standard-step" | "forced-jump" | "pulse-modification";
  choices: number[];
}

export interface PendingCombatChoice {
  kind: "damage" | "prime-theft";
  victorId: PlayerId;
  loserId: PlayerId;
  sharedPrimes?: number[];
  stealablePrimes?: number[];
  attackKind: "normal" | "prime-theft";
}

export interface CombatRollLog {
  dieIndex: number;
  rolls: number[];
  result: "success" | "failure";
}

export interface PoolScore {
  dice: number;
  score: number;
  rolls: CombatRollLog[];
}

export interface CombatResult {
  assault: PoolScore;
  shield: PoolScore;
  outcome: "attacker" | "defender" | "tie";
}

export type DieRoller = () => number;

export type GameAction =
  | { type: "startTurn"; rollDie?: DieRoller }
  | { type: "capturePrime"; prime: number }
  | { type: "forcedJump"; capturePrime?: number }
  | { type: "modifyPulse"; prime: number; operation: "add" | "subtract"; capturePrime?: number }
  | {
      type: "attack";
      defenderId: PlayerId;
      initiatingPrime: number;
      attackKind: "normal" | "prime-theft";
      rollDie?: DieRoller;
    }
  | { type: "applyDamage"; prime: number }
  | { type: "stealPrime"; prime: number }
  | { type: "endTurn" };
