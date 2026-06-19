# Codex Handoff — Build a Collatz-Concourse MVP

## Project Goal

Build a playable digital MVP of **Collatz-Concourse**, a competitive mathematical race and combat game based on Collatz-style number movement, prime factorization, resource management, and player interaction.

Before creating new architecture, inspect the existing project workspace for any code previously developed for **Primordial Cipher**.

Reuse or adapt relevant Primordial Cipher code wherever practical, especially:

* prime-factorization utilities;
* prime-counting and multiplicity logic;
* resonance resource tracking;
* dice rolling;
* combat dice resolution;
* player-state models;
* turn-order and turn-state systems;
* reusable UI components;
* test utilities;
* save/load or state-serialization code;
* multiplayer or hot-seat scaffolding;
* mathematical display components;
* any existing shared game-engine modules.

Do not duplicate working Primordial Cipher functionality unnecessarily. Refactor reusable mathematical and game-state logic into shared modules when this can be done cleanly without destabilizing the existing project.

---

# MVP Scope

The first MVP should support:

* 2–4 players;
* local hot-seat play;
* separate player pulses;
* separate captured-prime pools;
* separate resonance pools;
* standard free-for-all play;
* complete turn resolution;
* normal attacks;
* exact-match Prime Theft attacks;
* victory detection;
* an event log;
* clear mathematical state displays;
* deterministic or seeded testing where practical.

Online multiplayer, AI opponents, advanced team formats, animation polish, accounts, and matchmaking are not required for the first pass.

However, the data model should not make future team modes unnecessarily difficult.

---

# Core Game Concepts

Each player has three principal resources:

1. **Pulse**

   * A positive integer.
   * The player’s current position in numerical factor-space.
   * Every player begins at 1.

2. **Captured Factor Pool**

   * A multiset of captured prime factors.
   * Duplicate primes are allowed.
   * These factors contribute to the player’s Harmony Score.
   * Captured factors may also be discarded to modify the pulse.

3. **Resonance**

   * A spendable numerical resource.
   * Used for forced jumps and attacks.
   * Each player tracks resonance separately.

---

# Victory Condition

A player wins when both conditions are true:

* their captured factor pool contains at least **10 distinct prime values**;
* their **Harmony Score** is at least **200**.

Harmony Score is the sum of all captured prime factors, including duplicates.

Example:

Captured factors:

2, 2, 3, 5, 5, 7

Harmony Score:

2 + 2 + 3 + 5 + 5 + 7 = 24

Distinct prime count:

4, represented by 2, 3, 5, and 7.

Victory should normally be checked during the end-of-turn phase after all required cleanup and resource adjustments.

---

# Pulse Display and Factorization

The UI should always show:

* current pulse value;
* full prime factorization;
* captured prime pool;
* Harmony Score;
* distinct-prime count;
* resonance;
* whose turn it is;
* which prime values have already been used to initiate attacks this turn.

Example pulse display:

Pulse: 12
Factorization: 2² × 3

Factorization code must correctly preserve multiplicity.

---

# Starting State

Each player begins with:

* Pulse: 1
* Resonance: 0
* Captured factors: none
* Harmony Score: 0
* Distinct primes: 0

The normal startup trajectory is intended to resemble:

1 → 4 → 2 → 1

Players should begin similarly, but resonance rolls and optional actions should gradually create divergence.

---

# Standard Pulse Step

Once per turn, the player performs a standard Collatz-style pulse step.

Use the following rule:

* if the pulse is even, divide it by 2;
* if the pulse is odd, multiply it by 3 and add 1.

Therefore:

* 1 becomes 4;
* 4 becomes 2;
* 2 becomes 1;
* 7 becomes 22.

After the standard pulse step resolves, the player captures one prime factor from the new pulse, provided the new pulse has at least one prime factor.

The value 1 has no prime factors and therefore grants no capture.

The standard pulse step should be mandatory once per turn.

For the first implementation, place it in a clearly defined turn sequence. Prefer a simple structure that is easy to test. If the existing Primordial Cipher engine already supports flexible action ordering, it is acceptable to model the standard step as a required action that must occur before the turn ends.

---

# Capturing Prime Factors

Whenever an action grants a capture:

