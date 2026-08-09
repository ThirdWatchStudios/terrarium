# QuotaCo Office Window Source-Fit Review v2

Status: **visual direction approved; Terrarium canonical source promotion complete**

This revision narrows the gate to the active `prop-window` family. Neighbor-suite glass is
deferred until gameplay or building-shell composition demonstrates a concrete need for it.

The horizontal candidate remains an integrated wall opening. The revised vertical candidate
uses the accepted fixed-view door grammar: wall stubs meet neighboring cells and a narrow
top-oblique glazed barrier spans the opening, leaving the separately rendered floor visible
around it. Neither candidate contains floor pixels.

Canonical source ownership: `window-horizontal.svg` and `window-vertical.svg`. The known
garage-door resemblance in the vertical blinds remains a hand-correction polish note, not a
reason to retain generated geometry as source truth.

Unity would continue to own axis selection, east/west mirroring, exact one-cell wall replacement,
and preservation of the floor tile below the opening.

Terrarium source and importer promotion are complete. Browser export, Unity import/runtime work,
staging, and commit remain separate gates and were not performed by this pass.
