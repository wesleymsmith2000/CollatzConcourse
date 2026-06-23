import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Download, Play, Trash2, Volume2, VolumeX } from "lucide-react";
import { chooseHeuristicAction, decisionOwnerId } from "./ai/heuristic";
import {
  activePlayer,
  applyAction,
  availableCapturePrimes,
  canDeclarePrimeTheft,
  createInitialState,
  distinctPrimeCount,
  distinctPrimes,
  eligibleAttackPrimes,
  formatFactorization,
  forcedJumpResonanceCost,
  harmonyScore,
  legalForcedJump,
  legalPrimeDivisions,
  legalPulseModifications,
  PRIME_CLIMB_LEVEL_LABELS,
  primeModificationResonanceCost,
  primeDivisionResonanceGain,
  RACE_DISTINCT_PRIME_TARGETS,
  RACE_HARMONY_TARGETS,
  sharedPrimeValues,
  turbulenceActionCost,
  type GameState,
  type PlayerState,
  type RaceLength
} from "./engine";
import { visualAssets } from "./ui/assets";
import { CompactJukebox, Jukebox, useJukebox } from "./ui/Jukebox";
import { RaceTracker } from "./ui/RaceTracker";
import {
  appendDevMatchAction,
  clearDevMatchArchive,
  createDevMatchLog,
  loadDevMatchArchive,
  saveDevMatchLog,
  type DevMatchLog
} from "./ui/devMatchLogger";
import { useSoundEffects } from "./ui/soundEffects";

const RIVAL_NAMES = ["Hu", "Keru", "Azura"];
const DEV_MATCH_LOGGING = import.meta.env.DEV;

