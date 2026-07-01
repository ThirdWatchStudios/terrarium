# The Performance Direction Contract

**A constitutional document — the boundary between truth and legibility.**

Status: ratified in conversation 2026-06-30. Cross-repo: Terrarium authors the *vocabulary* of
performance; The Water Cooler *runs* the performance layer. This document sits **above**
`CONTRACT.md` (which governs the tool↔sim data boundary) — it governs a boundary *inside the game*
that no data format can enforce on its own.

This is **not** an implementation spec. Pose vocabularies, beat schedules, stage affordances, and
atlas formats are downstream of it and live in their own documents. This document exists for one
political reason: six months from now, someone will want to *"just add a little animation"* or
*"just add one more icon,"* and there must be a law to point at. It defends a boundary that is
invisible right up until it is violated.

---

## Preamble — why this is its own subsystem

For most of this project we assumed:

```
Simulation → Renderer
```

— that the renderer's job is to **display** the simulation. That was wrong. The renderer's job is
to **perform** the simulation, and performance is a different job from display, with its own
inputs, outputs, and laws. The true architecture is three layers:

```
   Simulation      decides WHY something happens          (owns TRUTH)
       ↓
   Performance     decides HOW it becomes observable       (owns OBSERVABLE CONSEQUENCE)
       ↓
   Renderer        draws what Performance requests          (owns RENDERING)
```

The simulation decides *why* something happens. The performance layer decides *whether a human
being can see it happen*. Those are two different jobs. Conflating them is the root of every
"just add more" mistake this document exists to prevent.

---

## Article I — The Three Charters

Each layer has exactly one job. It may not reach into the job above it.

1. **Simulation owns truth.** What is real: intents, relationships, events, severity, who saw
   what. The simulation is authoritative at every instant.
2. **Performance owns observable consequence.** It renders truth into something a watching human
   *can* observe — composing from what the floor affords, blocking the beats, shaping the timing —
   and it does so **faithfully, without distortion.** Legibility is a *byproduct* of faithful
   consequence, never the objective. Performance never makes a thing **bigger** so it will be
   noticed; it makes it **observable without distortion**, and accepts that some truths are subtle
   and will be missed. *Faithful observation over maximum comprehension.* It adds no facts.
3. **Renderer owns rendering.** It draws exactly what Performance requests and knows nothing
   else. Its entire vocabulary is `pose · orientation · hold · move`. It has never heard of a
   "reprimand," a "beat," or a "stage."

The thinness of the Performance→Renderer interface is not an accident — it is the mechanism that
makes the renderer **interchangeable.** 2D silhouettes and orthographic 3D are two implementations
of the same four words. The renderer choice is, by law, a swappable backend.

---

## Article II — The Prime Law

> **Presentation may amplify simulation, but never invent it.**

Equivalently, and to be quoted at review time:

> **Nothing downstream may invent meaning upstream did not authorize.**

This cleanly partitions responsibility:

- **Simulation owns truth.**
- **Performance owns observable consequence.**
- **Renderer owns rendering.**

"Authorized meaning" is not a vibe — it is a defined payload. The simulation, when it hands an
event to Performance, declares the meaning-bearing fields: *who, what social act, severity,
whether it was meant to be public, who the intended witnesses are, the relationship, the
salience.* Performance may **read** these and choose any staging **consistent with** them. It may
**never exceed** them. If no authorized field says *public*, Performance may not stage a private
reprimand in front of the copier for drama — that would be the performance layer writing fiction
the simulation never agreed to.

**The enforcement question**, for any presentation choice whatsoever — a pose, a stage, an icon, a
camera move, a lighting cue, a sound:

> *Does this change what a viewer believes about who / what / severity / publicness, beyond what
> the simulation declared?*

If yes, it is a violation, no matter how good it looks.

---

## Article III — The Razor

> **The performance layer should communicate enough to provoke interpretation, but not so much
> that interpretation becomes unnecessary.**

This is the artistic center of the whole game, and it has **two** failure modes, not one:

- **Under-communicate → confusion.** The viewer cannot tell what happened. This is the
  armless-capsule failure. The team already fears this one.
