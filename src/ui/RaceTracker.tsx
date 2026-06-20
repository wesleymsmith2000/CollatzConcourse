import { Fragment, type CSSProperties } from "react";
import { Radar } from "lucide-react";
import {
  distinctPrimeCount,
  harmonyScore,
  VICTORY_DISTINCT_PRIME_TARGET,
  type GameState
} from "../engine";

const WIN_THRESHOLD_PERCENT = 80;
const PLOT_ORIGIN_PERCENT = 4;
const MARKER_OFFSETS = [
  { x: -10, y: -8 },
  { x: 10, y: -8 },
  { x: -10, y: 8 },
  { x: 10, y: 8 }
];

export function racePlotPosition(value: number, target: number): number {
  if (target <= 0) return PLOT_ORIGIN_PERCENT;
  const scaled = PLOT_ORIGIN_PERCENT + (Math.max(0, value) / target) * (WIN_THRESHOLD_PERCENT - PLOT_ORIGIN_PERCENT);
  return Math.min(96, scaled);
}

export function harmonyPlotPosition(harmony: number, target: number): number {
  if (target <= 0) return PLOT_ORIGIN_PERCENT;
  return racePlotPosition(Math.log2(1 + Math.max(0, harmony)), Math.log2(1 + target));
}

export function RaceTracker({ state, className = "" }: { state: GameState; className?: string }) {
  return (
    <section className={`race-display ${className}`.trim()} aria-labelledby="race-display-title">
      <header className="race-display-header">
        <div>
          <p className="eyebrow">Concourse Navigation Array</p>
          <h2 id="race-display-title"><Radar size={19} /> Race Vector</h2>
        </div>
        <div className="race-target-readout">
          <span>{state.raceLength}</span>
          <strong>{state.harmonyTarget.toLocaleString()} H / {VICTORY_DISTINCT_PRIME_TARGET} primes</strong>
          <small>Craft: race position / Arrow: pulse</small>
        </div>
      </header>

      <div className="race-chart-frame">
        <div className="race-y-title">log2(1 + value)</div>
        <div className="race-chart">
          <div className="race-grid" aria-hidden="true" />
          <div className="victory-sector" aria-hidden="true"><span>Victory sector</span></div>
          <div className="prime-threshold" aria-hidden="true"><span>{VICTORY_DISTINCT_PRIME_TARGET} primes</span></div>
          <div className="harmony-threshold" aria-hidden="true"><span>{formatCompact(state.harmonyTarget)} H</span></div>

          {state.players.map((player, index) => {
            const primes = distinctPrimeCount(player.capturedPrimes);
            const harmony = harmonyScore(player.capturedPrimes);
            const harmonyPosition = harmonyPlotPosition(harmony, state.harmonyTarget);
            const pulsePosition = harmonyPlotPosition(player.pulse, state.harmonyTarget);
            const offset = MARKER_OFFSETS[index] ?? MARKER_OFFSETS[0];
            const style = {
              left: `${racePlotPosition(primes, VICTORY_DISTINCT_PRIME_TARGET)}%`,
              bottom: `${harmonyPosition}%`,
              "--marker-x": `${offset.x}px`,
              "--marker-y": `${offset.y}px`
            } as CSSProperties;
            const pulseVectorStyle = {
              left: `${racePlotPosition(primes, VICTORY_DISTINCT_PRIME_TARGET)}%`,
              bottom: `${Math.min(harmonyPosition, pulsePosition)}%`,
              height: `${Math.abs(pulsePosition - harmonyPosition)}%`,
              "--marker-x": `${offset.x}px`
            } as CSSProperties;

            return (
              <Fragment key={player.id}>
                <div
                  className={`pulse-vector player-${index + 1} ${pulsePosition >= harmonyPosition ? "rising" : "falling"}`}
                  style={pulseVectorStyle}
                  title={`${player.name} pulse: ${player.pulse.toLocaleString()}`}
                  aria-label={`${player.name} pulse projection at ${player.pulse.toLocaleString()}`}
                >
                  <span>{formatCompact(player.pulse)}</span>
                </div>
                <div
                  className={`race-craft player-${index + 1}${index === state.activePlayerIndex ? " active" : ""}${player.id === state.winnerId ? " winner" : ""}`}
                  style={style}
                  title={`${player.name}: ${primes} primes, ${harmony.toLocaleString()} Harmony`}
                  aria-label={`${player.name}: ${primes} distinct primes and ${harmony.toLocaleString()} Harmony`}
                >
                  <span>{index + 1}</span>
                </div>
              </Fragment>
            );
          })}
        </div>
        <div className="race-x-title">Distinct prime count</div>
      </div>

      <div className="race-legend" aria-label="Player race progress">
        {state.players.map((player, index) => (
          <div key={player.id} className={`race-legend-player player-${index + 1}`}>
            <i />
            <strong>{player.name}</strong>
            <span>{distinctPrimeCount(player.capturedPrimes)} P</span>
            <span>{harmonyScore(player.capturedPrimes).toLocaleString()} H</span>
            <span>{player.pulse.toLocaleString()} N</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
