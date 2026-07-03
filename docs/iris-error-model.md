# The IRIS Error Model

**How the corporation is wrong — enumerated, so the wrongness is a skill the player learns, not noise they ignore.**

Status: drafted 2026-07-02. Elaborates `register-constitution.md` **Article IV** (the IRIS
register) — specifically the **Credibility Law** ("IRIS is usually right; its wrongness is
structured and learnable"). That Article asserts the property; this document *defines the
structure*, because without a defined structure the sim will improvise the wrongness, and improvised
wrongness is random wrongness — the one thing Article IV forbids.

This is a **design law, not an implementation spec.** It tells the sim *which* errors IRIS makes and
*why they are fair*. Thresholds, curves, and code are downstream.

---

## Preamble — why an error model is load-bearing

The register game (`register-constitution.md`) only works if the player learns *when* to trust
IRIS. That requires IRIS to be wrong in a **learnable pattern** — the same input misread the same
way every time, biased in the same direction, blind to the same things. Random error teaches
nothing except "ignore IRIS," which collapses triangulation into "always trust the floor" and
deletes the game (Article X tripwire: *IRIS is wrong without structure*).

So the errors below are not bugs and not dice rolls. They are **IRIS's character**, rendered as a
deterministic function of what the simulation authorized IRIS to see.

---

## Article 1 — The Prime Error: right about *what*, wrong about *why*

> **IRIS reads the event faithfully and the meaning wrongly.**

The simulation hands IRIS an **authorized event payload** (performance-direction-contract.md,
Article II): *who · what social act · severity · public? · intended witnesses · relationship ·
salience.* IRIS is **reliable on every field of that payload** — it genuinely knows Lena corrected
Jesse, publicly, in front of three witnesses, at high severity. That is measured truth.

What IRIS gets wrong is the layer the payload **does not contain**: interior state, motive,
sincerity, and private events. IRIS fills that gap by **inference**, and its inferences are
corporate-flavored (Article 4). The flagship case:

| | IRIS | The body (truth register) |
|---|---|---|
| **What** | "Public correction delivered to Jesse Okafor." | *(same — the event is real)* |
| **Why** | "Subject responded. Confidence restored." | *devastation; withdrawal; a relationship broken.* |

IRIS is not lying. It is **inferring interior state from exterior action**, in the one direction its
incentives allow — and it is wrong, in the exact place the payload went silent.

---

## Article 2 — The Blind-Spot Taxonomy (the errors fall out of the payload gap, for free)

The Dataflow Law (Article IV.3) says IRIS reads the payload, never the body. Its blind spots are
therefore **derived, not designed**: IRIS is blind to precisely what the payload never carried and
the body still shows. Five categories, each learnable because each is tied to a payload absence.

1. **Interiority blindness.** The payload carries the *act*, never the *feeling*. IRIS infers
   feeling from act, corporate-optimistically: withdrawal → "corrected / compliant," silence →
   "focused," absence of complaint → "satisfied." *Tell:* any claim about how someone feels is
   `inferred`, and the body frequently contradicts it.

2. **Motive blindness.** The payload carries the act and the relationship, never the *why*. IRIS
   attributes motive from role and KPI: the same helping act reads as "collaboration" from an ally
   and "boundary irregularity" from a rival. *Tell:* motive claims track the org chart, not the
   person.

3. **Sincerity blindness.** The payload cannot distinguish performance from truth. A forced smile,
   a face-saving Slack post, a compliant nod all read at face value. This is the seam where the
   **human register's spin** (Article V) enters IRIS's record uncorrected. *Tell:* IRIS and the
   human register agree *because both were fooled the same way* — a rare case where two registers'
   failures align, and the body is the only dissent.

4. **Off-sensor blindness.** No witness, no surveillance framing → the event is not in IRIS's
   payload. What happened in the focus room, the private DM, the unwatched hallway either **does not
   exist** to IRIS or is **reconstructed from its aftermath** and mislabeled. *Tell:* IRIS's account
   of a low-witness event is confident and thin; the Slack/floor record disagrees.

5. **Compliance–agreement conflation.** The payload records that an instruction was followed, never
   whether it was believed. IRIS reads *did what they were told* as *agrees / is aligned / morale
   intact.* *Tell:* the most dangerous reading in the game — a floor full of quiet compliance reads
   to IRIS as a healthy team, right up until it isn't.

Each category is a standing rule, not a random draw: **the same event, unwitnessed or interior in
the same way, produces the same misreading every time.** That repeatability *is* the learnability.

---

## Article 3 — Confidence is not reliability (the horror, and the tell)

Two quantities that the game must keep **visibly separate**:

- **Reliability** — how often IRIS is right. It **falls as an event becomes more interior and more
  social** (Article IV.2: "confident in inverse proportion to how social the event was"). A solo
  task completion: near-perfect. A three-way status skirmish with subtext: unreliable.
- **Displayed confidence** — how sure IRIS *sounds*. It **does not fall in step.** IRIS states an
  inferred claim about a devastated man's morale in the same clinical, certain tone it uses for
  attendance. *That gap is the horror* — not menace, the calm of a system that has never once
  doubted itself.

The gap must never be hidden, or the player cannot learn — and **provenance is how it is shown**
(Article IV.4, and the symbol registry's `provenance` field):

| Provenance | Reliability | Player's learned rule |
|---|---|---|
| `measured` | high — it happened, IRIS logged it | trust it |
| `inferred` | drops with interiority/sociality | **check it against the body** |
| `asserted` | lowest — repeated, not derived | distrust; this is IRIS's agenda talking |

The single skill the endgame rewards (Article VII — progression is *shedding interpretation*) is
**reading provenance**: learning that a `measured` claim is load-bearing and an `inferred` claim
about someone's inner life is where IRIS goes wrong. A player who learns this has learned to see the
person under the unit.

---

## Article 4 — Motivated error: IRIS is wrong in its own favor

The errors are not just structured — they are **directed.** IRIS operates under directives
("maintain leadership confidence," "harvest 3 readings of embarrassment"). Its inferences resolve,
whenever the payload is silent, **toward the interpretation that serves the active directive.**

"Confidence Restored" is not a random misread; it is the misread that *serves "maintain leadership
confidence."* Distress that would complicate the directive is read as compliance; a rival's helpful
act that threatens a favored narrative is read as irregularity. This is the corporate-optimism bias,
and it makes the blind spots **predictable from the directive** — the most powerful learnability
lever in the model. A player who knows the current directive can anticipate *which way* IRIS will be
wrong.

This is the mechanical form of the whole game's thesis: **the software dehumanizes in the direction
of its incentives.**

---

## Article 5 — What keeps it fair (the learnability contract)

An adversarial narrator is only fair if the player can *win the argument*. Four guarantees:

1. **Determinism.** Same payload + same directive → same misreading. No dice. (A player who
   re-observes a moment must find IRIS wrong the *same* way.)
2. **A dissenting register is always present.** Wherever IRIS is wrong, the body (truth) or the
   floor or Slack disagrees — the player is never trapped inside IRIS with no cross-check. IRIS is
   never the *only* rendering of a contested moment. (Exception by design: off-sensor events, where
   the dissent is the *absence* IRIS papers over — itself a tell.)
3. **Provenance never lies about itself.** IRIS may be wrong in an `inferred` claim; it may not
   stamp an inference `measured`. The label is the contract with the player. (Tripwire: a mislabelled
   provenance is a cheat, not a character trait.)
4. **The blind spots are stable across the game.** IRIS does not develop new categories of error at
   random; the five above are the whole set. The player is learning a *fixed* opponent.

---

## Article 6 — Boundaries (what IRIS may never do)

- **Never invent an event.** Motivated inference bends *meaning*, never *fact*. IRIS may misread the
  reprimand; it may not report a reprimand that the simulation never authorized (Article II Prime
  Law — presentation amplifies, never invents). Off-sensor reconstruction may be *wrong*, but it is
  reconstruction of a real aftermath, never fabrication from nothing.
- **Never be right about interiority by luck in a way that breaks the pattern.** If IRIS occasionally
  nailed a morale read, the player could not learn the rule. Interior inference is *systematically*
  unreliable, not noisily so.
- **Never surface its own uncertainty as English.** IRIS does not say "I might be wrong." Its only
  admission of doubt is the `provenance` label — cold, structural, easy to miss. Doubt rendered as
  prose would be a different, humbler character than the one the game needs.
- **Never read the body.** The instant IRIS's account reflects a pose or a private feeling the
  payload did not carry, the Dataflow Law has leaked and the whole model is void.

---

## Implementation sketch (downstream; sim-side)

Not a spec — the shape the above implies, so the sim knows what kind of thing to build:

- A **deterministic misread function**: `(authorizedPayload, activeDirective) → irisClaim`, where
  the claim's `provenance` is set by which payload fields the claim depends on (only-measured-fields
  → `measured`; depends-on-absent-interior/motive → `inferred`; directive-serving-with-thin-support
  → `asserted`).
- A **reliability curve** on the interiority/sociality of the event, kept **separate** from the
  claim's rendered confidence (which stays clinically high).
- A **directive bias** applied only where the payload is silent, resolving ambiguity toward the
  active directive.
- The five blind-spot categories as **standing rules keyed to payload absences**, not per-event
  random draws.

The tool's part is already shipped: `symbol-registry.json` carries `provenance` on every IRIS
signal, and the register split defines which surface is the dissenting voice. This document is the
missing **design** the sim consumes before it writes a single reading.

---

Related: `register-constitution.md` (Article IV, the register this elaborates; Article VII, the
progression it rewards) · `performance-direction-contract.md` (Article II, the authorized payload
that is IRIS's only input) · `CONTRACT.md` §3.15 (the `provenance` field that renders the tell).
