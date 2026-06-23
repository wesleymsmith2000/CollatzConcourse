import { describe, expect, it } from "vitest";
import { canonicalSerialize } from "../shared/protocol/canonical";
import { sha256ProtocolHasher } from "../shared/protocol/hash";

describe("shared canonical protocol utilities", () => {
  it("sorts object keys recursively and preserves array order", () => {
    expect(canonicalSerialize({ z: 1, a: { d: 4, b: 2 }, list: [3, 1] })).toBe(
      '{"a":{"b":2,"d":4},"list":[3,1],"z":1}'
    );
  });

  it("rejects floating point and unsafe protocol numbers", () => {
    expect(() => canonicalSerialize({ value: 1.5 })).toThrow("safe integers");
    expect(() => canonicalSerialize({ value: Number.MAX_SAFE_INTEGER + 1 })).toThrow("safe integers");
  });

  it("produces stable domain-separated SHA-256 hashes", async () => {
    const value = { action: "start", sequence: 1 };
    const first = await sha256ProtocolHasher.hashCanonical("CC_STATE_V1", value);
    const reordered = await sha256ProtocolHasher.hashCanonical("CC_STATE_V1", { sequence: 1, action: "start" });
    const otherDomain = await sha256ProtocolHasher.hashCanonical("PC_STATE_V1", value);
    expect(first).toHaveLength(64);
    expect(reordered).toBe(first);
    expect(otherDomain).not.toBe(first);
  });
});
