# Collatz-Concourse — Codex Handoff
## Deterministic Competitive CCG Architecture, Consensus Matches, and Zero-Knowledge Validation

**Project:** A Veil of Void and Fire
**Game:** Collatz-Concourse
**Purpose:** Extend the existing Collatz-Concourse prototype into a deterministic, replayable, community-federated competitive card game architecture with account-owned cards, deck construction, hidden information, automatic Snares, zero-knowledge proofs, and consensus-driven match validation.

---

# 1. High-Level Goal

Collatz-Concourse is a mathematical racing and combat game based on:

- Collatz-style pulse movement;
- prime-factor exploration;
- resonance management;
- prime collection;
- deterministic combat;
- action, event, and device cards;
- hidden automatic Snares;
- account-owned card collections;
- player-built decks;
- asynchronous or “play-by-mail” competitive play;
- deterministic reconstruction and validation of every match.

The long-term goal is a **community-driven competitive ecosystem**.

There may be one official or “canon” account and content server, but the system should also support:

- community-run servers;
- development servers;
- specialized tournament servers;
- alternate rulesets;
- experimental card sets;
- independent validator networks;
- community-recognized rankings and match archives.

The canon server defines one trusted lineage, not the only possible world.

---

# 2. Reuse Existing Primordial Cipher Code

Before implementing new systems, inspect the repository for reusable code from **Primordial Cipher**.

Reuse or refactor relevant code for:

- prime factorization;
- factor multiplicity maps;
- prime counting;
- resonance calculations;
- deterministic dice resolution;
- event logs;
- turn-state machines;
- combat resolution;
- player state;
- serialization;
- checksum generation;
- UI widgets;
- hot-seat or multiplayer scaffolding;
- tests;
- seeded randomness;
- save/load systems.

Do not duplicate reliable mathematical or engine code unnecessarily.

Where practical, refactor shared logic into neutral modules such as:

```text
shared/math/
shared/random/
shared/serialization/
shared/crypto/
shared/game-state/
shared/event-log/
```

Avoid destabilizing Primordial Cipher while extracting reusable systems.

---

# 3. Core Rules Snapshot

## 3.1 Player State

Each player tracks:

- Pulse value;
- Pulse prime factorization;
- Captured prime multiset;
- Harmony Score;
- Distinct prime count;
- Resonance;
- Hand;
- Deck;
- Discard pile;
- Equipment slots;
- Installed Devices;
- Installed hidden Snares;
- Per-turn used attack primes.

## 3.2 Starting State

Each player begins with:

- Pulse = 1;
- Resonance = 0;
- No captured primes;
- Empty equipment area;
- Opening hand according to the current deck rules.

## 3.3 Victory

A player wins when both are true:

- Harmony Score is at least 200;
- The captured prime pool contains at least 10 distinct prime values.

Harmony Score is the sum of all captured prime factors, including duplicates.

## 3.4 Standard Pulse Step

Once per turn:

- Even Pulse: `N -> N / 2`
- Odd Pulse: `N -> 3N + 1`

The standard startup sequence is:

```text
1 -> 4 -> 2 -> 1
```

After a standard pulse step, the player captures one prime factor from the new pulse if the pulse has a prime factor.

Pulse 1 grants no capture.

## 3.5 Capturing Primes

When an action grants a capture:

1. Factor the current pulse.
2. Choose one prime value appearing in the factorization.
3. Add one copy to the captured prime pool.

Example:

```text
12 = 2^2 x 3
```

The player may capture one 2 or one 3.

Capturing does not alter the pulse.

## 3.6 Resonance Cost for Using Captured Primes

The resonance cost associated with using a captured prime is based on the binary logarithm of the prime value, using the game’s standard rounding rule.

```text
prime_use_cost(p) = round(log2(p))
```

Use one explicitly documented rounding rule and test all boundary values.

## 3.7 Resonance Retention

Resonance retention is based on the binary logarithm of captured prime count, using standard rounding.

```text
retention_limit = round(log2(total_captured_prime_count))
```

At the end of each turn:

- resonance up to the retention limit is retained;
- excess resonance decays by 50%;
- apply the game’s standard rounding rule.

Isolate the precise decay formula in a single tested function so it can be tuned.

