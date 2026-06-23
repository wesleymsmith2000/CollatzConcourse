import { canonicalSerialize, type CanonicalValue } from "./canonical";

export interface ProtocolHasher {
  hashCanonical(domain: string, value: CanonicalValue): Promise<string>;
}

export const sha256ProtocolHasher: ProtocolHasher = {
  async hashCanonical(domain, value) {
    const payload = new TextEncoder().encode(`${domain}\u0000${canonicalSerialize(value)}`);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", payload);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
};
