import type { PrimeMultiset } from "./types";

export type Factor = number;

export function factorize(value: number): Factor[] {
  const factors: Factor[] = [];
  let remaining = Math.max(1, Math.trunc(value));
  let divisor = 2;

  while (remaining > 1 && divisor * divisor <= remaining) {
    while (remaining % divisor === 0) {
      factors.push(divisor);
      remaining /= divisor;
    }
    divisor += divisor === 2 ? 1 : 2;
  }

  if (remaining > 1) factors.push(remaining);
  return factors;
}

export function factorMultiset(value: number): PrimeMultiset {
  return multisetFromFactors(factorize(value));
}

export function multisetFromFactors(factors: number[]): PrimeMultiset {
  return factors.reduce<PrimeMultiset>((multiset, factor) => {
    multiset[factor] = (multiset[factor] ?? 0) + 1;
    return multiset;
  }, {});
}

export function distinctPrimes(multiset: PrimeMultiset): number[] {
  return Object.entries(multiset)
    .filter(([, count]) => count > 0)
    .map(([prime]) => Number(prime))
    .sort((a, b) => a - b);
}

export function addPrime(multiset: PrimeMultiset, prime: number): PrimeMultiset {
  return { ...multiset, [prime]: (multiset[prime] ?? 0) + 1 };
}

export function removePrime(multiset: PrimeMultiset, prime: number): PrimeMultiset {
  const current = multiset[prime] ?? 0;
  if (current <= 0) return multiset;
  const next = { ...multiset };
  if (current === 1) {
    delete next[prime];
  } else {
    next[prime] = current - 1;
  }
  return next;
}

export function harmonyScore(multiset: PrimeMultiset): number {
  return Object.entries(multiset).reduce((total, [prime, count]) => total + Number(prime) * count, 0);
}

export function distinctPrimeCount(multiset: PrimeMultiset): number {
  return distinctPrimes(multiset).length;
}

export function formatFactorization(value: number): string {
  const factors = factorMultiset(value);
  const entries = distinctPrimes(factors);
  if (entries.length === 0) return "1";
  return entries.map((prime) => `${prime}${factors[prime] > 1 ? `^${factors[prime]}` : ""}`).join(" x ");
}

export function sharedPrimeValues(left: number, right: number): number[] {
  const leftFactors = new Set(factorize(left));
  const rightFactors = new Set(factorize(right));
  return [...leftFactors].filter((prime) => rightFactors.has(prime)).sort((a, b) => a - b);
}

export function countAssaultHarmonyDice(attackerPulse: number, defenderPulse: number): number {
  const defenderPrimes = new Set(factorize(defenderPulse));
  return factorize(attackerPulse).filter((prime) => defenderPrimes.has(prime)).length;
}

export function countShieldDissonanceDice(attackerPulse: number, defenderPulse: number): number {
  const attackerPrimes = new Set(factorize(attackerPulse));
  return factorize(defenderPulse).filter((prime) => !attackerPrimes.has(prime)).length;
}

export function floorLog2(value: number): number {
  if (value <= 1) return 0;
  let threshold = 0;
  let power = 1;
  while (power * 2 <= value) {
    power *= 2;
    threshold += 1;
  }
  return threshold;
}
