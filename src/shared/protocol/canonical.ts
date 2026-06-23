export type CanonicalValue = null | boolean | number | string | CanonicalValue[] | { [key: string]: CanonicalValue };

export function canonicalSerialize(value: CanonicalValue): string {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("Canonical protocol numbers must be safe integers.");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalSerialize).join(",")}]`;
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalSerialize(value[key])}`);
  return `{${entries.join(",")}}`;
}
