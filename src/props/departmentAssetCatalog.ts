import { CURRENT_SCHEMA_VERSION } from '../core/types';
import {
  DEPARTMENT_ASSET_CATALOG_VERSION,
  DEPARTMENT_HAND_CARRIED_TEMPLATE_IDS,
  DEPARTMENT_MACHINE_FAMILY_ID,
  DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS,
  DEPARTMENT_STAMP_DEFINITIONS,
} from './departmentMachineManifest';

const EXPORT_SCALES = [1, 2, 4] as const;
const HAND_CARRIED_IDS = new Set<string>(DEPARTMENT_HAND_CARRIED_TEMPLATE_IDS);

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unnamed';
}

const SOCKETS: Readonly<Record<string, readonly string[]>> = {
  tube_straight: ['west', 'east'],
  tube_corner: ['west', 'south'],
  tube_wallpass: ['west', 'east'],
  tube_riser: ['west', 'east'],
  pneumatic_dispatch_node: ['west', 'east'],
  intake_tray_small: ['west'],
  intake_tray_large: ['west'],
  dispatch_station: ['east'],
};

export function departmentAssetCatalogJson() {
  return {
    kind: 'department-assets' as const,
    version: DEPARTMENT_ASSET_CATALOG_VERSION,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    family: {
      id: DEPARTMENT_MACHINE_FAMILY_ID,
      direction: 'administrative-percussion',
      standardizedSku: true,
      worldSpriteOnly: true,
    },
    footprintPolicy: 'suggested' as const,
    sourceCanvas: 128,
    logicalCell: {
      sourceMin: 32,
      sourceMax: 96,
      sourceSpan: 64,
    },
    facilities: DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS
      .filter((template) => !HAND_CARRIED_IDS.has(template.id))
      .map((template) => ({
        id: template.id,
        templateId: template.id,
        displayName: template.label,
        projection: template.projection,
        placement: template.placement ?? 'floor',
        placeable: template.placeable,
        footprintStatus: 'suggested' as const,
        suggestedFootprint: { ...template.gridFootprint },
        gridPivot: template.gridPivot ?? { x: 0.5, y: 0.5 },
        ...(template.interactionType ? { interactionType: template.interactionType } : {}),
        ...(SOCKETS[template.id]
          ? { routeSockets: SOCKETS[template.id].map((direction) => ({ direction })) }
          : {}),
        ...(template.id === 'loading_dock'
          ? {
              occupancy: {
                kind: 'mixed' as const,
                rows: [
                  ['blocking', 'blocking', 'blocking'],
                  ['walkable', 'walkable', 'walkable'],
                ],
                note: 'Pallet edge blocks; apron remains walkable. Sim may adjust.',
              },
            }
          : {}),
        defaultPropInstanceId: template.variants[0].propInstanceId,
        states: template.variants.map((variant) => ({
          id: variant.state ?? 'default',
          propInstanceId: variant.propInstanceId,
          propDirectory: `props/${slug(variant.displayName)}`,
          sprites: EXPORT_SCALES.map((scale) => `props/${slug(variant.displayName)}/sprite@${scale}x.png`),
        })),
      })),
    tube: {
      outerDiameter: 28,
      linerDiameter: 22,
      lumenDiameter: 16,
      canisterDiameter: 10,
      radialClearance: 3,
      sockets: {
        west: { x: 32, y: 64 },
        east: { x: 96, y: 64 },
        south: { x: 64, y: 96 },
      },
      joinRule: 'exact-butt-at-adjacent-cell-boundary',
      floorRunBlocksWalk: true,
      wallPassOwnsWallCell: true,
    },
    canister: {
      baseTemplateId: 'canister_base',
      basePropInstanceId: 'prop-canister_base',
      overlayComposition: 'base-plus-one-work-type-stamp',
      stamps: DEPARTMENT_STAMP_DEFINITIONS.map((stamp) => ({
        workType: stamp.id,
        displayName: stamp.displayName,
        sourceSvg: `${stamp.exportDirectory}/overlay.svg`,
        overlays: EXPORT_SCALES.map((scale) => `${stamp.exportDirectory}/overlay@${scale}x.png`),
      })),
    },
    handCarriedItems: DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS
      .filter((template) => HAND_CARRIED_IDS.has(template.id))
      .map((template) => {
        const variant = template.variants[0];
        return {
          id: template.id,
          templateId: template.id,
          displayName: template.label,
          transport: 'hand-carried' as const,
          pneumaticCompatible: false,
          placeable: false,
          propInstanceId: variant.propInstanceId,
          propDirectory: `props/${slug(variant.displayName)}`,
          sprites: EXPORT_SCALES.map((scale) =>
            `props/${slug(variant.displayName)}/sprite@${scale}x.png`),
        };
      }),
  };
}
