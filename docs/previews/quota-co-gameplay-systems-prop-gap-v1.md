# QuotaCo systems-first exterior prop gap v1

Status: review-only. No production ids, templates, sources, facility registrations, exports, schema, gameplay implementation, or Unity integration are changed.

## Inclusion gate

A candidate proceeds only when all four answers are concrete:

1. Which named gameplay system reads it?
2. What visible operational state can change?
3. What do employees do differently because it exists?
4. Why must the consequence be visible on the floor?

## First candidates

| Candidate | Receiver | Floor consequence | Human consequence | Readiness |
| --- | --- | --- | --- | --- |
| `hvac-condenser` | room climate / air-quality coverage and equipment state | rated coverage, equipment noise, and a named outage or degraded zone | people seek, avoid, report, or repair a visibly uncomfortable/noisy condition | system design required |
| `surveillance-camera` | camera coverage / IRIS observation | visible field of view, blind spots, and occlusion by walls or tall landscape | witness exposure and observed behavior change by person and context | explicit design gap |
| `surveillance-sensor` | presence, access, or badge-event observation | a bounded detection zone distinct from camera sight | entry and attendance become legible records without pretending to know intent | explicit design gap |
| `privacy-hedge` | pathing, sightline, witness exposure, and camera occlusion | blocks movement and divides visible/observed space without becoming a wall | creates private paths and outdoor gathering edges while also hiding activity | existing substrate |

## Existing assets to reuse before adding art

- `tree-canopy`: shade or outdoor recovery context.
- `park-bench`: recovery seating and social co-presence.
- `picnic-table`: shared outdoor break venue and finite seating capacity.
- `lamp-post`: practical lighting or safety coverage.
- `bike-rack`: arrival/commute capacity if that system is approved.

## Deferred

- bulldozer or excavator.
- generic construction pallets and cones.
- decorative mushroom / log / leaf-litter variants.
- fire hydrant or transformer without a corresponding system.
- warehouse or conveyor-chain props.

HVAC remains a candidate, not an implied system commitment. Its inclusion says that climate coverage, noise, breakdown, and incident response could produce useful floor consequences. Temperature, power, and maintenance simulation require separate design approval.
