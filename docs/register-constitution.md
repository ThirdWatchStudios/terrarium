# The Register Constitution

**A constitutional document — who is allowed to speak, and how each voice is allowed to be wrong.**

Status: **ratified 2026-07-02** (all articles, including Article I's unregistered-speech rule and
Article VIII's temperature decision, confirmed as drafted). Peer to
`performance-direction-contract.md` — that document governs how the body *performs* truth; this
one governs the three languages that *narrate* it. Cross-repo: Terrarium authors the vocabulary
of each register; The Water Cooler selects and speaks at runtime.

This is **not** an implementation spec. Symbol atlases, overlay styles, and Slack content are
downstream of it. It exists for one political reason: six months from now someone will want to
*"just add one more IRIS marker"* or make a Slack message *"just show what really happened,"*
and there must be a law to point at.

---

## Preamble

> **The software dehumanizes. The simulation rehumanizes.**

The game does not render an office. It renders three competing accounts of one office:

```
                      SIMULATION — owns truth
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
  TRUTH REGISTER       HUMAN REGISTER       IRIS REGISTER
  what bodies leak     what people say      what the company claims
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                THE PLAYER — triangulates reality
```

Three narrators over one truth, rendered side by side, in disagreement at the moments that
matter. The player's job is triangulation. **That is the game.**

The registers are siblings, not a pipeline. Each reads the simulation directly; none reads
another. (In particular: IRIS reads the simulation's event stream, never the renderer's output —
see Article IV.)

---

## Article I — The Three Registers

| | Truth | Human | IRIS |
|---|---|---|---|
| **Speaker** | the simulation, through bodies | the people, on purpose | the corporation |
| **Voice** | involuntary — bodies leak | performed — self-report to an audience | confident, clinical, sincere |
| **Carriers** | poses, beats, staging, emotion glyphs, activity badges, floor bubbles | Slack messages, reactions/emoji | overlays, `state-*` chrome, readings, alerts, dossier claims |
| **How it fails** | **ambiguity** — a slump reads as fatigue or defeat | **spin** — people lie, minimize, save face | **systematic error** — misreads, misattributes, over-labels |
| **Temperature** | warm | warm | cold |

Every visual element in the game declares its register. **There is no unregistered speech.** An
element that cannot say who is speaking does not ship.

---

## Article II — The Prime Law

> **Each register must fail differently. No register may fail like another's.**

Triangulation only works because the failure modes do not overlap. If two registers can fail the
same way, cross-checking them proves nothing, and the game's core verb dies.

**The enforcement question**, for any element in any register:

> *If this element misleads the player, which register's failure mode is it exhibiting?*

If the answer is another register's mode — a body that lies, an IRIS reading that's merely vague,
a Slack post that's omniscient — the element is in the wrong register, or the register has been
corrupted. Fix the register assignment, not the player's confusion.

---

## Article III — The Truth Register (bound by the performance constitution)

The truth register is governed in full by `performance-direction-contract.md`. Restated here as
register law:

1. **It never lies. It is only ever ambiguous.** Bodies leak truth; they do not perform fiction.
2. **Least communication that lets a human read the truth.** It must survive HUD-off. Subtle
   truths are *allowed to be missed* — faithful observation over maximum comprehension.
3. **Icons never do the body's job.** A glyph in this register annotates what the body already
   shows; it never substitutes for staging the game didn't build.

---

## Article IV — The IRIS Register (licensed to over-communicate; obligated to be usually right)

1. **Over-communication is characterization, not failure.** Over-labeling, false precision, and
   clinical confidence are IRIS's *voice*. The performance constitution's upper bound
   (Article III, over-communication) does not bind IRIS — IRIS is a character, and an unreliable
   one. IRIS is also **sincere**: never sarcastic, never villainous, never winks.

2. **The Credibility Law: IRIS is usually right.** An adversarial narrator only works if it is
   credible. If IRIS is wrong often, or wrong *randomly*, the player learns to ignore it in the
   first hour and triangulation collapses into "always trust the floor." IRIS's wrongness must be
   **structured and learnable**: right about *what*, wrong about *why*; blind to specific
   categories (suppressed emotion reads as calm); confident in inverse proportion to how social
   the event was. *"Confidence Restored"* over a devastated man devastates **because** IRIS was
   right about the last forty readings.

3. **The Dataflow Law: IRIS reads events, never bodies.** IRIS's input is the simulation's
   authorized event payload (who · act · severity · publicness · witnesses — the Article II
   payload of the performance contract). It never reads renderer output. Consequences: the
   renderer stays swappable, and **IRIS's blind spots fall out of the existing contract for
   free** — IRIS is blind to exactly what the payload never carried and the body still shows.

4. **Every IRIS symbol carries provenance: `measured` / `inferred` / `asserted`.** This dimension
   is how the player learns *where* the blind spots are — which is the skill the endgame rewards
   (Article VII). Truth-register symbols do not have this dimension; they don't need one.

---

## Article V — The Human Register

1. **It reports beliefs, not truth.** A character may only say what that character knows,
   believes, or wants believed. A Slack post that reports objective truth no character could know
   is the human register speaking with the simulation's voice — a corrupted register.
2. **It may lie.** Spin, minimizing, face-saving, and performance for the channel's audience are
   this register's texture. Its lies are *deliberate* — character-motivated, never random.
3. **Terrarium authors only its glyph set** — the reaction/emoji vocabulary (the human register's
   equivalent of emotion glyphs). Everything else in this register is writing, and it is
   sim-side.

---

## Article VI — Registers are gameplay, not just theme

**The truth register serves understanding. The IRIS register denominates objectives.** Readings,
harvests, and KPIs are paid in IRIS's currency; seeing the person is paid in the floor's. The two
are *deliberately misaligned at moments of consequence* — serving the objective and seeing the
human come apart exactly when IRIS is wrong.

The registers disagreeing is not a bug to reconcile. **It is the question the game asks.** No
system may quietly re-align them for the player's comfort.

**And the corollary: IRIS must remain useful even when distrusted.** The mature player does not
ignore IRIS — they know when it is reliable, when it is blind, and when its goals are not theirs.
Any change that makes ignoring IRIS the winning strategy has broken this Article as surely as one
that makes trusting it blindly the winning strategy. Distrust is a skill; contempt is a design
failure.

---

## Article VII — Progression is epistemic

> **Clearance grants rawer channels, not better summaries.**

Early game: IRIS tells you what happened. Late game: **you tell IRIS what happened** — the
endgame verb is *dispute / correct / re-tag*, not a bigger dashboard. Not more power: more
epistemic authority.

Two consequences with teeth:

1. Higher clearance moves the player *down* the stack — from asserted claims toward measured
   channels — never toward smarter interpretation. The software does not get smarter; the player
   stops needing it to be.
2. **Data shapes must leave room for player assertion now.** Readings and dossier claims are
   addressable, disputable objects, even before the verb ships. Retrofitting this is expensive;
   reserving it is free.

---

## Article VIII — Temperature is register

The warm-floor / cold-chrome split and the register split are **the same split**:

- **Warm = truth + human.** Bodies, floor bubbles, Slack voice.
- **Cold = IRIS.** Chrome, overlays, readings.

Overlays are the cold layer *projected onto* the warm world; toggling them off must reveal
warmth. **Quiet is not cold:** the environment recedes so the people read — it does not adopt
IRIS's palette. Warmth creeping into chrome or cold creeping into the floor is a constitutional
change, not an art revision.

---

## Article IX — Vocabulary discipline

1. **The symbol vocabulary is deliberately small and stays small.** Admission of a new symbol
   requires, in writing: its register, its failure-mode statement (Article II), and which
   existing symbol covers it insufficiently and why.
2. **Simultaneous symbols per agent are budgeted.** The cap lives in the overlay style spec; the
   *existence* of a cap lives here.
3. **Stillness encodes state; motion encodes events.** (Inherited from the overlay grammar,
   restated as law.) Escalation is a state — it gets weight, saturation, radius. Pulsing is
   reserved for the moment something *changes*.

---

## Article X — Tripwires

Concrete sins. If you are doing one of these, stop — you are across a boundary.

- **An icon explains something a body could show.** Truth-register work dumped on IRIS's
  carrier. Fix the body. (Performance contract, Article VIII — same sin, same law.)
- **An IRIS marker is added "so players don't miss it."** IRIS speaks for the corporation's
  reasons, never the designer's. If the *designer* needs the player to see it, that is a truth-
  register (staging) problem.
- **IRIS is wrong without structure.** Random error is noise, not character. Two unstructured
  misses in a row and the player rationally stops reading the register.
- **An IRIS symbol names something the authorized payload doesn't carry.** IRIS is reading the
  renderer. Dataflow violation (Article IV.3).
- **A Slack post knows something no character knows.** The human register has been possessed by
  the simulation.
- **A state is pulsing.** Motion is for events (Article IX.3).
- **A symbol ships without a register.** Unregistered speech (Article I).
- **The UI tells the player which register is right.** Triangulation done for them —
  interpretation dies, and with it the game.

---

## Coda — the destination

The player's progression is not gaining more information. It is **shedding interpretation**.

> You don't become a better operator because the software gets smarter.
> You become a better operator because you stop trusting the software as your only lens.

Early game: IRIS tells you what happened.
Late game: you tell IRIS what happened.

The software dehumanizes. The simulation rehumanizes. Everything in between is the player,
learning to see people.

---

Related: `performance-direction-contract.md` (how the body performs truth) ·
`shapes-overlay-reader-spec.md` (how the cold layer is drawn) · `CONTRACT.md` (the tool↔sim data
boundary) · `icon-expansion-plan.md` (symbol id registries) · sim-side: the QuotaOS workstation
frame and commandments (this document's preamble is the candidate next commandment).