## 3.8 Forced 3N+1 Jump

A player may pay resonance equal to the current pulse value to apply:

```text
N -> 3N + 1
```

This is legal whether the pulse is odd or even.

The forced jump grants one additional capture.

## 3.9 Prime-Fueled Pulse Modification

A player may discard one captured prime and pay the prime-use resonance cost.

Then choose:

```text
N -> N + p
```

or:

```text
N -> N - p
```

The discarded prime is removed from the captured pool and no longer contributes to Harmony or distinct-prime totals.

The resulting pulse must remain at least 1.

The modification grants one additional capture.

## 3.10 Normal Combat

To attack:

1. Choose a target.
2. Choose one prime value shared by both pulses.
3. Pay the attack cost.
4. Mark that prime value as used for the turn.
5. Resolve combat.

A given prime value may initiate only one attack per turn.

Multiple attacks are otherwise allowed.

### Assault Harmony Dice

Count all occurrences in the attacker’s pulse of prime values that also occur in the defender’s pulse.

### Shield Dissonance Dice

Count all occurrences in the defender’s pulse of prime values that do not occur in the attacker’s pulse.

### Die Resolution

- 1 = failure
- 2 or 3 = reroll
- 4, 5, or 6 = success

Continue until every die resolves.

```text
Score = successes - failures
```

### Attack Outcome

The attack prime is chosen before rolling.

- If attacker wins, divide the attack prime out of the defender’s pulse.
- If defender wins, divide the attack prime out of the attacker’s pulse.
- If tied, divide neither pulse.

Combat damage grants no capture.

## 3.11 Prime Theft

If two pulses match exactly, the attacker may declare Prime Theft instead of normal combat.

Prime Theft uses normal attack declaration and combat resolution.

- If attacker wins, attacker steals one captured prime from defender.
- If defender wins, defender steals one captured prime from attacker.
- If tied, no prime is stolen.
- Neither pulse changes.
- Prime Theft always ends the attacker’s turn immediately.

All theft selection rules must be deterministic or fully committed before resolution. No inactive player may be prompted for a choice.

---

# 4. Card System

## 4.1 Card Types

### Actions

- Played during the active player’s turn.
- Resolve immediately.
- Usually discarded afterward.

### Visible Events

- Played face up during the active player’s turn.
- Resolve immediately or establish an automatic temporary condition.

### Devices

- Installed in equipment slots.
- May be permanent, temporary, consumable, exhausted, damaged, or upkeep-based.
- May never require off-turn input.

### Snares

- Hidden Events installed face down in equipment slots.
- Paid for entirely at installation.
- Trigger automatically.
- Require no off-turn player decisions.

## 4.2 Hand Size

Recommended base maximum hand size:

```text
5
```

Cards and RAM-style Devices may increase this to 7 or 9.

Draw one card at the start of the turn when legal.

At end of turn, discard down to the current hand limit if required.

## 4.3 Equipment Slots

Equipment-slot count may vary by race length.

Suggested starting values:

- Sprint: 2 slots
- Standard: 3 slots
- Grand Concourse: 4 slots
- Endurance: 5 slots

Snares occupy equipment slots just like Devices.

---

# 5. Snare Rules

## 5.1 Installation

During the owner’s turn:

1. Choose a Snare card from hand.
2. Pay the printed resonance cost.
3. Pay an additional 2 resonance to install it face down.
4. Choose an available equipment slot.
5. Commit all hidden information.
6. Remove the card from hand.
7. Place a hidden Snare commitment in the selected slot.

Total installation cost:

```text
printed_cost + 2 concealment_cost
```

The full cost is paid upfront.

## 5.2 Triggering

A Snare is always automatic.

When its exact trigger occurs:

1. Detect the trigger deterministically.
2. Reveal or prove the Snare.
3. Resolve its effect automatically.
4. Discard it unless the card explicitly remains installed.
5. Resume the interrupted action.

The owner is never asked whether to activate it.

## 5.3 No Off-Turn Decisions

This is a core design principle:

> No player should need to choose, respond, spend, activate, select, or submit anything outside their own turn.

Whenever an automatic effect needs a target, use one of:

- a choice committed during installation;
- highest value;
- lowest value;
- oldest object;
- newest object;
- earliest roll index;
- turn-order priority;
- deterministic seeded random selection.