function App({ accountDisplayName = "Mira" }: { accountDisplayName?: string }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [raceLength, setRaceLength] = useState<RaceLength>("sprint");
  const [primeRaceLength, setPrimeRaceLength] = useState<RaceLength>("sprint");
  const [state, setState] = useState<GameState>(() => createInitialState(2, [accountDisplayName, ...RIVAL_NAMES], "sprint"));
  const [devMatchLog, setDevMatchLog] = useState<DevMatchLog | undefined>(() =>
    DEV_MATCH_LOGGING ? createDevMatchLog(state) : undefined
  );
  const [selectedTargetId, setSelectedTargetId] = useState("player-2");
  const stateRef = useRef(state);
  const soundEffects = useSoundEffects();
  const jukebox = useJukebox();
  const current = activePlayer(state);
  const aiCount = state.players.length - 1;
  const aiPlayerIds = useMemo(
    () => new Set(state.players.slice(1).map((player) => player.id)),
    [state.players]
  );
  const accountPlayer = state.players[0];
  const selectedTarget = state.players.find((player) => player.id === selectedTargetId) ?? state.players[1];
  const currentDecisionOwnerId = decisionOwnerId(state);
  const aiThinking = !state.winnerId && aiPlayerIds.has(currentDecisionOwnerId);

  function dispatch(action: Parameters<typeof applyAction>[1], source: "human" | "ai" = "human") {
    const previous = stateRef.current;
    if (source === "human" && isAiSeat(previous, decisionOwnerId(previous), aiCount)) return;
    const next = applyAction(previous, action);
    if (DEV_MATCH_LOGGING) {
      setDevMatchLog((log) => log && appendDevMatchAction(log, previous, next, action, source));
    }
    stateRef.current = next;
    setState(next);
    soundEffects.playTransition(previous, next, action);
  }

  function startRace() {
    const next = createInitialState(playerCount, [accountDisplayName, ...RIVAL_NAMES], raceLength, primeRaceLength);
    stateRef.current = next;
    setState(next);
    if (DEV_MATCH_LOGGING) setDevMatchLog(createDevMatchLog(next));
    setSelectedTargetId(next.players[1].id);
    soundEffects.play("arrival");
  }

  useEffect(() => {
    if (!aiThinking) return;
    const action = chooseHeuristicAction(state, currentDecisionOwnerId);
    if (!action) return;
    const timer = window.setTimeout(() => dispatch(action, "ai"), 650);
    return () => window.clearTimeout(timer);
  }, [aiThinking, currentDecisionOwnerId, state]);

  useEffect(() => {
    if (DEV_MATCH_LOGGING && devMatchLog) saveDevMatchLog(window.localStorage, devMatchLog);
  }, [devMatchLog]);

  function exportDevMatchLogs() {
    const archive = loadDevMatchArchive(window.localStorage);
    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `collatz-concourse-match-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function clearDevMatchLogs() {
    clearDevMatchArchive(window.localStorage);
    setDevMatchLog(createDevMatchLog(state));
  }

  const canAct = !state.pendingCapture && !state.pendingCombatChoice && !state.forcedTurnEnd && state.phase === "OPTIONAL_ACTIONS";

  return (
    <main className="app-shell">
      <img className="style-watermark" src={visualAssets.styleConcept} alt="" aria-hidden="true" />
      <section className="top-bar">
        <div className="league-mark">
          <span>PGO</span>
        </div>
        <div>
          <p className="eyebrow">Primordial Games Olympics / Quantum Mathematics Division</p>
          <h1>Collatz Concourse</h1>
          <p className="tagline">Prime path. Resonate. Conquer.</p>
        </div>
        <div className="event-mark">
          <span>Event 07</span>
          <strong>Singularity Circuit</strong>
        </div>
        <div className="race-setup-stack">
          <CompactJukebox jukebox={jukebox} />
          <div className="top-actions">
            <select
              aria-label="Player count"
              value={playerCount}
              onChange={(event) => setPlayerCount(Number(event.target.value))}
            >
              <option value={2}>2 players</option>
              <option value={3}>3 players</option>
              <option value={4}>4 players</option>
            </select>
            <select
              aria-label="Harmony target"
              value={raceLength}
              onChange={(event) => setRaceLength(event.target.value as RaceLength)}
            >
              <option value="sprint">Sprint - {RACE_HARMONY_TARGETS.sprint.toLocaleString()}</option>
              <option value="run">Run - {RACE_HARMONY_TARGETS.run.toLocaleString()}</option>
              <option value="marathon">Marathon - {RACE_HARMONY_TARGETS.marathon.toLocaleString()}</option>
            </select>
            <select
              aria-label="Distinct prime target"
              value={primeRaceLength}
              onChange={(event) => setPrimeRaceLength(event.target.value as RaceLength)}
            >
              <option value="sprint">{PRIME_CLIMB_LEVEL_LABELS.sprint} - {RACE_DISTINCT_PRIME_TARGETS.sprint}</option>
              <option value="run">{PRIME_CLIMB_LEVEL_LABELS.run} - {RACE_DISTINCT_PRIME_TARGETS.run}</option>
              <option value="marathon">{PRIME_CLIMB_LEVEL_LABELS.marathon} - {RACE_DISTINCT_PRIME_TARGETS.marathon}</option>
            </select>
            <button type="button" className="primary" onClick={startRace}>
              <Play size={16} /> Start Race
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={soundEffects.muted ? "Enable sound effects" : "Mute sound effects"}
              aria-pressed={soundEffects.muted}
              title={soundEffects.muted ? "Enable sound effects" : "Mute sound effects"}
              onClick={() => soundEffects.setMuted(!soundEffects.muted)}
            >
              {soundEffects.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </section>

      <section className="status-band">
        <div>
          <span>Turn</span>
          <strong>{state.turn}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{current.name}</strong>
        </div>
        <div>
          <span>Phase</span>
          <strong>{state.phase.split("_").join(" ")}</strong>
        </div>
        <div>
          <span>Winner</span>
          <strong>{state.winnerId ? state.players.find((player) => player.id === state.winnerId)?.name : "None"}</strong>
        </div>
      </section>

      {DEV_MATCH_LOGGING && devMatchLog && (
        <section className="dev-match-toolbar" aria-label="Development match logger">
          <div>
            <strong>Dev Match Recorder</strong>
            <span>{devMatchLog.actions.length} actions captured locally</span>
          </div>
          <button type="button" onClick={exportDevMatchLogs}>
            <Download size={15} /> Export match logs
          </button>
          <button type="button" onClick={clearDevMatchLogs}>
            <Trash2 size={15} /> Clear logs
          </button>
        </section>
      )}

      <section className="competitive-layout">
        <PlayerPanel
          player={accountPlayer}
          active={accountPlayer.id === current.id}
          automated={false}
          index={0}
          harmonyTarget={state.harmonyTarget}
          distinctPrimeTarget={state.distinctPrimeTarget}
          layoutClassName="cockpit-slot"
        />
        <RaceTracker
          state={state}
          className="viewscreen-slot"
          localPlayerId={accountPlayer.id}
          selectedPlayerId={selectedTarget.id}
          onSelectPlayer={setSelectedTargetId}
        />
        <div className="query-slot">
          <div className="query-heading">
            <p className="eyebrow">Target / Query Screen</p>
            <strong>{selectedTarget.name}</strong>
          </div>
          <PlayerPanel
            player={selectedTarget}
            active={selectedTarget.id === current.id}
            automated={aiPlayerIds.has(selectedTarget.id)}
            index={state.players.findIndex((player) => player.id === selectedTarget.id)}
            harmonyTarget={state.harmonyTarget}
            distinctPrimeTarget={state.distinctPrimeTarget}
            layoutClassName="query-player-panel"
          />
        </div>

        <div className="panel action-panel actions-slot">
          <h2>Actions</h2>
          {aiThinking && (
            <div className="ai-thinking" role="status">
              <Bot size={20} />
              <div>
                <strong>{state.players.find((player) => player.id === currentDecisionOwnerId)?.name} is calculating</strong>
                <span>Heuristic navigator selecting a legal action</span>
              </div>
            </div>
          )}
          {state.phase === "TURN_START" && !aiThinking && (
            <button type="button" className="primary" onClick={() => dispatch({ type: "startTurn" })}>
              <ActionGlyph name="roll" /> Start Turn
            </button>
          )}

          {state.pendingCapture && !aiThinking && (
            <div className="choice-block">
              <h3>Capture Prime</h3>
              <div className="button-row">
                {state.pendingCapture.choices.map((prime) => (
                  <button key={prime} type="button" onClick={() => dispatch({ type: "capturePrime", prime })}>
                    Capture {prime}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.pendingCombatChoice?.kind === "damage" && !aiThinking && (
            <div className="choice-block">
              <h3>Choose Damage Prime</h3>
              <div className="button-row">
                {state.pendingCombatChoice.sharedPrimes?.map((prime) => (
                  <button key={prime} type="button" onClick={() => dispatch({ type: "applyDamage", prime })}>
                    Divide {prime}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.pendingCombatChoice?.kind === "prime-theft" && !aiThinking && (
            <div className="choice-block">
              <h3>Steal Captured Prime</h3>
              <div className="button-row">
                {state.pendingCombatChoice.stealablePrimes?.map((prime) => (
                  <button key={prime} type="button" onClick={() => dispatch({ type: "stealPrime", prime })}>
                    Steal {prime}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.forcedTurnEnd && !aiThinking && (
            <button type="button" className="primary" onClick={() => dispatch({ type: "endTurn" })}>
              <ActionGlyph name="end" /> End Forced Turn
            </button>
          )}

          {canAct && !aiThinking && (
            <>
              <button type="button" disabled={!legalForcedJump(current)} onClick={() => dispatch({ type: "forcedJump" })}>
                <ActionGlyph name="jump" /> Forced 3N+1 Jump
                <span className="cost-chip">{forcedJumpResonanceCost(current.pulse, current.turbulence)} res</span>
              </button>

              <details className="choice-block action-group" open>
                <summary>Prime-Fueled Modification</summary>
                <div className="button-row">
                  {legalPulseModifications(current).map((option) => (
                    <button
                      key={`${option.prime}-${option.operation}`}
                      type="button"
                      onClick={() => dispatch({ type: "modifyPulse", prime: option.prime, operation: option.operation })}
                    >
                      <ActionGlyph name={option.operation === "add" ? "add" : "subtract"} />
                      {option.operation === "add" ? "+" : "-"} {option.prime}
                      <span className="cost-chip">{primeModificationResonanceCost(option.prime, current.turbulence)} res</span>
                    </button>
                  ))}
                  {legalPulseModifications(current).length === 0 && (
                    <p className="muted">
                      No affordable captured primes available.
                    </p>
                  )}
                </div>
              </details>

              <details className="choice-block action-group" open>
                <summary>Prime Division</summary>
                <div className="button-row">
                  {legalPrimeDivisions(current).map((prime) => (
                    <button
                      key={`divide-${prime}`}
                      type="button"
                      onClick={() => dispatch({ type: "dividePulse", prime })}
                    >
                      <ActionGlyph name="divide" /> Divide by {prime}
                      <span className="cost-chip">
                        +{primeDivisionResonanceGain(current.pulse, prime)} / -{turbulenceActionCost(current.turbulence)} res
                      </span>
                    </button>
                  ))}
                  {legalPrimeDivisions(current).length === 0 && (
                    <p className="muted">No captured prime can divide into this pulse.</p>
                  )}
                </div>
              </details>

              <AttackControls state={state} defenderId={selectedTarget.id} dispatch={dispatch} />

              <button type="button" className="primary" onClick={() => dispatch({ type: "endTurn" })}>
                <ActionGlyph name="end" /> End Turn
              </button>
            </>
          )}
        </div>

        <div className="panel log-panel event-log-slot">
          <h2>Event Log</h2>
          <ol>
            {state.eventLog
              .slice()
              .reverse()
              .map((event, index) => (
                <li key={`${event.turn}-${index}`}>
                  <span>Turn {event.turn}</span>
                  {event.message}
                </li>
              ))}
          </ol>
        </div>
      </section>

      <Jukebox jukebox={jukebox} />
    </main>
  );
}

function PlayerPanel({
  player,
  active,
  automated,
  index,
  harmonyTarget,
  distinctPrimeTarget,
  layoutClassName = ""
}: {
  player: PlayerState;
  active: boolean;
  automated: boolean;
  index: number;
  harmonyTarget: number;
  distinctPrimeTarget: number;
  layoutClassName?: string;
}) {
  const captured = useMemo(() => distinctPrimes(player.capturedPrimes), [player.capturedPrimes]);
  const factorChoices = availableCapturePrimes(player);
  return (
    <article className={`player-panel player-${index + 1} ${active ? "active" : ""} ${layoutClassName}`.trim()}>
      <header>
        <div className="rank-badge">{index + 1}</div>
        <h2>{player.name}</h2>
        <div className="player-badges">
          {automated && <span className="ai-badge"><Bot size={13} /> AI</span>}
          {active && <span>Active</span>}
        </div>
      </header>
      <div className="pulse">{player.pulse}</div>
      <dl>
        <div>
          <dt>Factorization</dt>
          <dd>{formatFactorization(player.pulse)}</dd>
        </div>
        <div>
          <dt>Resonance</dt>
          <dd>{player.resonance}</dd>
        </div>
        <div>
          <dt>Harmony</dt>
          <dd>{harmonyScore(player.capturedPrimes)}</dd>
        </div>
        <div>
          <dt>Plasma Turbulence</dt>
          <dd>{player.turbulence} (+{turbulenceActionCost(player.turbulence)} cost)</dd>
        </div>
        <div>
          <dt>Distinct</dt>
          <dd>{distinctPrimeCount(player.capturedPrimes)} / {distinctPrimeTarget}</dd>
        </div>
      </dl>
      <div className="token-area">
        <strong>Captured</strong>
        <div className="tokens">
          {captured.map((prime) => (
            <span key={prime} className={`prime-token prime-${prime}`}>{prime} x{player.capturedPrimes[prime]}</span>
          ))}
          {captured.length === 0 && <em>None</em>}
        </div>
      </div>
      <div className="mini-row">
        <span>Capture choices: {factorChoices.join(", ") || "none"}</span>
        <span>Used attacks: {player.usedAttackPrimesThisTurn.join(", ") || "none"}</span>
        <span>Prime uses: {formatPrimeUses(player.primeUsesThisTurn)}</span>
        <span>Victory: {harmonyScore(player.capturedPrimes)} / {harmonyTarget.toLocaleString()} Harmony</span>
      </div>
    </article>
  );
}

function AttackControls({
  state,
  defenderId,
  dispatch
}: {
  state: GameState;
  defenderId: string;
  dispatch: (action: Parameters<typeof applyAction>[1]) => void;
}) {
  const attacker = activePlayer(state);
  const opponents = state.players.filter((player) => player.id === defenderId && player.id !== attacker.id);

  return (
    <details className="choice-block action-group" open>
      <summary>Attacks</summary>
      <div className="attack-list">
        {opponents.map((defender) => {
          const primes = eligibleAttackPrimes(attacker, defender);
          const theft = canDeclarePrimeTheft(attacker, defender);
          return (
            <div className="attack-row" key={defender.id}>
              <div>
                <strong>{defender.name}</strong>
                <span>Shared: {sharedPrimeValues(attacker.pulse, defender.pulse).join(", ") || "none"}</span>
              </div>
              <div className="button-row">
                {primes.map((prime) => (
                  <button
                    key={`${defender.id}-${prime}`}
                    type="button"
                    onClick={() =>
                      dispatch({ type: "attack", defenderId: defender.id, initiatingPrime: prime, attackKind: "normal" })
                    }
                  >
                    <ActionGlyph name="attack" /> {prime}
                    <span className="cost-chip">{prime + turbulenceActionCost(attacker.turbulence)} res</span>
                  </button>
                ))}
                {theft &&
                  primes.map((prime) => (
                    <button
                      key={`${defender.id}-${prime}-theft`}
                      type="button"
                      onClick={() =>
                        dispatch({ type: "attack", defenderId: defender.id, initiatingPrime: prime, attackKind: "prime-theft" })
                      }
                    >
                      <ActionGlyph name="theft" /> Theft {prime}
                      <span className="cost-chip">{prime + turbulenceActionCost(attacker.turbulence)} res</span>
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function ActionGlyph({ name }: { name: "step" | "jump" | "add" | "subtract" | "divide" | "capture" | "attack" | "theft" | "roll" | "end" }) {
  return <span className={`action-glyph glyph-${name}`} aria-hidden="true" />;
}

function isAiSeat(state: GameState, playerId: string, aiCount: number): boolean {
  return state.players.slice(state.players.length - aiCount).some((player) => player.id === playerId);
}

function formatPrimeUses(uses: Record<number, number>): string {
  const entries = Object.entries(uses).filter(([, count]) => count > 0);
  return entries.length > 0 ? entries.map(([prime, count]) => `${prime} x${count}`).join(", ") : "none";
}

export default App;
