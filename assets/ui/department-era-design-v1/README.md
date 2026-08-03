# Department-era UI production design v1

Status: **Terrarium production-design source; Unity implementation deferred**

This directory turns the approved UI-E0 v3 construction language and UI-E1a
Direction B typography split into structured, reproducible design data. It is
the visual handoff source for the department-era Build interface, not a runtime
UI payload and not an instruction to bake whole screens into SVGs.

Terrarium owns the visual decisions, literal screen compositions, and
stateless shared marks. The later joint Unity pass will translate those
decisions into TextCore assets, UXML/USS, responsive layout, accessibility,
interaction, authoritative state binding, and spatial world geometry.

The active voice split is:

- World: the office, people, facilities, footprint and authored route;
- Utility: smoked-olive shallow machinery and actions;
- QuotaCo print: manila official records in Courier Prime; and
- IRIS: a contained navy diagnostic in IBM Plex Mono.

Amber stays reserved for dormant Capture. Rose stays reserved for emotion.

The renderer deliberately uses the approved department-era world image only as
a composition reference. That image is not copied here and is not a production
master. The 19 approved department glyphs now resolve through canonical SVGs
under `assets/ui/canonical-department-glyphs-v1/`; layout and runtime geometry
remain deferred to the later joint Unity pass.