---

# 6. Deterministic and Event-Sourced Match Engine

The match engine must be deterministic and UI-independent.

## 6.1 Command Model

```ts
interface GameCommand {
  protocolVersion: string;
  matchId: string;
  turnNumber: number;
  actionSequenceNumber: number;
  actorId: string;
  actionType: string;
  publicParameters: unknown;
  hiddenProofs?: unknown;
  previousStateHash: string;
  signature: string;
}
```

## 6.2 Event Model

```ts
interface GameEvent {
  eventIndex: number;
  matchId: string;
  type: string;
  payload: unknown;
  previousEventHash: string;
  resultingStateHash: string;
}
```

## 6.3 Canonical State Transition

```text
new_state = validate_and_apply(previous_state, submitted_command, deterministic_random_input)
```

Then:

```text
resulting_state_hash = H(canonical_serialize(new_state))
```

## 6.4 Canonical Serialization

Specify one canonical serialization format.

Do not hash arbitrary runtime JSON objects.

Requirements:

- deterministic key order;
- deterministic integer encoding;
- explicit UTF-8 rules;
- no floating-point ambiguity;
- stable array ordering;
- explicit null handling;
- protocol version included;
- domain-separated hashes.

---

# 7. Consensus Match Validation

Actual matches should be able to run without one authoritative game server.

Use a permissioned or federated Byzantine-fault-tolerant validator network.

Validators independently:

1. Load the same prior state.
2. Verify the command signature.
3. Verify turn ownership.
4. Verify action order.
5. Verify costs and resource transitions.
6. Verify equipment-slot legality.
7. Verify card and zone proofs.
8. Apply automatic Snare triggers.
9. Resolve deterministic randomness.
10. Compute the new state.
11. Agree on command order and resulting state hash.

The game engine must remain independent from the consensus implementation.

---

# 8. Account-Owned Cards and Federated Servers

## 8.1 Account Servers

A competitive match begins by communicating with an accepted account server.

The account server provides:

- identity credential;
- collection commitment;
- ownership attestations;
- deck eligibility credential;
- issuer information;
- account status;
- card-instance data.

The account server does not need to remain online during the entire match.

## 8.2 Server Types

### Canon Server

Publishes official card definitions, lore, art, rulesets, ban lists, account collections, credentials, and tournament policies.

### Community Servers

May run alternate formats, custom cards, independent collections, modified balance, specialized tournaments, validator sets, and rankings.

### Development Servers

May permit experimental rules, prototype cards, unreleased mechanics, balance testing, debugging tools, and test accounts.

## 8.3 Namespaced Assets

Every card and issuer must be namespaced.

Suggested identity:

```text
issuer_id
collection_namespace
card_instance_id
card_definition_id
definition_version
owner_commitment
```

Example URIs:

```text
cc://canon/cards/phase-screen/v3
cc://aurora-league/cards/phase-screen-prismatic/v1
```

---

# 9. Collection, Deck, and Match Commitments

## 9.1 Account Collection Root

```text
collection_root = MerkleRoot(canonical_sort(all_owned_card_instances))
```

## 9.2 Deck-Build Commitment

```text
deck_build_commitment = H(
  "CC_DECK_BUILD_V1"
  || protocol_version
  || ruleset_id
  || card_database_version
  || account_id
  || deck_id
  || canonical_deck_manifest
  || deck_nonce
)
```

The deck proof must verify ownership, deck size, legal definitions, accepted issuers, copy limits, bans, and no duplicate instance IDs.

## 9.3 Match Deck Commitment

```text
match_deck_commitment = H(
  "CC_MATCH_DECK_V1"
  || match_id
  || player_id
  || seat_id
  || deck_build_commitment
  || collection_root
  || ruleset_id
  || card_database_version
  || match_nonce
)
```

---

# 10. Deterministic Shuffle and Public Seed

The system needs:

- a deck-build checksum;
- a shuffle-order checksum;
- deterministic random generation;
- a public seed;
- zero-knowledge privacy.

A purely public seed and public decklist would reveal future draws, so zero-knowledge proofs must preserve hidden order.

## 10.1 Shuffle Seed

