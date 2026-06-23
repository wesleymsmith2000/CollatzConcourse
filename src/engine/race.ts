import type { RaceLength } from "./types";

export const RACE_HARMONY_TARGETS: Record<RaceLength, number> = {
  sprint: 1_000,
  run: 50_000,
  marathon: 1_000_000
};

export const RACE_DISTINCT_PRIME_TARGETS: Record<RaceLength, number> = {
  sprint: 10,
  run: 20,
  marathon: 40
};

export const PRIME_CLIMB_LEVEL_LABELS: Record<RaceLength, string> = {
  sprint: "Foothill",
  run: "Mountain",
  marathon: "Everest"
};
