import { describe, expect, it } from "vitest";
import { formatRaceRoutePoints, harmonyPlotPosition, racePlotPosition } from "../ui/RaceTracker";

describe("race tracker plot scaling", () => {
  it("places the origin, victory threshold, and overshoot consistently", () => {
    expect(racePlotPosition(0, 10)).toBe(4);
    expect(racePlotPosition(5, 10)).toBe(42);
    expect(racePlotPosition(10, 10)).toBe(80);
    expect(racePlotPosition(20, 10)).toBe(96);
  });

  it("clamps negative and invalid values to the origin", () => {
    expect(racePlotPosition(-5, 10)).toBe(4);
    expect(racePlotPosition(5, 0)).toBe(4);
  });

  it("plots Harmony on a log2(1 + Harmony) scale", () => {
    expect(harmonyPlotPosition(0, 1023)).toBe(4);
    expect(harmonyPlotPosition(31, 1023)).toBe(42);
    expect(harmonyPlotPosition(1023, 1023)).toBe(80);
    expect(harmonyPlotPosition(-5, 1023)).toBe(4);
    expect(harmonyPlotPosition(5, 0)).toBe(4);
  });

  it("draws a winner route from the plot origin through the final craft position", () => {
    const route = formatRaceRoutePoints(
      [
        { turn: 1, pulse: 1, harmony: 0, distinctPrimes: 0 },
        { turn: 8, pulse: 401, harmony: 1_000, distinctPrimes: 10 }
      ],
      1_000,
      10
    );
    expect(route).toBe("0,100 80,20");
  });

  it("rescales route elevation for the selected distinct-prime target", () => {
    const route = formatRaceRoutePoints(
      [{ turn: 8, pulse: 401, harmony: 1_000, distinctPrimes: 10 }],
      1_000,
      20
    );
    expect(route).toBe("0,100 80,58");
  });
});
