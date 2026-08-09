# Quiet Wall Door Runtime Fit v3

Status: **review-only candidate; promoted v2 source and Unity import unchanged**

The fresh Unity import proves that the receiver is honoring the one-cell footprint and centered
source compensation. It also exposes a second defect: the exported Office wall uses
`#B4B2A9 / #888780 / #5F5E5A`, while the promoted door was baked against
`#85867F / #B0AEA5 / #999A92`. The door therefore cannot match the wall even when its
plane ordering is internally consistent.

This proof draws its wall-owned door structure from the fresh import’s actual wall palette.
Production should resolve those values from the exported wall instance rather than introduce
another fixed door palette. The remaining proportion problem is also addressed: v2 leaves only
52/128 (41%) as clear passage, so the frame dominates and reads as a narrow inserted prop.

This pass increases the outer aperture from 88/128 to 120/128 and the clear open passage to
80/128 (63%). The wall-plane lintel becomes one continuous construction, the jamb becomes one
quiet return, and open leaves retract behind it. Runtime footprint, facing, material, transparency,
and the eventual centered 0.5 source wrapper remain unchanged.

Nothing in the promoted source bank, generated registry, browser export, Unity import, staging,
or commit is changed by this proof.
