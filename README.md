# Collatz Concourse

Browser-based MVP implementation of Collatz Concourse, built engine-first for local human-versus-AI playtesting, deterministic tests, and future hosted multiplayer.

The application includes a provisional multi-scene portal with local development account sessions and selectable canon, community, and development server descriptors. These sessions are mock adapters, not secure authentication.

## Stack

- Vite
- React
- TypeScript
- Vitest

## Start

```powershell
npm.cmd install
npm.cmd run dev
```

PowerShell may block `npm.ps1` on this machine, so use `npm.cmd` when needed.

## Tests

```powershell
npm.cmd run test:run
npm.cmd run typecheck
npm.cmd run build
```

## Development Match Logs

When running with `npm.cmd run dev`, the race screen records match actions and before/after player metrics in browser `localStorage`. The development toolbar can export the newest 25 completed or interrupted matches as JSON or clear the archive. Production builds do not enable this recorder.

Place representative exported logs in `assets/training_logs/` for balance analysis and future heuristic regression scenarios.

## Current Checkpoint

- Multi-scene Gateway, Hub, Race, and Account portal with mock local credentials.
- Two-to-four-player races with one account cockpit and heuristic rival pilots.
- Prime Division, plasma turbulence, configurable Harmony and distinct-prime targets, combat, Prime Theft, and victory routes.
- Training-log-informed AI with parity planning, divide-by-2 jump loops, Harmony/discovery phases, and midpoint breakout safeguards.
- Automatic music-library discovery and development-only match recording/export.
- Canonical serialization, SHA-256 hashing, and protocol envelope foundations under `src/shared/protocol/`.

AI difficulty profiles and guided tutorials are planned applications of the recorded heuristic behaviors; they are not yet selectable game modes.

## Core Rules

- 2 to 4 players race through Collatz-style pulse movement.
- Each player tracks a pulse, captured prime multiset, resonance, and attack primes used this turn.
- A turn rolls 1d6 resonance, performs one mandatory Collatz pulse step, captures one available factor when possible, then allows optional actions.
- Optional actions include forced `3N + 1` jumps, prime-fueled pulse modification, prime division, normal attacks, Prime Theft, and ending the turn.
- Forced `3N + 1` jumps cost `floor(log2(pulse))` resonance; prime-fueled modifications cost `floor(log2(prime))` resonance.
- Prime division sacrifices one captured prime no larger than the pulse, replaces the pulse with its integer quotient, and gains `floor(log2(old pulse)) - floor(log2(prime)) + floor(log2(remainder))` resonance; the remainder term is omitted when it is zero.
- Reusing a prime during one turn adds plasma turbulence equal to its previous uses that turn: the second use adds 1, the third adds 2, and so on. Every optional action pays an additional `floor(log2(turbulence + 1))` resonance.
- Plasma turbulence persists between rounds and halves at the end of the player's turn. Taking no optional actions that turn halves it a second time; both halvings round down.
- At end of turn, resonance above `floor(log2(owned prime tokens))` decays by 50%, rounded down.
- Victory requires the selected distinct-prime target—Foothill 10, Mountain 20, or Everest 40—and the selected Harmony target: Sprint 1,000, Run 50,000, or Marathon 1,000,000.
- The authenticated account occupies seat 1 in the cockpit UI; local rival seats use the explainable heuristic AI.
- Heuristic rivals use Prime Division to descend from high pulses when their low-prime bank is depleted, favoring duplicate sacrifices, accounting for turbulence costs, and protecting scarce unique high-value primes.
- Once a heuristic rival secures the required number of distinct primes, it switches from discovery to Harmony growth: it favors higher-value captures and stops overvaluing new prime varieties.
- Heuristic rivals treat a reserved 2 as a tactical engine: when the pulse is twice an odd number, they can divide by 2, spend the generated resonance on a forced jump, and prioritize recapturing 2 from the resulting even pulse.
- Heuristic rivals prefer to finish growth turns on an odd pulse, making the next free Collatz step a growth jump and an even divide-by-2 setup. With a depleted low-prime bank, they may deliberately finish even to descend and rebuild instead.
- To escape midpoint loops, heuristic rivals only grant the special divide-by-2 setup bonus once per turn and refuse to sacrifice a last-copy prime when its net resonance gain is too small relative to the prime's Harmony value.

## Hosted Multiplayer Roadmap

The static React application can be deployed now, but browsers do not yet share authoritative match state. The minimum hosted architecture is a React client connected by WebSocket to an authoritative match service that imports the same engine and persists commands and snapshots.

Before room hosting, the engine needs a deterministic replay boundary:

1. Replace function-valued dice rollers and implicit `Math.random()` with serializable deterministic random inputs.
2. Define versioned commands, typed domain events, sequence validation, and state hashes.
3. Replay a complete transcript from genesis and reproduce the same final checksum.
4. Add room creation/join codes, seats, reconnection snapshots, turn ownership, and server-side persistence.
5. Add real authentication, rate limits, disconnect/forfeit policy, matchmaking, and federation incrementally.

The current all-public race does not require hidden-information proofs. Deck, hand, and Snare commitments belong to the later CCG milestone.

## Architecture Notes

The engine under `src/engine/` is UI-independent. React renders state, calls selectors, and submits actions through engine functions. Game state is plain serializable data.

Primordial Cipher reuse:

- Reused project infrastructure shape: Vite, React, TypeScript, Vitest, `src/engine`, `src/tests`, `src/ui`, and `docs-center`.
- Adapted pure prime-factorization concepts from `PrimordialCipher/src/engine/math.ts`.
- Adapted deterministic dice injection from Primordial Cipher combat tests and engine flow.
- Adapted engine-first docs-center approach, with separate code and gameplay documentation.

No Primordial Cipher files were modified.

## Unresolved Assumptions

- Owned prime count includes duplicate captured tokens when calculating resonance retention.
- The standard turn auto-captures a selected factor immediately after the mandatory pulse step in the UI.
- Prime Theft is only available when both involved players have at least one captured prime.
- Future team modes should separate pulse, resonance, captured-prime, and victory ownership, but the MVP uses per-player ownership.

## Playtest Checklist

See `docs-center/playtest/index.html` for the current checklist.

See `docs-center/architecture/index.html` for the CCG repository assessment, shared protocol plan, federation boundary, and security limitations.
