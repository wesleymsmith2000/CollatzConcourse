# Collatz Concourse Codex Notes

## Project

Collatz Concourse is a Vite + React + TypeScript MVP with the game engine intentionally separated from the UI. It reuses the infrastructure shape and several pure-rule ideas from Primordial Cipher.

## Structure

- `src/engine/` contains UI-independent game rules, math, state, combat, resonance, and action logic.
- `src/ui/` contains React UI components that render engine state and submit legal actions.
- `src/tests/` contains Vitest coverage for engine behavior.
- `docs-center/` mirrors the Primordial Cipher documentation approach with overview, code docs, gameplay docs, and playtest notes.

## Commands

Use `npm.cmd` on Windows PowerShell if `npm.ps1` execution policy blocks plain `npm`.

```bash
npm install
npm run typecheck
npm run test:run
npm run build
```

For local development:

```bash
npm run dev
```

## Guardrails

- Keep engine rules independent from React UI.
- Preserve prime multiplicity in factorization, combat dice, and captured-prime multisets.
- Use dependency-injected dice rollers for deterministic tests.
- Add focused tests in `src/tests/` when changing engine behavior.
- Do not commit `node_modules/` or `dist/`.
