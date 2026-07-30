# QuotaCo prop redesign inventory v1

Status: **review-only inventory; no production art or integration change**

Live registry baseline: 123 prop templates + 12 character accessories; schema 19; 128-unit authoring canvas; 112-unit wall datum; Unity character visual scale 0.65.

The six groups below are a redesign review lens, not a new export taxonomy. Every current ID keeps its existing placement, projection, footprint, pivot, navigation/collision behavior, and interaction metadata during review.

## Handheld and character-relative items

Character accessories attached to head, body, wrist, or hand anchors; held items follow the complete 0.65 character transform.

| Source | ID | Label | Placement / projection | Grid footprint | Coupling |
| --- | --- | --- | --- | --- | --- |
| character part | `acc-glasses` | Glasses | rig-relative / headCenter | — | character anchor |
| character part | `acc-lanyard` | Lanyard | rig-relative / body | — | character anchor |
| character part | `acc-mug` | Coffee mug | rig-relative / handRight | — | held-prop |
| character part | `acc-badge` | Badge clip | rig-relative / chest | — | character anchor |
| character part | `acc-headset` | Headset | rig-relative / headCenter | — | character anchor |
| character part | `acc-hard-hat` | Hard hat | rig-relative / headCenter | — | character anchor |
| character part | `acc-watch` | Watch | rig-relative / handRight | — | wrist-worn |
| character part | `acc-earbuds` | Earbuds | rig-relative / headCenter | — | character anchor |
| character part | `acc-clipboard` | Clipboard | rig-relative / handRight | — | held-prop |
| character part | `acc-coffee-tray` | Coffee run | rig-relative / handRight | — | held-prop |
| character part | `acc-paper-stack` | Stack of papers | rig-relative / handRight | — | held-prop |
| character part | `acc-hairnet` | Hairnet | rig-relative / headCenter | — | character anchor |

## Desk and work-surface items

Plan-projected work surfaces and the small items that establish their use.

| Source | ID | Label | Placement / projection | Grid footprint | Coupling |
| --- | --- | --- | --- | --- | --- |
| prop template | `desk` | Desk | floor / plan | 2×1 | blocks walk |
| prop template | `desk-succulent` | Desk succulent | floor / elevation | 1×1 | blocks walk |
| prop template | `desk-lamp` | Desk lamp | floor / elevation | 1×1 | blocks walk |
| prop template | `personal-desk-items` | Personal desk items | floor / plan | 1×1 | blocks walk |
| prop template | `standing-desk` | Standing desk | floor / plan | 2×1 | blocks walk |
| prop template | `coffee-table` | Coffee table | floor / plan | 1×1 | blocks walk |
| prop template | `ping-pong-table` | Ping-pong table | floor / plan | 3×2 | blocks walk |
| prop template | `foosball-table` | Foosball table | floor / plan | 2×1 | blocks walk |
| prop template | `conference-table` | Conference table | floor / plan | 3×2 | blocks walk; anchor `conference_table` |
| prop template | `reception-desk` | Reception desk | floor / plan | 2×2 | blocks walk; anchor `reception_desk` |
| prop template | `desk-clutter` | Desk clutter | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `cubicle-workstation` | Cubicle workstation | floor / plan | 2×2 | blocks walk |
| prop template | `kitchenette-counter` | Kitchenette counter | floor / plan | 3×1 | blocks walk |
| prop template | `break-table` | Break room table | floor / plan | 2×2 | blocks walk |
| prop template | `prep-table` | Kitchen prep table | floor / plan | 2×1 | blocks walk |
| prop template | `dining-carrel` | Solitary dining carrel | floor / plan | 1×1 | blocks walk |
| prop template | `cafeteria-table` | Communal cafeteria table | floor / plan | 4×2 | blocks walk |
| prop template | `tray-stack` | Tray stack | floor / plan | 1×1 | blocks walk |

## Furniture

