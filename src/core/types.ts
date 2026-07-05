/** Facings follow the RimWorld convention: west is east mirrored at render time. */
export type Facing = 'south' | 'east' | 'north';
export const FACINGS: Facing[] = ['south', 'east', 'north'];

/** Slots a character recipe fills. Render order is determined per-part via z. */
export type Slot = 'body' | 'head' | 'hair' | 'outfit' | 'accessory';

/**
 * The six short-term social states the simulation drives (the sim's
 * `ShortTermSocialStateLabel`: none→normal, anxious, slighted, confident,
 * defensive, reassured). Moods are runtime state, not identity — they are face
 * overlays selected at render time, never stored in a recipe. This vocabulary
 * is the shared contract with the sim: the floor body and the roster portrait
 * both resolve the atlas by these keys, so the labels here MUST match the labels
 * the sim emits (SpriteToolkitOfficeBinder.MoodOverlayIdFor). `confident` and
 * `reassured` are the positive states — the only faces that read as a smile.
 */
export type Mood = 'normal' | 'anxious' | 'slighted' | 'confident' | 'defensive' | 'reassured';
export const MOODS: Mood[] = ['normal', 'anxious', 'slighted', 'confident', 'defensive', 'reassured'];

/**
 * Palette tokens. Parts never hardcode style colors — they reference tokens
 * ('$skin', '$hair', ...) that resolve against a recipe's palette at composite
 * time. Literal hex values are allowed only for style-neutral detail
 * (eye dots, soft shadows) that should not change with the palette.
 */
export type PaletteToken = 'skin' | 'hair' | 'outfitPrimary' | 'outfitSecondary' | 'accent';
export type Palette = Record<PaletteToken, string>;

/** A single drawable. Coordinates are part-local; (0,0) is the part's anchor. */
export interface ShapeSpec {
  /** SVG path data. */
  d: string;
  /** '$token' or '#hex'. Omit for stroke-only shapes. */
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /**
   * Whether this shape contributes to the outline pass. Defaults to true for
   * filled shapes. Set false for interior detail (seams, buttons, eyes) so it
   * doesn't fatten the silhouette.
   */
  silhouette?: boolean;
}

/** Named attachment points, defined per facing in the compositor. */
export type AnchorName =
  | 'body'
  | 'neck'
  | 'headCenter'
  | 'aboveHead'
  | 'chest'
  | 'handRight'
  | 'shoulderLeft'
  | 'shoulderRight'
  | 'hip';

export interface PartVariant {
  shapes: ShapeSpec[];
  /** Paint order within the character. Lower paints first. */
  z: number;
}

export interface PartDef {
  id: string;
  label: string;
  slot: Slot;
  anchor: AnchorName;
  /** Missing facing = part not drawn from that angle (e.g. lanyard from behind). */
  facings: Partial<Record<Facing, PartVariant>>;
  /**
   * Head parts only: this head has no face, so mood overlays never draw on it
   * (the operational-unit disc — feelings arrive as IRIS claims, never on the
   * head; register-constitution.md Article VIII).
   */
  noFace?: boolean;
}

/** A character is pure data — parts by id plus a palette. */
export interface CharacterRecipe {
  id: string;
  name: string;
  parts: {
    body: string;
    head: string;
    hair: string;
    outfit: string;
    accessories: string[];
  };
  palette: Palette;
}

export interface PropParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

/**
 * How a prop is projected, RimWorld-style. 'plan' = seen from above: pivot at
 * center, renders on the furniture layer below characters, rotates freely in
 * the engine. 'elevation' = seen from the front: pivot at the base, y-sorts
 * with characters, never rotates.
 */
export type Projection = 'plan' | 'elevation';
export type PropPlacement = 'floor' | 'wall-slot';

