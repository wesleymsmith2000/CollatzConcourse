import { describe, expect, it } from "vitest";
import { factorize, factorMultiset, floorLog2 } from "../engine";

describe("prime factorization", () => {
  it("preserves multiplicity", () => {
    expect(factorize(1)).toEqual([]);
    expect(factorize(2)).toEqual([2]);
    expect(factorize(4)).toEqual([2, 2]);
    expect(factorize(12)).toEqual([2, 2, 3]);
    expect(factorize(60)).toEqual([2, 2, 3, 5]);
    expect(factorMultiset(12)).toEqual({ 2: 2, 3: 1 });
  });

  it("uses integer floor log2 around powers of 2", () => {
    expect(floorLog2(1)).toBe(0);
    expect(floorLog2(2)).toBe(1);
    expect(floorLog2(3)).toBe(1);
    expect(floorLog2(4)).toBe(2);
    expect(floorLog2(7)).toBe(2);
    expect(floorLog2(8)).toBe(3);
    expect(floorLog2(9)).toBe(3);
  });
});