Seating, storage, shelving, and freestanding furnishing shells.

| Source | ID | Label | Placement / projection | Grid footprint | Coupling |
| --- | --- | --- | --- | --- | --- |
| prop template | `bookshelf` | Bookshelf | floor / elevation | 1×1 | blocks walk |
| prop template | `lockers` | Lockers | floor / elevation | 1×1 | blocks walk |
| prop template | `open-shelving` | Open shelving | floor / elevation | 1×1 | blocks walk |
| prop template | `waiting-bench` | Waiting bench | floor / plan | 2×1 | blocks walk |
| prop template | `pantry-shelf` | Pantry shelf | floor / elevation | 1×1 | blocks walk |
| prop template | `bean-bag` | Bean bag | floor / plan | 1×1 | blocks walk |
| prop template | `nap-pod` | Nap pod | floor / elevation | 2×1 | blocks walk |
| prop template | `pet-bed` | Pet bed | floor / plan | 1×1 | blocks walk |
| prop template | `bar-cart` | Bar cart | floor / elevation | 1×1 | blocks walk |
| prop template | `office-chair` | Office chair | floor / plan | 1×1 | non-blocking |
| prop template | `filing-cabinet` | Filing cabinet | floor / elevation | 1×1 | blocks walk |
| prop template | `supply-cabinet` | Supply cabinet | floor / elevation | 1×1 | blocks walk; anchor `supply_cabinet` |
| prop template | `coat-rack` | Coat rack | floor / elevation | 1×1 | blocks walk |
| prop template | `couch` | Couch | floor / plan | 2×1 | blocks walk |
| prop template | `lounge-seating` | Lounge seating | floor / plan | 2×2 | blocks walk |
| prop template | `restroom-stall` | Restroom stall | floor / elevation | 1×1 | blocks walk |

## Facilities and machines

Amenities, appliances, processing equipment, IRIS equipment, and service infrastructure.

| Source | ID | Label | Placement / projection | Grid footprint | Coupling |
| --- | --- | --- | --- | --- | --- |
| prop template | `water-cooler` | Water cooler | floor / elevation | 1×1 | blocks walk; anchor `water_cooler` |
| prop template | `printer` | Printer | floor / elevation | 1×1 | blocks walk; anchor `printer` |
| prop template | `coffee-machine` | Coffee machine | floor / elevation | 1×1 | blocks walk; anchor `coffee_machine` |
| prop template | `printer-jammed` | Printer (jammed) | floor / elevation | 1×1 | not in placeable facility catalog |
| prop template | `coffee-machine-broken` | Coffee machine (broken) | floor / elevation | 1×1 | not in placeable facility catalog |
| prop template | `water-cooler-empty` | Water cooler (empty) | floor / elevation | 1×1 | not in placeable facility catalog |
| prop template | `restroom-sink` | Restroom sinks | floor / elevation | 2×1 | blocks walk |
| prop template | `copier` | Copier | floor / elevation | 1×1 | blocks walk |
| prop template | `shredder` | Paper shredder | floor / elevation | 1×1 | blocks walk |
| prop template | `server-rack` | Server rack | floor / elevation | 1×1 | blocks walk |
| prop template | `iris-installation-unit` | IRIS installation unit | floor / elevation | 2×1 | blocks walk; anchor `iris_console` |
| prop template | `iris-installation-unit-dormant` | IRIS installation unit (dormant) | floor / elevation | 2×1 | not in placeable facility catalog |
| prop template | `iris-charging-dock` | IRIS charging dock | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `phone-booth` | Phone booth | floor / elevation | 1×1 | blocks walk |
| prop template | `microwave` | Microwave | floor / elevation | 1×1 | blocks walk |
| prop template | `recycling-bins` | Recycling bins | floor / elevation | 1×1 | blocks walk |
| prop template | `fridge` | Break room fridge | floor / elevation | 1×1 | blocks walk; anchor `break_room_fridge` |
| prop template | `vending-machine` | Vending machine | floor / elevation | 1×1 | blocks walk; anchor `vending_machine` |
| prop template | `mail-station` | Mail station | floor / elevation | 1×1 | blocks walk; anchor `mail_station` |
| prop template | `trash-bin` | Trash bin | floor / elevation | 1×1 | blocks walk |
| prop template | `elevator-bank` | Elevator bank | floor / elevation | 2×1 | not in placeable facility catalog |
| prop template | `serving-line` | Serving line | floor / elevation | 4×1 | blocks walk |
| prop template | `service-scanner` | Service attendance scanner | floor / elevation | 1×1 | blocks walk; anchor `service_scanner` |
| prop template | `commercial-range` | Commercial range | floor / elevation | 2×1 | blocks walk |
| prop template | `dish-return` | Dish return | floor / elevation | 2×1 | blocks walk |
| prop template | `walk-in-front` | Walk-in cooler front | floor / elevation | 2×1 | blocks walk |

