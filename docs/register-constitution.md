# The Register Constitution

**A constitutional document — who is allowed to speak, and how each voice is allowed to be wrong.**

Status: **ratified 2026-07-02**; **Article VIII amended same day** (renderings law — "every
register redraws the person; none may rewrite their behavior" — supersedes the original
temperature-is-register formulation; warmth is proximity, not truth). Peer to
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

(Temperature was originally a register property; the 2026-07-02 amendment moved it to
**renderings** — see Article VIII. Warmth is proximity, not truth.)

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

## Article VIII — Renderings (amended 2026-07-02; supersedes "Temperature is register")

> **Every register redraws the person. None may rewrite their behavior.**

There is no canonical image of an employee. There are only **renderings**, each with an author:

| Rendering | Surface | Author | Character |
|---|---|---|---|
| **Operational unit** | the floor | IRIS | cold, near-anonymous, institutional — and it *moves like a person* |
| **Corporate identity** | badge photo — inspector, dossier, directory | the corporation | warm, curated, official; the forced smile |
| **Human presence** | Slack avatar, profile | the person | warm, self-authored — the dog photo, the selfie, the default grey silhouette. The *choice* is characterization. |
| **Reality** | — | no one | **never rendered.** The player never gets omniscience; only representations. |

**Warmth is proximity, not truth.** A badge photo is warm and curated; the floor is cold and
often the most honest surface in the game. Truth and warmth are orthogonal:

| | Warm | Cold |
|---|---|---|
| **Truthful** | body language (conduct) | floor movement |
| **Misleading** | Slack spin | IRIS interpretation |

Laws:

1. **The simulation is the sole owner of behavior.** A rendering styles the person; conduct —
   pose, beat, approach, hesitation, exit — passes through every rendering **undistorted**
   (performance contract, Article II). IRIS may draw you as a unit; it cannot make you move
   like one.
2. **Renderings are never visually unified.** No surface shows another surface's drawing — no
   face on the floor, no floor-unit thumbnail in Slack. The player reconciles the renderings
   into one human being, and that act of reconciliation is the game's central perception; any
   feature that performs it for the player has stolen it. (Id-level linkage — selection,
   cross-highlighting — is mechanics, and stays.)
3. **Quiet is not cold** (retained): the environment recedes so the people read — clinical
   architecture, not IRIS's claim palette on the walls.
4. **A rendering's temperature belongs to its author.** A slick cinematic floor or a cold
   institutional Slack is a constitutional change, not an art revision.

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
- **A surface shows another rendering's drawing.** The badge photo on the floor, the unit in
  Slack — the reconciliation moment stolen (Article VIII.2).
- **Reality is rendered.** Any "true view" of an employee ships — omniscience granted, the
  representations collapse, Article VII's destination deleted.

---

## Coda — the destination

The player's progression is not gaining more information. It is **shedding interpretation**.

> You don't become a better operator because the software gets smarter.
> You become a better operator because you stop trusting the software as your only lens.

Early game: IRIS tells you what happened.
Late game: you tell IRIS what happened.

And the renderings (Article VIII) give that progression its emotional shape: the player does not
become more powerful because the dashboards get bigger — they become more **perceptive**, because
each new representation lets them reconcile another piece of the same human being. The first time
a dossier's badge photo puts a face on the muted unit they've watched for two hours, nothing
changes mechanically. The player changes. Most management games start with people and reduce them
to systems; this game starts with systems and gradually reveals the people hiding inside them.

The software dehumanizes. The simulation rehumanizes. Everything in between is the player,
learning to see people.

---

Related: `performance-direction-contract.md` (how the body performs truth) ·
`shapes-overlay-reader-spec.md` (how the cold layer is drawn) · `CONTRACT.md` (the tool↔sim data
boundary) · `icon-expansion-plan.md` (symbol id registries) · sim-side: the QuotaOS workstation
frame and commandments (this document's preamble is the candidate next commandment).