export interface PropTemplate {
  id: string;
  label: string;
  projection: Projection;
  /** Floor props occupy walkable cells; wall-slot props mount into or over wall runs. */
  placement?: PropPlacement;
  /**
   * Optional contact-shadow footprint in canvas coords (128 units). When set and
   * style.render.contactShadow > 0, composeProp draws a soft dark ellipse here,
   * beneath the prop. Omit for wall-slot props and anything that shouldn't cast.
   * NOTE: this is a shadow ellipse, NOT grid occupancy — see gridFootprint.
   */
  footprint?: { cx: number; cy: number; rx: number; ry: number };
  /**
   * Whole-cell grid occupancy for the free-grid office builder (the office-builder
   * pivot; terrarium-office-builder-assets.md §1). This is the collision /
   * walkability / placement-validation unit the sim reasons about — distinct from
   * `footprint` (a canvas-unit contact-shadow ellipse) and from the sprite's visual
   * bounds. Art-determined: most props are 1×1; desks/tables/couches/cubicles claim
   * more, per what the facility represents in the world (a conference table reads as
   * several cells even though its art is drawn in one 128-unit cell). Emitted in the
   * prop atlas, the office-layout props[], and the facility catalog so it travels to
   * Unity.
   */
  gridFootprint: { w: number; h: number };
  /**
   * Sub-cell pivot within the grid footprint, as a fraction (0..1) of the footprint
   * on each axis — where the prop's placement/origin cell sits inside the claimed
   * area. Only meaningful for multi-cell props whose art isn't centered over the
   * footprint. Absent ⇒ footprint center ({ x: 0.5, y: 0.5 }). Lets the builder align
   * the rendered sprite over the occupied cells.
   */
  gridPivot?: { x: number; y: number };
  params: PropParamDef[];
  /**
   * Build shapes in canvas coords (128 design units). Elevation props rest on
   * the ground line y=116; plan props center their footprint on the canvas.
   */
  build(params: Record<string, number>, palette: PropPalette): ShapeSpec[];
}

export type PropPaletteToken = 'primary' | 'secondary' | 'accent';
export type PropPalette = Record<PropPaletteToken, string>;

export interface PropInstance {
  id: string;
  name: string;
  templateId: string;
  params: Record<string, number>;
  palette: PropPalette;
}

/**
 * The global style sheet. Everything here is applied at composite time, so
 * changing it retroactively restyles every character and prop.
 */
export interface StyleSheet {
  outline: {
    width: number;
    color: string;
    /** 'silhouette' outlines the whole figure; 'per-part' also outlines internal part edges. */
    mode: 'silhouette' | 'per-part';
  };
  proportions: {
    /** Scales the head group (head, hair, glasses) about the neck. */
    headScale: number;
    /** Scales body-anchored parts horizontally about the character center. */
    bodyWidth: number;
  };
  render: {
    /** Design canvas is always 128 units; this is the export pixel size at 1x. */
    baseSize: number;
    /** 1 = smooth SVG rasterization; higher values render smaller then nearest-neighbor scale up. */
    pixelScale: number;
    /**
     * Opacity (0–1) of the soft contact shadow drawn under characters and under
     * props that declare a footprint. 0 disables it. Applied at composite time,
     * so it restyles every sprite live like everything else here.
     */
    contactShadow: number;
    /**
     * Strength (0–1) of the ambient mood wash painted over a whole scene, tinted
     * by the scene's dominant character mood. 0 disables it. Scene-only — single
     * sprites never carry it.
     */
    ambientTint: number;
  };
  palettePools: {
    skin: string[];
    hair: string[];
    clothing: string[];
    secondary: string[];
    accent: string[];
  };
}

export interface StylePreset {
  id: string;
  name: string;
  style: StyleSheet;
}

/**
 * Wall neighbor bitmask: N=1, E=2, S=4, W=8. A wall tileset has 16 segments,
 * one per mask, so walls auto-connect into straights, corners, tees, and
 * crosses when placed on the grid.
 */
export const WALL_BITS = { N: 1, E: 2, S: 4, W: 8 } as const;