## Wall-mounted and decorative items

Wall-slot architecture plus office-softening plants, graphics, light, and display pieces.

| Source | ID | Label | Placement / projection | Grid footprint | Coupling |
| --- | --- | --- | --- | --- | --- |
| prop template | `office-plant` | Office plant | floor / elevation | 1×1 | blocks walk |
| prop template | `potted-tree` | Potted tree | floor / elevation | 1×1 | blocks walk |
| prop template | `hanging-plant` | Hanging plant | wall-slot / plan | 1×1 | non-blocking |
| prop template | `floor-lamp` | Floor lamp | floor / elevation | 1×1 | blocks walk |
| prop template | `framed-art` | Framed art | wall-slot / plan | 1×1 | non-blocking |
| prop template | `poster` | Poster | wall-slot / plan | 1×1 | non-blocking |
| prop template | `wall-clock` | Wall clock | wall-slot / plan | 1×1 | non-blocking |
| prop template | `wall-screen` | Wall screen | wall-slot / plan | 2×1 | non-blocking |
| prop template | `kanban-board` | Kanban board | wall-slot / plan | 1×1 | non-blocking |
| prop template | `fish-tank` | Fish tank | floor / elevation | 1×1 | blocks walk |
| prop template | `string-lights` | String lights | wall-slot / plan | 1×1 | non-blocking |
| prop template | `badge-reader` | Badge reader | wall-slot / plan | 1×1 | non-blocking |
| prop template | `door` | Door | wall-slot / plan | 1×1 | non-blocking; anchor `door` |
| prop template | `window` | Window | wall-slot / plan | 1×1 | non-blocking |
| prop template | `nameplate` | Nameplate | wall-slot / plan | 1×1 | non-blocking |
| prop template | `hvac-vent` | HVAC vent | wall-slot / plan | 1×1 | non-blocking |
| prop template | `rug` | Rug | floor / plan | 2×2 | non-blocking |
| prop template | `whiteboard` | Whiteboard | floor / elevation | 1×1 | blocks walk; anchor `whiteboard` |
| prop template | `bulletin-board` | Bulletin board | floor / elevation | 1×1 | blocks walk |
| prop template | `wall-calendar` | Wall calendar | wall-slot / plan | 1×1 | non-blocking |
| prop template | `water-fountain` | Water fountain | wall-slot / plan | 1×1 | non-blocking |
| prop template | `exit-sign` | Exit / stairwell door | floor / elevation | 1×1 | not in placeable facility catalog |
| prop template | `neighbor-glass` | Neighbor suite glass | wall-slot / plan | 2×1 | not in placeable facility catalog |
| prop template | `directory-placard` | Building directory | wall-slot / plan | 1×1 | not in placeable facility catalog |
| prop template | `fire-extinguisher` | Extinguisher cabinet | wall-slot / plan | 1×1 | not in placeable facility catalog |

