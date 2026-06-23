import { Fragment, type CSSProperties } from "react";
import { Radar } from "lucide-react";
import {
  distinctPrimeCount,
  harmonyScore,
  PRIME_CLIMB_LEVEL_LABELS,
  type GameState,
  type RaceProgressPoint
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

export function formatRaceRoutePoints(
  history: RaceProgressPoint[],
  harmonyTarget: number,
  distinctPrimeTarget: number
): string {
  const progressPoints = history
    .filter((point, index) => index > 0 || point.harmony > 0 || point.distinctPrimes > 0)
    .map((point) => {
      const x = harmonyPlotPosition(point.harmony, harmonyTarget);
      const y = 100 - racePlotPosition(point.distinctPrimes, distinctPrimeTarget);
      return `${x},${y}`;
    });
  return ["0,100", ...progressPoints].join(" ");
}

export function RaceTracker({
  state,
  className = "",
  localPlayerId,
  selectedPlayerId,
  onSelectPlayer
}: {
  state: GameState;
  className?: string;
  localPlayerId?: string;
  selectedPlayerId?: string;
  onSelectPlayer?: (playerId: string) => void;
}) {
  const winnerIndex = state.winnerId ? state.players.findIndex((player) => player.id === state.winnerId) : -1;
  const winnerHistory = state.winnerId ? state.raceHistory[state.winnerId] ?? [] : [];
  const winnerRoutePoints = formatRaceRoutePoints(winnerHistory, state.harmonyTarget, state.distinctPrimeTarget);

  return (
    <section className={`race-display ${className}`.trim()} aria-labelledby="race-display-title">
      <header className="race-display-header">
        <div>
          <p className="eyebrow">Concourse Navigation Array</p>
          <h2 id="race-display-title"><Radar size={19} /> Race Vector</h2>
        </div>
        <div className="race-target-readout">
          <span>H {state.raceLength} / P {PRIME_CLIMB_LEVEL_LABELS[state.primeRaceLength]}</span>
          <strong>{state.harmonyTarget.toLocaleString()} H / {state.distinctPrimeTarget} primes</strong>
          <small>Craft: race position / Arrow: pulse</small>
        </div>
      </header>

      <div className="race-chart-frame">
        <div className="race-y-title">Distinct prime climb</div>
        <div className="race-chart">
          <div className="race-grid" aria-hidden="true" />
          {state.winnerId && winnerRoutePoints && (
            <svg
              className={`winner-route player-${winnerIndex + 1}`}
              viewBox="0 0 100 100"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              role="img"
              aria-label={`${state.players[winnerIndex]?.name ?? "Winner"} race progress path`}
            >
              <polyline points={winnerRoutePoints} vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          <div className="victory-sector" aria-hidden="true"><span>Victory sector</span></div>
          <div className="prime-threshold" aria-hidden="true"><span>{state.distinctPrimeTarget} primes</span></div>
          <div className="harmony-threshold" aria-hidden="true"><span>{formatCompact(state.harmonyTarget)} H</span></div>

          {state.players.map((player, index) => {
            const primes = distinctPrimeCount(player.capturedPrimes);
            const harmony = harmonyScore(player.capturedPrimes);
            const primePosition = racePlotPosition(primes, state.distinctPrimeTarget);
            const harmonyPosition = harmonyPlotPosition(harmony, state.harmonyTarget);
            const pulsePosition = harmonyPlotPosition(player.pulse, state.harmonyTarget);
            const offset = MARKER_OFFSETS[index] ?? MARKER_OFFSETS[0];
            const style = {
              left: `${harmonyPosition}%`,
              bottom: `${primePosition}%`,
              "--marker-x": `${offset.x}px`,
              "--marker-y": `${offset.y}px`
            } as CSSProperties;
            const pulseVectorStyle = {
              left: `${Math.min(harmonyPosition, pulsePosition)}%`,
              bottom: `${primePosition}%`,
              width: `${Math.abs(pulsePosition - harmonyPosition)}%`,
              "--marker-y": `${offset.y}px`
            } as CSSProperties;
            const selectable = Boolean(onSelectPlayer && player.id !== localPlayerId);

            return (
              <Fragment key={player.id}>
                <div
                  className={`pulse-vector player-${index + 1} ${pulsePosition >= harmonyPosition ? "advancing" : "retreating"}`}
                  style={pulseVectorStyle}
                  title={`${player.name} pulse: ${player.pulse.toLocaleString()}`}
                  aria-label={`${player.name} pulse projection at ${player.pulse.toLocaleString()}`}
                >
                  <span>{formatCompact(player.pulse)}</span>
                </div>
                <button
                  type="button"
                  className={`race-craft player-${index + 1}${index === state.activePlayerIndex ? " active" : ""}${player.id === state.winnerId ? " winner" : ""}${player.id === selectedPlayerId ? " selected" : ""}${selectable ? " selectable" : ""}`}
                  style={style}
                  title={`${player.name}: ${primes} primes, ${harmony.toLocaleString()} Harmony`}
                  aria-label={`${player.name}: ${primes} distinct primes and ${harmony.toLocaleString()} Harmony`}
                  aria-pressed={selectable ? player.id === selectedPlayerId : undefined}
                  onClick={() => selectable && onSelectPlayer?.(player.id)}
                >
                  <span>{index + 1}</span>
                </button>
              </Fragment>
            );
          })}
        </div>
        <div className="race-x-title">log2(1 + Harmony) distance</div>
      </div>

      <div className="race-legend" aria-label="Player race progress">
        {state.players.map((player, index) => (
          <button
            key={player.id}
            type="button"
            className={`race-legend-player player-${index + 1}${player.id === selectedPlayerId ? " selected" : ""}`}
            onClick={() => player.id !== localPlayerId && onSelectPlayer?.(player.id)}
          >
            <i />
            <strong>{player.name}</strong>
            <span>{distinctPrimeCount(player.capturedPrimes)} P</span>
            <span>{harmonyScore(player.capturedPrimes).toLocaleString()} H</span>
            <span>{player.pulse.toLocaleString()} N</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