1. factor the player’s current pulse;
2. present the prime values currently appearing in that factorization;
3. let the player choose one prime;
4. add one copy of that prime to the captured factor pool.

Example:

Pulse:

12 = 2² × 3

The player may capture:

* one 2; or
* one 3.

Capturing a prime factor does **not** divide it out of the pulse and does not otherwise alter the pulse.

Even when a factor appears multiple times, one capture grants only one copy.

---

# Resonance Gain

At the appropriate point each turn, the active player rolls 1d6 and gains that much resonance.

Use existing Primordial Cipher dice and resonance systems if available.

The exact turn-order placement should be implemented consistently and documented in code. A reasonable initial order is:

1. begin turn;
2. reset per-turn attack-prime usage;
3. roll 1d6 resonance;
4. resolve the mandatory standard pulse step;
5. capture one prime from the resulting pulse, when possible;
6. allow optional actions;
7. resolve end-of-turn limits;
8. check victory.

Keep turn-phase logic modular so playtesting adjustments are easy.

---

# Resonance Retention Limit

A player may retain resonance up to:

floor(log2(current pulse))

At the end of the turn, compare the player’s resonance to this retention threshold.

If resonance exceeds the threshold, apply the existing intended excess-resonance rule:

* excess stored resonance is halved;
* round down.

Because the handwritten prototype may be ambiguous about whether only the excess or the full stored amount is halved, isolate this behavior in one clearly named function and configuration constant.

For the initial MVP, implement this interpretation:

1. calculate the retention threshold;
2. resonance up to the threshold is retained normally;
3. any resonance above the threshold is treated as excess;
4. halve the excess, rounding down;
5. add the halved excess back to the retained threshold amount.

Formula:

retained resonance =
threshold + floor((current resonance − threshold) / 2)

when current resonance exceeds the threshold.

Add tests for this behavior.

For Pulse 1, the threshold is 0.

---

# Forced 3N+1 Jump

A player may pay resonance equal to their current pulse value to force an additional 3N+1 jump.

Cost:

current pulse value in resonance.

Effect:

N → 3N + 1

This action may be used regardless of whether the pulse is odd or even.

Examples:

* 2 → 7, costing 2 resonance;
* 4 → 13, costing 4 resonance;
* 10 → 31, costing 10 resonance.

After the forced jump resolves, the player captures one prime factor from the new pulse.

This action represents resonance directly fueling exploration.

A player may use forced jumps multiple times during a turn if they can pay each cost, unless later balance testing introduces a limit.

Prevent the action when the player lacks sufficient resonance.

---

# Prime-Fueled Pulse Modification

A player may discard one prime from their captured factor pool to modify their current pulse.

Procedure:

1. choose one captured prime factor;
2. discard one copy of it;
3. choose addition or subtraction;
4. update the pulse by that prime value;
5. factor the new pulse;
6. capture one prime factor from the resulting pulse.

Formulas:

N → N + p

or

N → N − p

where p is the discarded captured prime.

The discarded factor:

* is removed from the captured factor pool;
* no longer contributes to Harmony Score;
* may reduce the player’s distinct-prime count if it was their last copy.

Capturing after the modification is intentional. Spending a prime may open access to a new prime.

Example:

Starting pulse:

14

Discard a captured 2 and subtract:

14 − 2 = 12

The resulting path may expose:

12 → 6 → 3 → 10

This may be strategically preferable to adding:

14 + 2 = 16

which leads through powers of 2.

## Positive-Pulse Safety Rule

Do not allow subtraction if the result would be less than 1.

A pulse must always remain a positive integer.

Therefore:

* 3 − 2 = 1 is legal;
* 2 − 2 = 0 is illegal;
* 2 − 5 = −3 is illegal.

---

# Combat Eligibility

A player may attack an opponent when their pulses share at least one prime value.

Example:

Attacker:

60 = 2² × 3 × 5

Defender:

70 = 2 × 5 × 7

The shared prime values are:

2 and 5.

The attacker chooses one shared prime to initiate the attack and pays resonance equal to that prime.

Examples:

* attack using 2 costs 2 resonance;
* attack using 5 costs 5 resonance.

---

