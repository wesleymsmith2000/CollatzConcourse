import { describe, expect, it } from "vitest";
import { harmonyPlotPosition, racePlotPosition } from "../ui/RaceTracker";

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
});