- **Over-communicate → interpretation dies.** The viewer is *told* everything and imagines
  nothing. This is the cutscene, the over-animation, the explanatory icon. **The team does not yet
  fear this one — and it is the more dangerous of the two,** because every instinct pulls toward
  *more*, and *more* always looks like progress in a screenshot.

This Article exists chiefly to defend the **upper** bound. "Add more legibility" must be a
reviewable claim, not an automatic good. The right amount of communication is the *least* amount
that lets a human read the truth — because the gap is where the player goes to work.

---

## Article IV — Participation is the goal (watchability is only its symptom)

Comprehension is not the goal. It is table stakes. The goal is that the viewer **wants to keep
watching** — and, more precisely, that they begin to **participate**.

Not *projection* — that word is too passive. **Participation.** The player writes the missing
dialogue, invents the motivation, decides what Bob was really thinking. That is player-authored
story, which is what this game has wanted from the beginning — not authored drama, but drama the
player finishes in their own head. It is the same discovery as *"the interaction is the atom,"* one
layer up: the atom of *narrative* is the interpretation the player supplies.

This reframes the renderer question entirely. It is possible — likely, even — that:

> **3D communicates. 2D invites.** Those are not the same thing.

A literal body resolves ambiguity and closes the gap; an abstract one leaves the gap open for the
player to fill. A result where 3D wins comprehension while 2D wins watchability would not be a
tie — it would be the discovery that the question was never *which renderer is clearer,* but
*which renderer leaves room for the player.* (See the presentation experiment; watchability is a
co-primary metric there, and it can veto the comprehension verdict.)

---

## Article V — Social affordances (the environment is a participant, not scenery)

Performance is **gated by the environment**, and the environment is procedurally generated.
Therefore the floor is not scenery — it is a cast of **social affordances**.

The base unit is **not** the Stage. It is the **social affordance** — a single behavioral
opportunity a place offers. A copier does not *implement* a `CasualEncounterStage`; it advertises a
*set* of affordances:

```
copier → { waiting, sharing, overhearing, blocking, passing, queueing, frustration }
```

Furniture implements **behavioral opportunities**, not stages. Performance reads the affordances
co-located at a place and **composes** from them; a "Stage" is what *emerges* when Performance
assembles a coherent set of affordances into one scene — an **output, never a type furniture
declares.** This is strictly more composable: the same copier hosts an ambush, a shared laugh, or
an overheard secret depending only on which affordances Performance draws on, and which meaning the
simulation authorized.

| Place | advertises affordances | emergent stagings |
|---|---|---|
| desk | `{ authority, across-barrier, approach-front, seated-dominance }` | reprimand · review · dismissal |
| copier / printer | `{ waiting, sharing, overhearing, blocking, queueing, frustration }` | ambush · gossip · shared laugh |
| hallway | `{ passing, brief-stop, semi-public, no-commitment }` | a passing jab · a caught glance |
| conference room | `{ audience, group-attention, front-of-room, exposure }` | presentation · public embarrassment · celebration |

Consequences that follow by law:

- **A prop advertises a set of affordances — not a mesh, and not a stage.** Affordance is
  **information**, not decoration; the Stage is *composed*, not *implemented*.
- **The office generator places social opportunities,** not furniture. Layout matters not because
  of routing but because it determines *which affordances — and therefore which scenes — are
  available.* A floor that affords only one kind of opportunity can only ever tell one kind of story.
- **Performance composes a staging** from the affordances affordable at a location, constrained by
  the meaning the simulation authorized (Article II). It never composes a scene the truth did not
  license.
- **Variety comes from composition, not from more poses.** The same authorized event, composed from
  a different affordance set, is a different scene. This — not a bigger animation set — is the
  answer to repetition. (Anti-repetition also requires recency-weighted composition and
  salience-gated fidelity; both are implementation, downstream of this Article.)

---

## Article VI — The Interfaces (the boundary must be thin, or it is not a boundary)

**Simulation → Performance** hands over *meaning, never staging*: the authorized payload of
Article II (who · act · severity · public? · witnesses · relationship · salience). It does not say
*how* to show it.