## Outdoor and construction-site props

Parking, campus, landscape, build-site ground detail, and exterior fixtures.

| Source | ID | Label | Placement / projection | Grid footprint | Coupling |
| --- | --- | --- | --- | --- | --- |
| prop template | `car` | Car | floor / plan | 4×2 | not in placeable facility catalog |
| prop template | `car-suv` | SUV | floor / plan | 4×2 | not in placeable facility catalog |
| prop template | `parking-line` | Parking line | floor / plan | 2×2 | not in placeable facility catalog |
| prop template | `lot-marking-accessible` | Accessible-stall marking | floor / plan | 2×2 | non-blocking |
| prop template | `lot-marking-arrow` | Lane arrow marking | floor / plan | 2×1 | non-blocking |
| prop template | `lot-marking-reserved` | Reserved-stall marking | floor / plan | 2×1 | non-blocking |
| prop template | `lot-marking-crosswalk` | Crosswalk marking | floor / plan | 2×2 | non-blocking |
| prop template | `lamp-post` | Parking-lot lamp post | floor / elevation | 1×1 | blocks walk |
| prop template | `sign-lot` | Parking-lot sign | floor / elevation | 1×1 | blocks walk |
| prop template | `car-compact` | Compact car | floor / plan | 3×2 | not in placeable facility catalog |
| prop template | `bike-rack` | Bike rack | floor / plan | 2×1 | blocks walk |
| prop template | `ground-detail-rake-arc-a` | Raked gravel arcs A | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-rake-arc-b` | Raked gravel arcs B | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-rake-arc-c` | Raked gravel arcs C | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-lilypad-a` | Lily pads A | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-lilypad-b` | Lily pads B | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-stepping-stone-a` | Stepping stones A | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-stepping-stone-b` | Stepping stones B | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `park-bench` | Outdoor park bench | floor / elevation | 2×1 | blocks walk |
| prop template | `picnic-table` | Campus picnic table | floor / plan | 3×2 | blocks walk |
| prop template | `stone-lantern` | Stone garden lantern | floor / elevation | 1×1 | blocks walk |
| prop template | `boulder-arrangement` | Placed boulder arrangement | floor / plan | 2×1 | blocks walk |
| prop template | `reeds-cluster` | Shoreline reeds cluster | floor / elevation | 1×1 | not in placeable facility catalog |
| prop template | `tree-canopy` | Tree | floor / elevation | 3×3 | not in placeable facility catalog |
| prop template | `tree-sapling` | Sapling | floor / elevation | 2×2 | not in placeable facility catalog |
| prop template | `bush-cluster` | Bush cluster | floor / plan | 2×1 | not in placeable facility catalog |
| prop template | `wildflower-patch` | Wildflower patch | floor / plan | 2×2 | not in placeable facility catalog |
| prop template | `tall-grass-clump` | Tall grass clump | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `bracken-patch` | Bracken patch | floor / plan | 2×1 | not in placeable facility catalog |
| prop template | `boulder` | Boulder | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-grass-tuft-a` | Grass tuft A | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-grass-tuft-b` | Grass tuft B | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-grass-tuft-c` | Grass tuft C | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-flower-sprig-a` | Flower sprig A | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-flower-sprig-b` | Flower sprig B | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-pebble-a` | Pebble scatter A | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-pebble-b` | Pebble scatter B | floor / plan | 1×1 | not in placeable facility catalog |
| prop template | `ground-detail-twig-a` | Fallen twig | floor / plan | 1×1 | not in placeable facility catalog |

## First proof selection

- Work surface: `desk`
- Seating: `office-chair`
- Storage: `filing-cabinet`
- Printer/copier: `copier`
- Plant: `office-plant`
- Handheld: `acc-clipboard` on the locked character rig

These six roles are the calibration carriers only. A selected direction would still need a later family-by-family production plan and explicit promotion.
