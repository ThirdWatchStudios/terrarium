import type { PropTemplate } from '../core/types';
import { authoredPropShapes } from './authoredArt';
import { DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS } from './departmentMachineManifest';

/**
 * Canonical template registration for the owner-accepted Priority 1 department
 * machine family. Final gameplay footprints remain suggestions in the exported
 * department catalog; these values provide coherent Terrarium baking defaults.
 */
export const DEPARTMENT_MACHINE_TEMPLATES: readonly PropTemplate[] =
  DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    projection: definition.projection,
    ...(definition.placement ? { placement: definition.placement } : {}),
    gridFootprint: { ...definition.gridFootprint },
    ...(definition.gridPivot ? { gridPivot: { ...definition.gridPivot } } : {}),
    ...(definition.footprint ? { footprint: { ...definition.footprint } } : {}),
    params: definition.params.map((param) => ({ ...param })),
    build(params) {
      return authoredPropShapes(definition.id, params);
    },
  }));