export interface WallTemplate {
  kind: 'wall';
  id: string;
  label: string;
  params: PropParamDef[];
  /** Build one autotile segment for a neighbor mask. Connected arms overdraw
   *  the tile edge so outlines stay continuous across tiles. */
  build(mask: number, params: Record<string, number>, palette: PropPalette): ShapeSpec[];
}

export interface FloorTemplate {
  kind: 'floor';
  id: string;
  label: string;
  params: PropParamDef[];
  /** Build one floor tile. Must tile seamlessly: patterns wrap at the edges
   *  and floors render flat (no outline pass). */
  build(params: Record<string, number>, palette: PropPalette): ShapeSpec[];
}

/** A placed wall/floor style: template + params + palette, same shape as props. */
export interface TileInstance {
  id: string;
  name: string;
  templateId: string;
  params: Record<string, number>;
  palette: PropPalette;
}

export interface ProjectState {
  /** Schema version; see CURRENT_SCHEMA_VERSION and migrateProject(). */
  version: number;
  style: StyleSheet;
  stylePresets: StylePreset[];
  characters: CharacterRecipe[];
  props: PropInstance[];
  walls: TileInstance[];
  floors: TileInstance[];
  /**
   * Full-game character profiles, keyed by agentId (== a character recipe id).
   * Optional and sparse — a character need not have one. See core/profile.ts and
   * game-design-docs/the-water-cooler/docs/design/character_model.md.
   */
  profiles?: import('./profile').CharacterProfile[];
  /**
   * Authored run definitions, optional and sparse. A scenario composes the
   * project's characters/profiles/office into a loadable run. See core/scenario.ts
   * and game-design-docs/the-water-cooler/docs/design/scenario_model.md.
   */
  scenarios?: import('./scenario').Scenario[];
  /**
   * The reusable drive catalog — structured motivations personas reference by id.
   * See core/profile.ts (DriveDefinition) and CONTRACT.md.
   */
  drives: import('./profile').DriveDefinition[];
  /**
   * The reusable trait catalog — structured personality tags personas reference
   * by id (personality.traitTags). See core/profile.ts (TraitDefinition).
   */
  traits: import('./profile').TraitDefinition[];
  /**
   * The reusable relationship-type catalog — structured bond types a relationship
   * edge references by id (relationship.relationshipType). Each carries reaction
   * biases + an optional third-party (jealousy) coupling the sim applies. See
   * core/profile.ts (RelationshipTypeDefinition) and CONTRACT.md §3.7.
   */
  relationshipTypes: import('./profile').RelationshipTypeDefinition[];
  /**
   * The department catalog — structured, project-level org units (id/label/category)
   * the office-scale work references by stable id, the way drives/traits do. The
   * single department/org model (Epic 2 F2.1); the cascade fills it, layout groups
   * by it. See core/department.ts.
   */
  departments: import('./department').DepartmentDefinition[];
  /**
   * The reusable workplace-behavior catalog — observable actions (Steal Lunch,
   * Spread Rumor, …) the sim selects for agents under pressure. Tool authors the
   * catalog + constraints/couplings; the sim owns selection. See core/behavior.ts
   * (BehaviorDefinition) and CONTRACT.md §3.14. Exported verbatim as behaviors.json.
   */
  behaviors: import('./behavior').BehaviorDefinition[];
  /**
   * The generative company root (Epic 0) — the new-game seed whose culture/history
   * cascaded into the departments + people + relationships of this project. Optional:
   * present only for a generated company package; exported as `company.json` (F0.8).
   * The full editable form (with `Derived` climate wrappers) lives here; the export
   * flattens it. See core/company.ts.
   */
  company?: import('./company').Company;
  /** The scene canvas — persisted so hand-edits survive reloads. */
  scene?: import('./scene').SceneState;
  /**
   * The project-wide LOOK (core/look.ts) — a coordinated restyle applied at
   * EXPORT time over the authored palettes, NOT baked into them. Persisting the
   * choice (instead of a one-time destructive palette sweep) means every asset
   * refresh re-derives the same look; it can't silently drop when props/floors
   * are re-randomized. Absent ⇒ {@link DEFAULT_LOOK}. Authored palettes stay
   * vivid and editable in the tool; the look is a lens over them.
   */
  look?: LookId;
}

