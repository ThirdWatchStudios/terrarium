# QuotaCo department machines — motion pilot calibration

Status: **review only; no animation or export contract has been promoted**

This proof tests four aligned frames on one representative machine from each pollution family
plus a quiet control. Only functional mechanisms move. The accepted static sprite remains frame
zero and the visual source of truth for housing, footprint, pivot, palette, and product identity.

The recommended ownership split is: Terrarium authors aligned frame pixels and moving-part
membership; the sim owns state selection, playback rate, stable per-instance phase offset, and all
pollution effects. No glow, haze, fumes, sound rings, meters, readouts, or reserved colors are baked.

The animated SVG is intentionally synchronized only to make frame differences easy to inspect.
A runtime implementation must desynchronize machine instances.