# One Attack Per Prime Value Per Turn

A given prime value may be used to initiate only one attack during a player’s turn.

A player could attack:

* once using 2;
* once using 3;
* once using 5;

but may not initiate two separate attacks using 2 during the same turn.

Track used attack-prime values as a per-turn set.

This restriction applies across all targets.

Example:

If a player attacks Opponent A using prime 2, they may not attack Opponent B using prime 2 later in the same turn.

Multiple attacks per turn are otherwise permitted when:

* the attacker can pay the resonance costs;
* the pulses still share eligible prime factors;
* the selected prime has not already been used to initiate an attack that turn;
* the turn has not ended due to Prime Theft.

---

# Combat Dice Pools

Combat uses two dice pools:

* Assault Harmony Dice;
* Shield Dissonance Dice.

Preserve repeated prime multiplicities.

## Assault Harmony Dice

Count every occurrence in the attacker’s pulse of a prime value that also appears at least once in the defender’s pulse.

Example:

Attacker:

2² × 3 × 5

Defender:

2 × 5 × 7

Matching attacker factor occurrences:

2, 2, 5

Assault Harmony Dice:

3

## Shield Dissonance Dice

Count every occurrence in the defender’s pulse of a prime value that does not appear in the attacker’s pulse.

Example:

Attacker:

2² × 3 × 5

Defender:

2 × 5 × 7²

Unmatched defender factor occurrences:

7, 7

Shield Dissonance Dice:

2

Implement this with factor-multiplicity maps, not flattened string parsing.

---

# Combat Die Resolution

For every die in either pool:

* 1 = failure;
* 4, 5, or 6 = success;
* 2 or 3 = reroll that die.

Continue rerolling unresolved dice until every die is either a success or failure.

Score each pool as:

successes − failures

The attacker’s result is the:

**Assault Melody Score**, or AMS.

The defender’s result is the:

**Defense Fugue Score**, or DFS.

Combat outcome:

* if AMS > DFS, attacker wins;
* if DFS > AMS, defender wins;
* if AMS = DFS, the result is a tie.

If there are zero dice in a pool, assign that pool a score of 0 unless later playtesting suggests a different rule.

Expose individual rolls in the combat log so players can understand the result.

---

# Standard Combat Damage

After a normal attack:

* the victor chooses one prime value shared by the two pulses;
* divide one copy of that prime out of the defeated player’s pulse.

Formula:

loser pulse → loser pulse / chosen shared prime

The chosen damage prime does not have to be the same prime used to pay the attack cost.

Example:

Attacker and defender share 2 and 5.

The attacker initiates the attack by paying 2 resonance.

If the attacker wins, they may choose to divide either 2 or 5 out of the defender’s pulse.

If the defender wins, the defender chooses which shared prime to divide out of the attacker’s pulse.

If the attack ties:

* no pulse is changed;
* no factor is divided out.

Combat damage never grants a prime capture.

After damage, immediately refactor and update the damaged pulse.

Because division changes pulse composition, repeated attacks naturally become harder as common factors disappear.

---

# Exact-Match Prime Theft

If the attacker’s pulse exactly equals the target player’s pulse, the attacker may declare a **Prime Theft** instead of a normal attack.

Exact equality means the numerical pulse values are identical.

Example:

Attacker Pulse: 30
Defender Pulse: 30

Prime Theft uses the normal combat dice procedure.

The attack must still be initiated using an eligible shared prime and must still pay the corresponding resonance cost.

The once-per-prime-per-turn restriction still applies.

## Prime Theft Outcome

If the attacker wins:

* the attacker chooses one captured prime from the defender;
* remove one copy from the defender’s captured pool;
* add one copy to the attacker’s captured pool.

If the defender wins:

* the defender chooses one captured prime from the attacker;
* remove one copy from the attacker’s captured pool;
* add one copy to the defender’s captured pool.

If the result is tied:

* no prime is stolen.

Prime Theft does not alter either pulse.

The stolen prime immediately changes:

* both players’ Harmony Scores;
* both players’ distinct-prime counts, if the transfer adds or removes a last or first copy.

Prime Theft should not be selectable when the possible losing side has no captured primes. Because either side may lose, the safest MVP rule is:

* Prime Theft may only be declared if both attacker and defender currently have at least one captured prime.

This prevents an unresolved reverse-theft state. Keep this restriction easy to revise after playtesting.

## Prime Theft Ends the Turn

After a Prime Theft is fully resolved, the attacker’s turn ends immediately.

This applies whether the attacker:

* wins;
* loses;
* ties.

After resolving the theft or tie:

* do not allow further forced jumps;
* do not allow pulse modification;
* do not allow additional attacks;
* do not allow any other optional action.

Proceed directly to required end-of-turn processing:

* resonance retention;
* state cleanup;
* victory check.

Prime Theft is intended as a high-risk commitment and should not be part of a longer combo turn.

---

# Recommended Turn State Machine

Implement turns through explicit phases rather than scattered boolean checks.

Suggested phases:

1. `TURN_START`
2. `RESONANCE_ROLL`
3. `STANDARD_PULSE_STEP`
4. `STANDARD_CAPTURE`
5. `OPTIONAL_ACTIONS`
6. `COMBAT_RESOLUTION`
7. `FORCED_TURN_END`, used after Prime Theft
8. `RESONANCE_RETENTION`
9. `VICTORY_CHECK`
10. `NEXT_PLAYER`

Optional actions should include:

* forced jump;
* prime-fueled pulse modification;
* normal attack;
* Prime Theft when eligible;
* end turn.

A Prime Theft should transition immediately to `FORCED_TURN_END`.

Keep the engine independent from the UI where practical.

---

# Event Log

Provide a readable event log containing entries such as:

* “Mira rolled 5 resonance.”
* “Mira’s pulse moved from 4 to 2.”
* “Mira captured a 2.”
* “Hu discarded a captured 2 and changed 14 to 12.”
* “Hu captured a 3.”
* “Keru paid 5 resonance to attack Azura using prime 5.”
* “Keru rolled 3 Assault Harmony Dice.”
* “Azura won the defense and divided a 2 out of Keru’s pulse.”
* “Azura declared Prime Theft against Hu.”
* “Hu won the exchange and stole a 13 from Azura.”
* “Prime Theft ended Azura’s turn.”
* “Keru reached 207 Harmony with 10 distinct primes and won.”

The log should be derived from engine events rather than manually assembled by the UI.

---

# UI Requirements

Build a functional, readable interface rather than a highly polished one.

Each player panel should display:

* player name;
* current pulse;
* formatted prime factorization;
* resonance;
* captured prime tokens or a sorted list with multiplicities;
* Harmony Score;
* distinct-prime count;
* victory progress;
* attack-prime values already used this turn;
* active-player indicator.

Optional action controls should become enabled or disabled based on legality.

Examples:

* disable forced jump when resonance is insufficient;
* disable subtraction choices that would reduce pulse below 1;
* disable attacks when no shared primes exist;
* disable a prime already used to initiate an attack this turn;
* show Prime Theft only when pulses match exactly and its other requirements are satisfied;
* disable all optional controls immediately after Prime Theft resolves.

When selecting a capture, show only prime values currently available in the pulse.

When selecting a discarded captured prime, show the available multiplicities.

When resolving combat damage, allow the victor to select from the currently shared prime values.

When resolving Prime Theft, allow the victor to select from the loser’s captured factors.

---

# Architecture Guidance

Prefer a structure such as:

* `shared/math/primeFactorization`
* `shared/math/collatz`
* `shared/dice`
* `shared/resonance`
* `games/primordialCipher`
* `games/collatzConcourse`
* `games/collatzConcourse/engine`
* `games/collatzConcourse/rules`
* `games/collatzConcourse/ui`
* `games/collatzConcourse/tests`

Adapt this to the existing project architecture rather than forcing these exact paths.

The authoritative game state should be serializable.

Suggested state shape:

```ts
type PrimeMultiset = Record<number, number>;

interface PlayerState {
  id: string;
  name: string;
  pulse: number;
  resonance: number;
  capturedPrimes: PrimeMultiset;
  usedAttackPrimesThisTurn: number[];
}

interface GameState {
  players: PlayerState[];
  activePlayerIndex: number;
  phase: TurnPhase;
  winnerId?: string;
  eventLog: GameEvent[];
}
```