```text
shuffle_seed = H(
  "CC_SHUFFLE_SEED_V1"
  || public_match_seed
  || private_player_entropy
  || match_id
  || player_id
  || seat_id
  || match_deck_commitment
  || shuffle_algorithm_version
)
```

The private entropy is committed before the public seed is finalized.

## 10.2 Deterministic Shuffle

Recommended:

- ChaCha20-based deterministic byte stream;
- Fisher-Yates shuffle;
- iterate from `n - 1` down to `1`;
- rejection sampling for index selection;
- no raw modulo bias;
- explicit endian rules;
- fixed protocol version.

## 10.3 Shuffle Root

```text
shuffle_root = MerkleRoot([
  H("CC_SHUFFLE_LEAF_V1"
    || match_id
    || player_id
    || deck_position
    || card_instance_id
    || card_definition_id
    || leaf_nonce)
])
```

Validators should be able to prove the shuffle was correct without learning the order.

---

# 11. Zero-Knowledge Proof Requirements

Use zero-knowledge proofs for private card and deck validation.

## 11.1 Deck Legality Proof

Prove:

- all cards are owned;
- all cards are legal;
- deck rules are satisfied;
- no forbidden duplicate instances exist;
- issuer policy is satisfied.

## 11.2 Shuffle Correctness Proof

Prove:

1. The private deck matches the committed legal deck.
2. The seed is derived correctly.
3. The approved deterministic shuffle was applied exactly.
4. The resulting order matches the public shuffle root.

## 11.3 Draw Proof

Prove:

- the drawn card came from the next deck position;
- the draw index advanced exactly once;
- the card moved into hand;
- no other hidden card changed.

## 11.4 Visible Card Play Proof

Prove:

- the revealed card was in hand;
- it was removed from hand;
- its identity and definition are authentic;
- its cost and effect match the locked card database;
- it moved to the proper zone.

## 11.5 Hidden Snare Installation Proof

Public inputs:

```text
match_id
turn_number
action_sequence_number
player_id
previous_state_hash
resulting_state_hash
hand_root_before
hand_root_after
equipment_slot_id
slot_state_before
resonance_before
printed_cost_paid
concealment_cost_paid
total_resonance_paid
resonance_after
hidden_snare_commitment
ruleset_hash
card_database_root
```

Prove:

- the hidden card was in hand;
- it was removed from hand;
- it has the Snare property;
- it is legal under the ruleset;
- its printed cost is correct;
- concealment cost equals 2;
- total payment is correct;
- the player had sufficient resonance;
- the equipment slot was valid;
- action order is valid;
- hidden choices were legal;
- the hidden commitment binds all private data.

## 11.6 Automatic Snare Trigger Proof

When a possible trigger occurs, prove one of:

- this Snare triggers and must reveal;
- this Snare does not trigger and remains hidden.

The long-term ideal is a zero-knowledge trigger-membership proof so non-triggering Snares remain hidden.

Because player inactivity must not stall the match, support encrypted reveal escrow or threshold decryption.

---

# 12. Snare Commitment Payload

```text
hidden_snare_commitment = H(
  "CC_SNARE_INSTALL_V1"
  || protocol_version
  || match_id
  || turn_number
  || action_sequence_number
  || previous_state_hash
  || owner_id
  || card_instance_id
  || card_definition_id
  || original_deck_position
  || equipment_slot_id
  || slot_order
  || printed_resonance_cost
  || concealment_cost
  || total_resonance_paid
  || resonance_before
  || resonance_after
  || hidden_choices
  || card_nonce
  || snare_nonce
)
```

Required public action record:

```ts
interface InstallHiddenSnareAction {
  matchId: string;
  turnNumber: number;
  actionSequenceNumber: number;
  playerId: string;

  previousStateHash: string;
  resultingStateHash: string;

  handRootBefore: string;
  handRootAfter: string;

  equipmentSlotId: string;
  slotOrder: number;
  slotStateBefore: string;

  resonanceBefore: number;
  printedCostPaid: number;
  concealmentCostPaid: 2;
  totalResonancePaid: number;
  resonanceAfter: number;

  hiddenSnareCommitment: string;
  zeroKnowledgeProof: string;
}
```

The hash proves commitment. The state transition and proof establish legality.

