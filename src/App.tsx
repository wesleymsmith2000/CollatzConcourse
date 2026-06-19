import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
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
  harmonyScore,
  legalForcedJump,
  legalPulseModifications,
  sharedPrimeValues,
  type GameState,
  type PlayerState
} from "./engine";
import { visualAssets } from "./ui/assets";

function App() {
  const [playerCount, setPlayerCount] = useState(2);
  const [state, setState] = useState<GameState>(() => createInitialState(2));
  const current = activePlayer(state);

  function dispatch(action: Parameters<typeof applyAction>[1]) {
    setState((previous) => applyAction(previous, action));
  }

  function resetGame(count = playerCount) {
    setPlayerCount(count);
    setState(createInitialState(count));
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
        <div className="top-actions">
          <select
            aria-label="Player count"
            value={playerCount}
            onChange={(event) => resetGame(Number(event.target.value))}
          >
            <option value={2}>2 players</option>
            <option value={3}>3 players</option>
            <option value={4}>4 players</option>
          </select>
          <button type="button" onClick={() => resetGame()}>
            <RotateCcw size={16} /> Reset
          </button>
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

      <section className="player-grid">
        {state.players.map((player, index) => (
          <PlayerPanel key={player.id} player={player} active={player.id === current.id} index={index} />
        ))}
      </section>

      <section className="workbench">
        <div className="panel action-panel">
          <h2>Actions</h2>
          {state.phase === "TURN_START" && (
            <button type="button" className="primary" onClick={() => dispatch({ type: "startTurn" })}>
              <ActionGlyph name="roll" /> Start Turn
            </button>
          )}

          {state.pendingCapture && (
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

          {state.pendingCombatChoice?.kind === "damage" && (
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

          {state.pendingCombatChoice?.kind === "prime-theft" && (
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

          {state.forcedTurnEnd && (
            <button type="button" className="primary" onClick={() => dispatch({ type: "endTurn" })}>
              <ActionGlyph name="end" /> End Forced Turn
            </button>
          )}

          {canAct && (
            <>
              <button type="button" disabled={!legalForcedJump(current)} onClick={() => dispatch({ type: "forcedJump" })}>
                <ActionGlyph name="jump" /> Forced 3N+1 Jump
              </button>

              <div className="choice-block">
                <h3>Prime-Fueled Modification</h3>
                <div className="button-row">
                  {legalPulseModifications(current).map((option) => (
                    <button
                      key={`${option.prime}-${option.operation}`}
                      type="button"
                      onClick={() => dispatch({ type: "modifyPulse", prime: option.prime, operation: option.operation })}
                    >
                      <ActionGlyph name={option.operation === "add" ? "add" : "subtract"} />
                      {option.operation === "add" ? "+" : "-"} {option.prime}
                    </button>
                  ))}
                  {legalPulseModifications(current).length === 0 && <p className="muted">No captured primes available.</p>}
                </div>
              </div>

              <AttackControls state={state} dispatch={dispatch} />

              <button type="button" className="primary" onClick={() => dispatch({ type: "endTurn" })}>
                <ActionGlyph name="end" /> End Turn
              </button>
            </>
          )}
        </div>

        <div className="panel log-panel">
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
    </main>
  );
}

function PlayerPanel({ player, active, index }: { player: PlayerState; active: boolean; index: number }) {
  const captured = useMemo(() => distinctPrimes(player.capturedPrimes), [player.capturedPrimes]);
  const factorChoices = availableCapturePrimes(player);
  return (
    <article className={`player-panel player-${index + 1} ${active ? "active" : ""}`}>
      <header>
        <div className="rank-badge">{index + 1}</div>
        <h2>{player.name}</h2>
        {active && <span>Active</span>}
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
          <dt>Distinct</dt>
          <dd>{distinctPrimeCount(player.capturedPrimes)} / 10</dd>
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
      </div>
    </article>
  );
}

function AttackControls({
  state,
  dispatch
}: {
  state: GameState;
  dispatch: (action: Parameters<typeof applyAction>[1]) => void;
}) {
  const attacker = activePlayer(state);
  const opponents = state.players.filter((player) => player.id !== attacker.id);

  return (
    <div className="choice-block">
      <h3>Attacks</h3>
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
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionGlyph({ name }: { name: "step" | "jump" | "add" | "subtract" | "capture" | "attack" | "theft" | "roll" | "end" }) {
  return <span className={`action-glyph glyph-${name}`} aria-hidden="true" />;
}

export default App;