Do not rely on floating-point logarithm comparisons without care. Add tests around powers of 2 for `floor(log2(n))`.

---

# Future Team-Mode Compatibility

Do not implement all team formats now, but avoid hard-coding ownership in a way that makes shared resources impossible later.

Future tournament formats may include:

1. shared pulse and captured primes, but separate resonance;
2. shared captured primes, but separate pulses and resonance;
3. shared captured primes and resonance, but separate pulses;
4. other combinations of shared or separate pulse, primes, and resonance.

A useful future-facing abstraction may separate:

* pulse ownership;
* resonance ownership;
* captured-factor ownership;
* victory-condition ownership.

Do not over-engineer this for the MVP, but document likely extension points.

---

# Testing Requirements

Add unit tests for at least the following:

## Prime Factorization

* 1 has no prime factors;
* 2 = 2;
* 4 = 2²;
* 12 = 2² × 3;
* 60 = 2² × 3 × 5;
* factor multiplicity is preserved.

## Standard Pulse Step

* 1 → 4;
* 4 → 2;
* 2 → 1;
* 7 → 22.

## Forced Jump

* 2 → 7;
* 4 → 13;
* forced jump cost equals the pre-jump pulse;
* action fails when resonance is insufficient;
* forced jump grants exactly one capture opportunity.

## Pulse Modification

* discarding 2 from Pulse 14 allows 12 or 16;
* discarded prime leaves the captured pool;
* Harmony Score updates;
* distinct count updates when the last copy is discarded;
* subtraction below 1 is rejected;
* legal modification grants exactly one capture opportunity.

## Captures

* capture does not alter pulse;
* capture adds one copy only;
* duplicate captures are allowed;
* no capture is possible from Pulse 1.

## Harmony and Victory

* Harmony includes duplicates;
* distinct count ignores duplicates;
* 200 Harmony without 10 distinct primes does not win;
* 10 distinct primes below 200 Harmony does not win;
* both conditions together produce victory.

## Attack Eligibility

* attack requires a shared prime;
* attack cost equals the chosen initiating prime;
* a prime value may initiate only one attack per turn;
* different prime values may each initiate an attack during the same turn.

## Combat Dice

* repeated attacker matching factors count individually;
* repeated unmatched defender factors count individually;
* 2 and 3 reroll until resolved;
* scores equal successes minus failures;
* tie causes no damage.

## Standard Damage

* victor chooses a shared prime;
* one copy is divided from loser’s pulse;
* combat damage grants no capture;
* pulse factorization updates afterward.

## Prime Theft

* available only when pulse values match exactly;
* winner steals one captured prime;
* reverse theft occurs when defender wins;
* tie steals nothing;
* pulses remain unchanged;
* Harmony and distinct counts update;
* Prime Theft ends the attacker’s turn in all outcomes;
* no later optional action may occur that turn.

## Resonance Retention

* thresholds at 1, 2, 4, 8, and nearby values;
* excess resonance is halved correctly;
* rounding is downward.

Use seeded randomness or dependency-injected dice rollers so combat tests are deterministic.

---

# Deliverables

Produce:

1. a playable local MVP;
2. a clean reusable game engine separated from rendering;
3. automated tests;
4. a concise README containing:

   * setup instructions;
   * how to run the game;
   * how to run tests;
   * core rules;
   * architecture notes;
   * which Primordial Cipher modules were reused or refactored;
   * unresolved assumptions;
5. a short playtest checklist;
6. comments or TODO markers for future team modes.

At the end, report:

* files created;
* files modified;
* Primordial Cipher code reused;
* Primordial Cipher code refactored into shared modules;
* tests added;
* assumptions made;
* known limitations;
* recommended next playtest questions.

---

# Important Implementation Principle

The central strategic loop is:

* normal pulse movement creates baseline exploration;
* resonance purchases extra exploration;
* captured primes provide victory progress;
* captured primes may be sacrificed to redirect the pulse;
* shared prime structures enable combat;
* exact pulse collisions enable high-risk Prime Theft;
* Prime Theft ends the turn to prevent greed-driven combo abuse.

Preserve that loop clearly in both the engine and interface.
