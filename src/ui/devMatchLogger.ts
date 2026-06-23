import { distinctPrimeCount, harmonyScore, type GameAction, type GameState } from "../engine";

export const DEV_MATCH_LOG_STORAGE_KEY = "collatz-concourse.dev-match-logs.v1";
const MAX_ARCHIVED_MATCHES = 25;

export interface DevPlayerSnapshot {
  id: string;
  name: string;
  pulse: number;
  resonance: number;
  turbulence: number;
  harmony: number;
  distinctPrimes: number;
  capturedPrimes: Record<number, number>;
}

export interface DevMatchActionLog {
  sequence: number;
  recordedAt: string;
  source: "human" | "ai";
  actorId: string;
  action: Record<string, unknown>;
  before: DevPlayerSnapshot[];
  after: DevPlayerSnapshot[];
  resultingEvents: string[];
}

export interface DevMatchLog {
  version: 1;
  id: string;
  startedAt: string;
  endedAt?: string;
  status: "active" | "completed" | "interrupted";
  settings: {
    raceLength: GameState["raceLength"];
    primeRaceLength: GameState["primeRaceLength"];
    harmonyTarget: number;
    distinctPrimeTarget: number;
  };
  players: Array<{ id: string; name: string }>;
  actions: DevMatchActionLog[];
  finalState?: {
    turn: number;
    winnerId?: string;
    players: DevPlayerSnapshot[];
    eventLog: GameState["eventLog"];
    raceHistory: GameState["raceHistory"];
  };
}

export interface DevMatchArchive {
  version: 1;
  active?: DevMatchLog;
  matches: DevMatchLog[];
}

type MatchLogStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createDevMatchLog(state: GameState, recordedAt = new Date().toISOString(), id = createId()): DevMatchLog {
  return {
    version: 1,
    id,
    startedAt: recordedAt,
    status: "active",
    settings: {
      raceLength: state.raceLength,
      primeRaceLength: state.primeRaceLength,
      harmonyTarget: state.harmonyTarget,
      distinctPrimeTarget: state.distinctPrimeTarget
    },
    players: state.players.map(({ id: playerId, name }) => ({ id: playerId, name })),
    actions: []
  };
}

export function appendDevMatchAction(
  log: DevMatchLog,
  previous: GameState,
  next: GameState,
  action: GameAction,
  source: "human" | "ai",
  recordedAt = new Date().toISOString()
): DevMatchLog {
  const completed = Boolean(next.winnerId);
  return {
    ...log,
    status: completed ? "completed" : "active",
    endedAt: completed ? recordedAt : undefined,
    actions: [
      ...log.actions,
      {
        sequence: log.actions.length + 1,
        recordedAt,
        source,
        actorId: previous.players[previous.activePlayerIndex].id,
        action: JSON.parse(JSON.stringify(action)) as Record<string, unknown>,
        before: snapshotPlayers(previous),
        after: snapshotPlayers(next),
        resultingEvents: next.eventLog.slice(previous.eventLog.length).map((event) => event.message)
      }
    ],
    finalState: completed ? snapshotFinalState(next) : undefined
  };
}

export function loadDevMatchArchive(storage: MatchLogStorage): DevMatchArchive {
  try {
    const parsed = JSON.parse(storage.getItem(DEV_MATCH_LOG_STORAGE_KEY) ?? "null") as Partial<DevMatchArchive> | null;
    if (parsed?.version !== 1 || !Array.isArray(parsed.matches)) return { version: 1, matches: [] };
    return { version: 1, active: parsed.active, matches: parsed.matches };
  } catch {
    return { version: 1, matches: [] };
  }
}

export function saveDevMatchLog(storage: MatchLogStorage, log: DevMatchLog, recordedAt = new Date().toISOString()): DevMatchArchive {
  const archive = loadDevMatchArchive(storage);
  let matches = archive.matches.filter((match) => match.id !== log.id);

  if (archive.active && archive.active.id !== log.id && archive.active.actions.length > 0) {
    matches = [{ ...archive.active, status: "interrupted", endedAt: recordedAt }, ...matches];
  }

  const nextArchive: DevMatchArchive = log.status === "active"
    ? { version: 1, active: log, matches: matches.slice(0, MAX_ARCHIVED_MATCHES) }
    : { version: 1, matches: [log, ...matches].slice(0, MAX_ARCHIVED_MATCHES) };
  storage.setItem(DEV_MATCH_LOG_STORAGE_KEY, JSON.stringify(nextArchive));
  return nextArchive;
}

export function clearDevMatchArchive(storage: MatchLogStorage): void {
  storage.removeItem(DEV_MATCH_LOG_STORAGE_KEY);
}

function snapshotPlayers(state: GameState): DevPlayerSnapshot[] {
  return state.players.map((player) => ({
    id: player.id,
    name: player.name,
    pulse: player.pulse,
    resonance: player.resonance,
    turbulence: player.turbulence,
    harmony: harmonyScore(player.capturedPrimes),
    distinctPrimes: distinctPrimeCount(player.capturedPrimes),
    capturedPrimes: { ...player.capturedPrimes }
  }));
}

function snapshotFinalState(state: GameState): NonNullable<DevMatchLog["finalState"]> {
  return {
    turn: state.turn,
    winnerId: state.winnerId,
    players: snapshotPlayers(state),
    eventLog: state.eventLog,
    raceHistory: state.raceHistory
  };
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `match-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
