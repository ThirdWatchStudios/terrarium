# QuotaCo outdoor and construction-site prop inventory v1

Status: read-only review inventory. No production source, template, export, schema, or Unity registration changes are authorized by this file.

## Scope finding

The live category contains parking, campus, landscape, build-site ground detail, and exterior fixtures. It does not contain dedicated construction equipment. The existing fabrication worker is used only as a scale and interaction reference.

## Mobility and lot (11)

- `car`
- `car-suv`
- `parking-line`
- `lot-marking-accessible`
- `lot-marking-arrow`
- `lot-marking-reserved`
- `lot-marking-crosswalk`
- `lamp-post`
- `sign-lot`
- `car-compact`
- `bike-rack`

## Campus and garden (12)

- `ground-detail-rake-arc-a`
- `ground-detail-rake-arc-b`
- `ground-detail-rake-arc-c`
- `ground-detail-lilypad-a`
- `ground-detail-lilypad-b`
- `ground-detail-stepping-stone-a`
- `ground-detail-stepping-stone-b`
- `park-bench`
- `picnic-table`
- `stone-lantern`
- `boulder-arrangement`
- `reeds-cluster`

## Landscape and scatter (15)

- `tree-canopy`
- `tree-sapling`
- `bush-cluster`
- `wildflower-patch`
- `tall-grass-clump`
- `bracken-patch`
- `boulder`
- `ground-detail-grass-tuft-a`
- `ground-detail-grass-tuft-b`
- `ground-detail-grass-tuft-c`
- `ground-detail-flower-sprig-a`
- `ground-detail-flower-sprig-b`
- `ground-detail-pebble-a`
- `ground-detail-pebble-b`
- `ground-detail-twig-a`

## First proof carriers

| Template | Role | Projection | Recognition target |
| --- | --- | --- | --- |
| `car` | Vehicle | plan | hood, glazed cabin, rear deck, lights, and one uninterrupted vehicle hull |
| `lot-marking-crosswalk` | Lot marking | plan | five broad crossing bars with an unmistakable pedestrian travel axis |
| `lamp-post` | Exterior fixture | elevation | wide luminaire, narrow post, service collar, and grounded foot |
| `sign-lot` | Wayfinding | elevation | large sign face, paired supports, and a clear approach side |
| `bike-rack` | Mobility fixture | plan | repeated lock hoops fixed to one long ground rail |
| `park-bench` | Seating | elevation | long back, distinct seat lip, two supports, and open foot room |
| `picnic-table` | Break surface | plan | one long table slab bracketed by two clearly separated benches |
| `tree-canopy` | Landscape anchor | elevation | one broad organic crown, visible trunk, and planted ground contact |

Context-only carriers: `car-compact`, `boulder-arrangement`.

## Review boundary

- Preserve every existing footprint, projection, pivot, navigation/collision contract, and interaction anchor.
- Keep character roots and the 0.65 character visual scale unchanged.
- Do not apply the character multiplier to props.
- Do not create genuine SVG sources until a design is visually accepted.
- Do not change exports, schema, default instances, facility catalogs, or Unity registration during this proof.