**Performance → Renderer** hands over *staging, never meaning*: `pose · orientation · hold · move`.
The renderer receives held states and requests to move between them. It does not know they compose
a reprimand; it does not know a Stage exists; it does not know a beat exists. If the renderer can
name a social act, the boundary has leaked and the renderer is no longer swappable.

Everything between those two interfaces — casting the Stage, blocking the beats, choosing dwell
times, shaping the timing to a character's presence — is Performance's sole domain, and is
invisible to both neighbors.

---

## Article VII — Performance has duration; truth is authoritative within it

A performance takes *time* to make a truth observable — the reprimand is seconds long. Two laws
follow, and both are corollaries of the Prime Law, not new rules:

1. **Truth is authoritative at every instant, including mid-performance.** A performance is a
   *proposal about how to make a present truth observable.* It holds **no claim on the future.**
   If the simulation changes the truth at second 3 of a 7-second scene, completing the scene would
   be showing a fiction the simulation has abandoned — **inventing continuity upstream did not
   authorize.** Therefore performances are **preemptible**, and must **degrade to neutrality**
   rather than finish a now-false scene. Committing to a scene is itself a violation.

2. **The observable trails the true — and that is part of the fiction.** Because legibility costs
   time, what the player sees always lags what is real, the way a body lags an intention. This lag
   is *desirable* — it is what makes the floor feel like watched people rather than a live
   dashboard. But it is **bounded**: Performance may never render a state that *current* truth
   contradicts. Lag behind the truth, never in front of it, never against it.

---

## Article VIII — Tripwires

Concrete sins. If you are doing one of these, stop — you are across a boundary.

- **You are adding an icon to explain something a body could show.** You are paying a legibility
  debt with HUD noise. Fix the body, not the HUD. *(The HUD must never do the body's job.)*
- **You are adding animation to make something prettier, not more legible.** Presentation
  inventing, not amplifying. Article II.
- **The renderer now contains the word "reprimand" (or "talk," or "beat," or "stage").** The
  Performance→Renderer boundary has leaked; the renderer is no longer swappable. Article VI.
- **A stage was chosen because it looked dramatic, not because the truth authorized it.**
  Performance is writing fiction. Article II.
- **A performance runs to completion after its truth changed.** Temporal violation. Article VII.
- **You are reaching for "more" — more poses, more icons, more motion — to fix a legibility
  problem.** Reach for *less that is better placed* first. The right amount is the least amount.
  Article III.
- **You are about to build window management / a camera director / an animation graph because
  "performance needs it."** Performance is a *contract*, not an engine. If you are building an
  engine, you have mistaken the layer for its implementation.

---

## Coda — the actual discovery

The 2D-versus-3D question was never the discovery. It was the pressure that revealed one:

> **Performance is its own system** — with its own inputs (authorized meaning), its own outputs
> (`pose · orientation · hold · move`), its own unit (the Stage), and its own laws (amplify, never
> invent; provoke interpretation, never replace it; trail the truth, never lead it).

The simulation decides *why* something happens. The performance layer decides *whether a human
being can see it happen*. Keeping those two jobs separate — and refusing to let the second invent
what the first did not authorize — may end up as load-bearing for *The Water Cooler* as the
behavior simulation itself.

- Simulation creates truth.
- Performance renders truth into observable consequence — faithfully, never bigger.
- Presentation renders performance.
- **Nothing downstream is allowed to invent meaning upstream didn't authorize.**

---

### What comes next (implementation, downstream of this constitution)

1. **The affordance & staging vocabulary** — the social-affordance schema props/rooms advertise,
   and the composition rule (affordable ∩ authorized, recency-weighted, salience-gated). The Stage
   is emergent, not enumerated.
2. **The pose + beat model** — the `POSES` catalog, the new anchors/arm slot, and the beat-schedule
   contract, nested *beneath* Stage casting.
3. **The presentation experiment** (`social-theater-presentation-experiment.md`) — already drafted;
   it is the empirical test of Article IV.

Related: `CONTRACT.md` (§5.8 presence), `presence-profile.md`, `docs/the-active-loop.md` (sim),
`quotaos-workstation-frame.md` (the HUD it keeps sterile).
