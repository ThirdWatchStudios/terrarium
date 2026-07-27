# QuotaCo Building System topology source kit

This directory extends the approved authored-B strip into reusable, proof-only
source roles for the existing 47-blob contract. It does not replace the original
18 pilot SVGs in the parent directory and is not registered in production.

## Inventory

- `base/`: 20 fixed-light low-base roles — four edges, four convex sockets,
  four concave sockets, and eight direction-specific one-sided caps.
- `upper/`: the same 20 roles for the optional full shell.
- `state/`: `profile-n-to-e-upper`, `profile-w-to-s-upper`, `door-base`,
  `door-upper-frame`, `door-leaf-closed`, `door-leaf-open`, and
  `window-wide-upper`.

Every file uses a strict `0 0 128 128` canvas and exactly one semantic group:
`detail/base`, `detail/upper`, or `detail/state`. Fixed-light views are authored
individually; no role is rotated to manufacture another direction.

## Geometry ruler and ownership

The low base preserves the approved 22-unit material profile: outer mass
`94..120`, green field `96..118`, with the existing 8-unit cap, teal band,
service seam, and fastener rhythm. Its shared socket uses cuts
`94 | 102 | 112 | 120`: four 8-unit corner sockets, four 10-unit edge-center
spans, and a hidden `102..112` connector.

The optional upper preserves the approved 60-unit combined profile. Its outer
shell is `56..99`, cream field `58..97`, and its socket uses cuts
`56 | 68 | 87 | 99`: four 12-unit corner sockets, four 19-unit edge-center
spans, and a hidden `68..87` connector. Base is always drawn before upper.

The proof assembler may generate only the hidden charcoal/material arm and
connector kernel. It must leave every non-solid corner socket to exactly one
authored convex, concave, or one-sided role. Connected fills reach the canvas
edge without a contour there; later clipped overdraw remains assembler-owned.
Visible strokes stay inset by half their width. Service seams terminate at
socket boundaries, and compatible cream, green, and teal bands meet without a
double seam.

The base occupancy uses the existing 47-blob wall mask. The upper occupancy is
an optional subset resolved through that same table, allowing full-profile
north/west runs to end cleanly where the persistent low base continues south or
east. This is proof composition, not a new connectivity or export contract.

Terrarium owns these editable SVGs and palette-mask evidence. Unity retains
composition, cutaways, sorting application, lighting, and production acceptance.
No schema, template, exporter, 47-mask ordering, or shipped bevel source changes
are authorized by this kit.