---

# 13. Zone Commitments

Suggested zones:

```text
OWNED_COLLECTION
REGISTERED_DECK
DRAW_PILE
HAND
VISIBLE_EQUIPMENT
HIDDEN_SNARE
DISCARD
EXILE
SIDEBOARD
```

Every card transfer must consume one prior-zone commitment and create one new-zone commitment.

A card instance must never exist in two zones simultaneously.

Audit chain:

```text
Collection Root
  -> Deck Commitment
  -> Match Deck Commitment
  -> Shuffle Root
  -> Draw Proof
  -> Hand Root
  -> Card Play or Snare Install
  -> Equipment/Discard Commitment
  -> Reveal and Resolution
```

---

# 14. Randomness

All randomness must be:

- deterministic after seed agreement;
- domain separated;
- replayable;
- unbiased;
- resistant to manipulation;
- injectable into the engine.

Do not call platform randomness directly inside rules code.

```text
random_word = H(
  "CC_RANDOM_V1"
  || match_seed
  || match_id
  || turn_number
  || action_sequence_number
  || random_domain
  || random_index
)
```

Use separate domains for resonance rolls, combat dice, shuffle, random card effects, and automatic target selection.

---

# 15. Federation and Ruleset Manifests

Every competitive match must lock a manifest.

```ts
interface MatchRulesManifest {
  protocolVersion: string;
  engineVersion: string;
  rulesetId: string;
  rulesetHash: string;
  cardDatabaseRoot: string;
  bannedListHash: string;
  acceptedIssuerRoot: string;
  shuffleAlgorithmVersion: string;
  prngVersion: string;
  hashAlgorithm: string;
  serializationVersion: string;
  proofSystemVersion: string;
  verificationKeyHash: string;
  tournamentFormatId: string;
  equipmentSlotCount: number;
  handLimit: number;
  victoryHarmony: number;
  victoryDistinctPrimes: number;
  validatorSetId: string;
}
```

---

# 16. Result Certification

```ts
interface MatchResultCertificate {
  matchId: string;
  rulesetHash: string;
  participantCredentialCommitments: string[];
  deckCommitments: string[];
  shuffleRoots: string[];
  finalStateHash: string;
  winnerId: string;
  eventLogRoot: string;
  validatorSetId: string;
  consensusCertificate: string;
}
```

Each receiving server decides whether to recognize the result.

---

# 17. Privacy and Anti-Stall Requirements

Plan for:

- threshold-encrypted reveal escrow;
- match-scoped credentials;
- short-lived account credentials;
- nullifiers for restricted card usage;
- replay-protected signatures;
- proof timeouts;
- deterministic forfeiture rules;
- validator quorum recovery;
- end-of-match audit packages.

A hidden Snare must not become unresolvable because its owner disconnects.

---

# 18. Technology Investigation

Evaluate current, actively maintained proof systems and circuit toolchains before implementation.

Possible candidates:

- Noir / Barretenberg;
- Halo2;
- Circom / snarkjs;
- Plonky2 or related systems;
- STARK-based alternatives.

Selection criteria:

- TypeScript or Rust integration;
- browser and server proving support;
- proof size;
- proving time;
- recursive proof support;
- circuit maintainability;
- trusted setup requirements;
- verification cost;
- licensing;
- ecosystem stability.

Do not lock the architecture to one proof system prematurely. Define proof interfaces behind adapters.

---

# 19. Suggested Code Architecture

```text
shared/
  math/
    primeFactorization
    binaryLogRounding
  random/
    deterministicPrng
    shuffle
    dice
  crypto/
    hashing
    canonicalSerialization
    merkle
    signatures
    commitments
    zkInterfaces
  game-state/
    events
    commands
    reducers
    replay
  federation/
    issuers
    credentials
    manifests

games/
  primordialCipher/
  collatzConcourse/
    rules/
    engine/
    cards/
    combat/
    snares/
    devices/
    zones/
    deck/
    account/
    consensus/
    proofs/
    ui/
    tests/
```

Core engine rules must not import UI or networking code.

---

# 20. Implementation Phases

## Phase 1 — Deterministic Core

Implement canonical state, action sequence numbers, deterministic reducer, event log, state hashes, seeded PRNG, replay, card zones, automatic Snares, and no off-turn decisions.

