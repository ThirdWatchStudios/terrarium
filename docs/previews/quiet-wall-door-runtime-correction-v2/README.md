# Quiet Wall Door Runtime Correction v2

Status: **review-only correction; promoted source and Unity import unchanged**

The first Unity review showed two real source problems: the visible door aperture was too
narrow inside its wall cell, and the socket shading did not use the production wall compositor’s
actual cap/front/return planes.

This proof keeps the required centered 0.5 source compensation and one-cell runtime envelope.
It widens the horizontal outer aperture from 58/128 (45%) to 88/128 (69%), widens the open
passage from 28/128 to 52/128, and applies the exact connected-wall planes to the door sockets.
The vertical states receive the corresponding wider wall interruption and corrected x-plane mapping.

No canonical SVG, generated registry, production template, exporter, browser export, Unity import,
staging, or commit is changed by this review proof.