/**
 * A project-wide look (core/look.ts). `clinical` is the IRIS plan view —
 * desaturated architecture, thin uniform ink, no shadows (people stay warm,
 * Article VIII). `raw` is the authored palettes untouched (the vivid authoring
 * view). Applied at export/preview time; never baked into the stored palettes.
 */
export type LookId = 'raw' | 'clinical';
export const LOOKS: LookId[] = ['clinical', 'raw'];
/** The look a project exports as when it hasn't chosen one — the game's canonical floor. */
export const DEFAULT_LOOK: LookId = 'clinical';

/**
 * Current project/export schema version. Lives here (a dependency-free module)
 * so both the defaults and the migration code can read it without a cycle.
 * Bump it and add an ordered step in migrateProject() on any breaking shape
 * change. v2 reconciled the manager recipe id to the game's AgentId.
 * v3 added the optional `profiles` collection (full-game character personas).
 * v4 added the optional `scenarios` collection (authored run definitions).
 * v5 moved starting beliefs/knowledge out of personas into scenarios (the
 * persona↔scenario boundary); the step strips the legacy persona fields.
 * v6 added the reusable `drives` catalog; personas now reference drive ids.
 * v7 added the reusable `traits` catalog; persona traitTags are trait ids.
 * v8 added render-style contactShadow + ambientTint fields.
 * v9 added the reusable `relationshipTypes` catalog (bond types carrying reaction
 * biases + a third-party jealousy coupling); relationship edges reference its ids
 * and gain an optional `secret` flag.
 * v10 added the project-level `departments` catalog (Epic 2 F2.1 — structured org
 * units with stable ids); seeded from the existing department-name set.
 * v11 made persona `identity.department` a department-catalog **id** (Epic 3 F3.1,
 * mutable for the sim's transfer tier); the step rewrites free-text values to ids.
 * v12 added the optional `company` root (Epic 0 F0.8 — the generated company a
 * package is built around); additive, so the step only bumps the version.
 * v13 added the reusable `behaviors` catalog (workplace behaviors — observable
 * actions the sim selects under pressure); seeded from DEFAULT_BEHAVIORS, additive.
 * v14 added the per-character `presence` layer (steady-state + transition-signature
 * motion dispositions — how a body occupies space, docs/presence-profile.md);
 * derived from the personality spine, so old saves get a coherent default for free.
 * v15 added the optional per-character `presenceMoods` map (how a body physically
 * expresses each mood — sparse deltas over the baseline presence, §5.8); additive,
 * absent ⇒ no mood-specific modulation, so the step only bumps the version.
 * v16 added the exported `symbol-registry.json` (every symbol id → register /
 * provenance / mirrors, register-constitution.md) and the human-register
 * `reaction-*` icon family. Derived at export from code-owned vocabularies —
 * nothing is stored in the project, so the step only bumps the version.
 * v17 added the pose layer (social-theater-presentation-experiment.md Appendix
 * B/C): per-character `poses@Nx.png` + `poses-atlas@Nx.json` (8 held states ×
 * 4 facings), the project-level `pose-catalog.json` (vocabulary + presence
 * couplings; the beat-schedule contract's tool half), and the shoulderLeft /
 * shoulderRight / hip rig anchors. A pose is a sim-selected state — never in
 * the recipe — so nothing is stored in the project; version bump only.
 * v18 added renderings (register-constitution.md Article VIII as amended):
 * per-character `unit@Nx.png` + `unit-atlas@Nx.json` (operational-unit floor
 * rendering), `portrait@Nx.png` (corporate-identity badge photo), and a
 * derived `renderings.unit` palette in exported recipe.json + layer manifests.
 * All derived from the identity at export; version bump only.
 */
export const CURRENT_SCHEMA_VERSION = 18;

/** Design-space canvas size. Parts are authored against this; never changes. */
export const CANVAS = 128;
