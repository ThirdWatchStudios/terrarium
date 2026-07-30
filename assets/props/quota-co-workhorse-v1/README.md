# QuotaCo workhorse prop SVG sources v1

Status: **accepted canonical source art; production-wired in Terrarium**

These twenty-two standalone SVG files are the artist-editable source
counterparts of the accepted workhorse, workstation, and employee-service
machine prop proofs:

| Prop | Projection | Source |
| --- | --- | --- |
| Printer | elevation | `printer.svg` |
| Printer (jammed) | elevation | `printer-jammed.svg` |
| Coffee machine | elevation | `coffee-machine.svg` |
| Coffee machine (broken) | elevation | `coffee-machine-broken.svg` |
| Water cooler | elevation | `water-cooler.svg` |
| Water cooler (empty) | elevation | `water-cooler-empty.svg` |
| Paper shredder | elevation | `shredder.svg` |
| Microwave | elevation | `microwave.svg` |
| Break-room fridge | elevation | `fridge.svg` |
| Vending machine | elevation | `vending-machine.svg` |
| Desk | plan | `desk.svg` |
| Office chair | plan | `office-chair.svg` |
| Filing cabinet | elevation | `filing-cabinet.svg` |
| Copier | elevation | `copier.svg` |
| Office plant | elevation | `office-plant.svg` |
| Standing desk | plan | `standing-desk.svg` |
| Cubicle workstation | plan | `cubicle-workstation.svg` |
| Reception desk | plan | `reception-desk.svg` |
| Conference table | plan | `conference-table.svg` |
| Supply cabinet | elevation | `supply-cabinet.svg` |
| Desk lamp | plan | `desk-lamp.svg` |
| Desk clutter | plan | `desk-clutter.svg` |

Each file uses a `0 0 128 128` canvas and semantic editor groups such as
`shadow`, `shell`, `structure`, `function`, and `personalization`. The groups
are deliberately ordinary SVG rather than generated TypeScript geometry so an
artist can edit them in a standard vector editor.

`npm run props:import` compiles these sources into the existing prop templates.
The templates retain their IDs, grid footprints, pivots, projections,
navigation/collision behavior, interaction metadata, export contract, schema,
and Unity-facing registration. See `docs/prop-svg-importer.md` for the accepted
dialect, palette metadata, parameter-variant rules, and validation commands.

This Terrarium wiring does not by itself prove a fresh bundle import or Play
Mode render in The Water Cooler; that remains a separate cross-repository
verification step.

The redundant `water-station` template and source were retired. The anchored
`water-cooler` and its `water-cooler-empty` state remain the sole gameplay
water-service prop family.
