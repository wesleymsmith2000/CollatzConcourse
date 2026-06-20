# Collatz Concourse

Browser-based MVP implementation of Collatz Concourse, built engine-first for local hot-seat playtesting, deterministic tests, and future multiplayer expansion.

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

## Core Rules

- 2 to 4 players race through Collatz-style pulse movement.
- Each player tracks a pulse, captured prime multiset, resonance, and attack primes used this turn.
- A turn rolls 1d6 resonance, performs one mandatory Collatz pulse step, captures one available factor when possible, then allows optional actions.
- Optional actions include forced `3N + 1` jumps, prime-fueled pulse modification, normal attacks, Prime Theft, and ending the turn.
- Forced `3N + 1` jumps cost `floor(log2(pulse))` resonance; prime-fueled modifications cost `floor(log2(prime))` resonance.
- At end of turn, resonance above `floor(log2(owned prime tokens))` decays by 50%, rounded down.
- Victory requires at least 10 distinct captured prime values and the selected Harmony target: Sprint 1,000, Run 50,000, or Marathon 1,000,000.

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
