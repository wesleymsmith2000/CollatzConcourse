import type { RaceLength } from "./types";

export const RACE_HARMONY_TARGETS: Record<RaceLength, number> = {
  sprint: 1_000,
  run: 50_000,
  marathon: 1_000_000
};