## Phase 2 — Card Ownership and Deck Registration

Implement unique card instances, issuer namespaces, collection roots, deck manifests, credentials, deck legality, and issuer policies.

## Phase 3 — Hidden Zone Commitments

Implement committed draw pile, hand root, equipment commitments, hidden Snare commitments, and ordinary Merkle proofs first.

## Phase 4 — Zero-Knowledge Deck Legality

Implement ownership, legality, copy-limit, issuer, and duplicate-instance proofs.

## Phase 5 — Zero-Knowledge Shuffle and Draws

Implement deterministic private shuffle, shuffle proof, private draw transition proof, and hand transition proof.

## Phase 6 — Zero-Knowledge Snares

Implement Snare installation proof, correct-cost proof, slot-legality proof, trigger/non-trigger proof, and threshold-encrypted reveal.

## Phase 7 — Consensus Match Network

Implement validator application, command ordering, BFT integration, state-hash agreement, result certification, and replay verification.

## Phase 8 — Federation

Implement canon server, community manifests, dev server support, issuer trust policies, cross-server credentials, and independent tournament validation.

---

# 21. Testing Requirements

Add tests for:

- deterministic state transitions;
- replay fidelity;
- canonical serialization stability;
- stale and duplicate action rejection;
- active-turn enforcement;
- Snare slot legality;
- exact resonance payment;
- concealment cost of 2;
- card removal from hand;
- automatic Snare triggering;
- no off-turn prompts;
- disconnect-safe Snare resolution;
- ownership proof;
- banned-card rejection;
- duplicate-instance rejection;
- issuer policy;
- deterministic shuffle;
- altered-order proof rejection;
- next-position-only draws;
- hand-root transitions;
- card non-duplication;
- validator state-hash agreement;
- result certificate verification;
- canon-only and mixed-issuer tournament policies.

---

# 22. Deliverables Requested from Codex

Produce:

1. Repository assessment.
2. Reusable Primordial Cipher module inventory.
3. Proposed architecture before major refactoring.
4. Deterministic Collatz-Concourse state model.
5. Canonical command and event schemas.
6. Canonical serialization and hashing utilities.
7. Card-zone and equipment-slot systems.
8. Automatic Snare installation and resolution.
9. Account, collection, and deck commitment models.
10. Proof-system interfaces with mocked implementations initially.
11. Deterministic shuffle specification.
12. Validator-facing match-state API.
13. Tests.
14. README covering setup, architecture, assumptions, replay, commitments, ZK roadmap, federation, and security assumptions.
15. Migration plan from the current prototype.
16. List of unresolved cryptographic and gameplay assumptions.

At the end, report:

- files created;
- files modified;
- Primordial Cipher code reused;
- shared code extracted;
- tests added;
- assumptions made;
- security limitations;
- recommended next steps.

---

# 23. Important Design Principles

1. No off-turn player interaction.
2. Every action must be independently replayable.
3. Commitment is not the same as legality; legality comes from deterministic validation.
4. Hidden information must remain private while still being provably valid.
5. Every card instance has one owner and one committed zone at a time.
6. Public seeds must not expose private draw order.
7. Rulesets, card databases, PRNGs, proofs, and serialization must be version locked.
8. Consensus validates matches; account servers attest ownership and eligibility.
9. Canon and community servers coexist through issuer namespaces and trust policies.
10. The game engine remains standalone and deterministic regardless of networking or proof backend.

---

# 24. Immediate First Task for Codex

Start by auditing the existing repository.

Do not immediately implement blockchain or zero-knowledge circuits.

First:

1. Locate the current Collatz-Concourse prototype.
2. Locate Primordial Cipher code.
3. Identify reusable modules.
4. Document the present state model and turn loop.
5. Propose a deterministic event-sourced architecture.
6. Identify all existing nondeterministic calls.
7. Identify all UI-coupled rules logic.
8. Propose the first refactor.
9. Add deterministic state hashing and replay tests.
10. Only then begin card-zone, commitment, and proof-interface work.

The first milestone should be:

> A deterministic, event-sourced Collatz-Concourse engine that can replay a complete match from signed commands and reproduce the same final checksum on every supported platform.
