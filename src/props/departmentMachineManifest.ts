import type {
  Projection,
  PropInstance,
  PropPalette,
  PropParamDef,
  PropPlacement,
} from '../core/types';

export const DEPARTMENT_MACHINE_FAMILY_ID = 'quota-co-administrative-percussion-v1';
export const DEPARTMENT_ASSET_CATALOG_VERSION = 3;

export const DEPARTMENT_MACHINE_PALETTE: PropPalette = {
  primary: '#D9D0B9',
  secondary: '#294B3C',
  accent: '#4E7D79',
};

export type DepartmentFillState = 'empty' | 'low' | 'high' | 'overflowing';
export type DepartmentAuthoredFacing = 'horizontal' | 'vertical';
export type DepartmentAssetState = DepartmentFillState | DepartmentAuthoredFacing;
export type DepartmentWorkTypeStamp =
  | 'raw_records'
  | 'structured_data'
  | 'findings'
  | 'reports'
  | 'requirements'
  | 'specifications'
  | 'code'
  | 'release'
  | 'repairs'
  | 'personnel_actions'
  | 'supplies'
  | 'applications'
  | 'determinations';

export const DEPARTMENT_HAND_CARRIED_TEMPLATE_IDS = ['pay_envelope'] as const;

export interface DepartmentMachineVariantDefinition {
  readonly key: string;
  readonly sourceFile: string;
  readonly propInstanceId: string;
  readonly displayName: string;
  readonly params: Readonly<Record<string, number>>;
  readonly state?: DepartmentAssetState;
}

export interface DepartmentMachineTemplateDefinition {
  readonly id: string;
  readonly label: string;
  readonly projection: Projection;
  readonly placement?: PropPlacement;
  readonly gridFootprint: { readonly w: number; readonly h: number };
  readonly gridPivot?: { readonly x: number; readonly y: number };
  readonly footprint?: { readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number };
  readonly params: readonly PropParamDef[];
  readonly variants: readonly DepartmentMachineVariantDefinition[];
  readonly placeable: boolean;
  readonly interactionType?: string;
}

const stateVariants = (
  templateId: string,
  label: string,
  states: readonly DepartmentFillState[],
): DepartmentMachineVariantDefinition[] => states.map((state, index) => ({
  key: `fill=${index}`,
  sourceFile: `${templateId}--${state}.svg`,
  propInstanceId: `prop-${templateId}-${state}`,
  displayName: `${label} (${state})`,
  params: { fill: index },
  state,
}));

const authoredFacingVariants = (
  templateId: string,
  label: string,
): DepartmentMachineVariantDefinition[] => ([
  {
    key: 'facing=0',
    sourceFile: `${templateId}--horizontal.svg`,
    propInstanceId: `prop-${templateId}-horizontal`,
    displayName: `${label} — horizontal`,
    params: { facing: 0 },
    state: 'horizontal',
  },
  {
    key: 'facing=1',
    sourceFile: `${templateId}--vertical.svg`,
    propInstanceId: `prop-${templateId}-vertical`,
    displayName: `${label} — vertical`,
    params: { facing: 1 },
    state: 'vertical',
  },
]);

const staticVariant = (
  templateId: string,
  label: string,
): DepartmentMachineVariantDefinition => ({
  key: '',
  sourceFile: `${templateId}.svg`,
  propInstanceId: `prop-${templateId}`,
  displayName: label,
  params: {},
});

const fillParam = (max: number): readonly PropParamDef[] => [{
  key: 'fill',
  label: 'Baked fill state',
  min: 0,
  max,
  step: 1,
  default: 0,
}];

const authoredFacingParam: readonly PropParamDef[] = [{
  key: 'facing',
  label: 'Authored facing',
  min: 0,
  max: 1,
  step: 1,
  default: 0,
}];

/**
 * The accepted original inventory plus the farm-form Priority 1 addendum. Footprints are exported as
 * suggestions: the sim owns final placement/collision tuning. The 128u source
 * frame remains two post-rescale gameplay cells on each axis.
 */
export const DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS:
readonly DepartmentMachineTemplateDefinition[] = [
  {
    id: 'loading_dock',
    label: 'Loading Dock',
    projection: 'elevation',
    gridFootprint: { w: 3, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 56, ry: 5 },
    params: fillParam(2),
    variants: stateVariants('loading_dock', 'Loading Dock', ['empty', 'low', 'high']),
    placeable: true,
    interactionType: 'loading_dock',
  },
  {
    id: 'sorting_frame',
    label: 'Sorting Frame',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 52, ry: 5 },
    params: [],
    variants: [staticVariant('sorting_frame', 'Sorting Frame')],
    placeable: true,
    interactionType: 'sorting_frame',
  },
  {
    id: 'franking_machine',
    label: 'Franking Machine',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 36, ry: 4 },
    params: [],
    variants: [staticVariant('franking_machine', 'Franking Machine')],
    placeable: true,
    interactionType: 'franking_machine',
  },
  {
    id: 'keypunch_bank',
    label: 'Keypunch Bank',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('keypunch_bank', 'Keypunch Bank')],
    // Retained for old saves/export resolution; farms place one console per seat.
    placeable: false,
    interactionType: 'keypunch_bank',
  },
  {
    id: 'keypunch_console',
    label: 'Keypunch Console',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 32, ry: 4 },
    params: [],
    variants: [staticVariant('keypunch_console', 'Keypunch Console')],
    placeable: true,
    interactionType: 'keypunch_console',
  },
  {
    id: 'cubicle_partition_straight',
    label: 'Cubicle Partition — Straight',
    projection: 'elevation',
    placement: 'cell-edge-furniture-slot',
    gridFootprint: { w: 1, h: 1 },
    params: authoredFacingParam,
    variants: authoredFacingVariants('cubicle_partition_straight', 'Cubicle Partition — Straight'),
    placeable: true,
  },
  {
    id: 'cubicle_partition_corner',
    label: 'Cubicle Partition — Corner',
    projection: 'elevation',
    placement: 'cell-corner-furniture-slot',
    gridFootprint: { w: 1, h: 1 },
    params: [],
    variants: [staticVariant('cubicle_partition_corner', 'Cubicle Partition — Corner')],
    placeable: true,
  },
  {
    id: 'cubicle_partition_endcap',
    label: 'Cubicle Partition — End-cap',
    projection: 'elevation',
    placement: 'cell-edge-furniture-slot',
    gridFootprint: { w: 1, h: 1 },
    params: authoredFacingParam,
    variants: authoredFacingVariants('cubicle_partition_endcap', 'Cubicle Partition — End-cap'),
    placeable: true,
  },
  {
    id: 'adjudication_desk_set',
    label: 'Adjudication Desk Set',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 32, ry: 4 },
    params: [],
    variants: [staticVariant('adjudication_desk_set', 'Adjudication Desk Set')],
    placeable: true,
    interactionType: 'adjudication_desk_set',
  },
  {
    id: 'docket_rack',
    label: 'Docket Rack',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 33, ry: 4 },
    params: fillParam(3),
    variants: stateVariants('docket_rack', 'Docket Rack', ['empty', 'low', 'high', 'overflowing']),
    placeable: true,
    interactionType: 'docket_rack',
  },
  {
    id: 'tabulating_machine',
    label: 'Tabulating Machine',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('tabulating_machine', 'Tabulating Machine')],
    placeable: true,
    interactionType: 'tabulating_machine',
  },
  {
    id: 'intake_tray_small',
    label: 'Intake Tray — Small',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 34, ry: 4 },
    params: fillParam(3),
    variants: stateVariants('intake_tray_small', 'Intake Tray — Small', ['empty', 'low', 'high', 'overflowing']),
    placeable: true,
    interactionType: 'intake_tray_small',
  },
  {
    id: 'intake_tray_large',
    label: 'Intake Tray — Large',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 34, ry: 4 },
    params: fillParam(3),
    variants: stateVariants('intake_tray_large', 'Intake Tray — Large', ['empty', 'low', 'high', 'overflowing']),
    placeable: true,
    interactionType: 'intake_tray_large',
  },
  {
    id: 'dispatch_station',
    label: 'Dispatch Station',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 36, ry: 4 },
    params: fillParam(3),
    variants: stateVariants('dispatch_station', 'Dispatch Station', ['empty', 'low', 'high', 'overflowing']),
    placeable: true,
    interactionType: 'dispatch_station',
  },
  {
    id: 'pneumatic_dispatch_node',
    label: 'Pneumatic Dispatch Node',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 30, ry: 4 },
    params: [],
    variants: [staticVariant('pneumatic_dispatch_node', 'Pneumatic Dispatch Node')],
    placeable: true,
    interactionType: 'pneumatic_dispatch_node',
  },
  {
    id: 'tube_straight',
    label: 'Pneumatic Tube — Straight',
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [],
    variants: [staticVariant('tube_straight', 'Pneumatic Tube — Straight')],
    placeable: true,
  },
  {
    id: 'tube_corner',
    label: 'Pneumatic Tube — Corner',
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [],
    variants: [staticVariant('tube_corner', 'Pneumatic Tube — Corner')],
    placeable: true,
  },
  {
    id: 'tube_wallpass',
    label: 'Pneumatic Tube — Wall Pass',
    projection: 'elevation',
    placement: 'wall-slot',
    gridFootprint: { w: 1, h: 1 },
    params: [],
    variants: [staticVariant('tube_wallpass', 'Pneumatic Tube — Wall Pass')],
    placeable: true,
  },
  {
    id: 'tube_riser',
    label: 'Pneumatic Tube — Station Riser',
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [],
    variants: [staticVariant('tube_riser', 'Pneumatic Tube — Station Riser')],
    placeable: true,
  },
  {
    id: 'canister_base',
    label: 'Work Canister',
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [],
    variants: [staticVariant('canister_base', 'Work Canister')],
    placeable: false,
  },
  {
    id: 'delivery_uplink',
    label: 'Delivery Uplink',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('delivery_uplink', 'Delivery Uplink')],
    placeable: true,
    interactionType: 'delivery_uplink',
  },
  {
    id: 'calculating_engine',
    label: 'Calculating Engine',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('calculating_engine', 'Calculating Engine')],
    placeable: true,
    interactionType: 'calculating_engine',
  },
  {
    id: 'comparator',
    label: 'Comparator',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('comparator', 'Comparator')],
    placeable: true,
    interactionType: 'comparator',
  },
  {
    id: 'rotary_duplicator',
    label: 'Rotary Duplicator',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('rotary_duplicator', 'Rotary Duplicator')],
    placeable: true,
    interactionType: 'rotary_duplicator',
  },
  {
    id: 'binding_press',
    label: 'Binding Press',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 46, ry: 5 },
    params: [],
    variants: [staticVariant('binding_press', 'Binding Press')],
    placeable: true,
    interactionType: 'binding_press',
  },
  {
    id: 'verification_comparator',
    label: 'Verification Comparator',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('verification_comparator', 'Verification Comparator')],
    placeable: true,
    interactionType: 'verification_comparator',
  },
  {
    id: 'manifest_press',
    label: 'Manifest Press',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 46, ry: 5 },
    params: [],
    variants: [staticVariant('manifest_press', 'Manifest Press')],
    placeable: true,
    interactionType: 'manifest_press',
  },
  {
    id: 'terminal_bank',
    label: 'Terminal Bank',
    projection: 'elevation',
    gridFootprint: { w: 3, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('terminal_bank', 'Terminal Bank')],
    placeable: true,
    interactionType: 'terminal_bank',
  },
  {
    id: 'compiler_press',
    label: 'Compiler Press',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('compiler_press', 'Compiler Press')],
    placeable: true,
    interactionType: 'compiler_press',
  },
  {
    id: 'parts_crib',
    label: 'Parts Crib',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('parts_crib', 'Parts Crib')],
    placeable: true,
    interactionType: 'parts_crib',
  },
  {
    id: 'workbench',
    label: 'Workbench',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('workbench', 'Workbench')],
    placeable: true,
    interactionType: 'workbench',
  },
  {
    id: 'records_cabinet',
    label: 'Records Cabinet',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('records_cabinet', 'Records Cabinet')],
    placeable: true,
    interactionType: 'records_cabinet',
  },
  {
    id: 'badge_press',
    label: 'Badge Press',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 46, ry: 5 },
    params: [],
    variants: [staticVariant('badge_press', 'Badge Press')],
    placeable: true,
    interactionType: 'badge_press',
  },
  {
    id: 'ledger_engine',
    label: 'Ledger Engine',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('ledger_engine', 'Ledger Engine')],
    placeable: true,
    interactionType: 'ledger_engine',
  },
  {
    id: 'envelope_press',
    label: 'Envelope Press',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 46, ry: 5 },
    params: [],
    variants: [staticVariant('envelope_press', 'Envelope Press')],
    placeable: true,
    interactionType: 'envelope_press',
  },
  {
    id: 'requisition_counter',
    label: 'Requisition Counter',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('requisition_counter', 'Requisition Counter')],
    placeable: true,
    interactionType: 'requisition_counter',
  },
  {
    id: 'stock_shelving',
    label: 'Stock Shelving',
    projection: 'elevation',
    gridFootprint: { w: 2, h: 2 },
    footprint: { cx: 64, cy: 117, rx: 58, ry: 5 },
    params: [],
    variants: [staticVariant('stock_shelving', 'Stock Shelving')],
    placeable: true,
    interactionType: 'stock_shelving',
  },
  {
    id: 'pay_envelope',
    label: 'Pay Envelope',
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [],
    variants: [staticVariant('pay_envelope', 'Pay Envelope')],
    placeable: false,
  },
] as const;

export const DEPARTMENT_STAMP_DEFINITIONS = [
  {
    id: 'raw_records',
    displayName: 'Raw Records',
    sourceFile: 'canister_stamp_raw_records.svg',
    exportDirectory: 'department-overlays/raw_records',
  },
  {
    id: 'structured_data',
    displayName: 'Structured Data',
    sourceFile: 'canister_stamp_structured_data.svg',
    exportDirectory: 'department-overlays/structured_data',
  },
  {
    id: 'findings',
    displayName: 'Findings',
    sourceFile: 'canister_stamp_findings.svg',
    exportDirectory: 'department-overlays/findings',
  },
  {
    id: 'reports',
    displayName: 'Reports',
    sourceFile: 'canister_stamp_reports.svg',
    exportDirectory: 'department-overlays/reports',
  },
  {
    id: 'requirements',
    displayName: 'Requirements',
    sourceFile: 'canister_stamp_requirements.svg',
    exportDirectory: 'department-overlays/requirements',
  },
  {
    id: 'specifications',
    displayName: 'Specifications',
    sourceFile: 'canister_stamp_specifications.svg',
    exportDirectory: 'department-overlays/specifications',
  },
  {
    id: 'code',
    displayName: 'Code',
    sourceFile: 'canister_stamp_code.svg',
    exportDirectory: 'department-overlays/code',
  },
  {
    id: 'release',
    displayName: 'Release',
    sourceFile: 'canister_stamp_release.svg',
    exportDirectory: 'department-overlays/release',
  },
  {
    id: 'repairs',
    displayName: 'Repairs',
    sourceFile: 'canister_stamp_repairs.svg',
    exportDirectory: 'department-overlays/repairs',
  },
  {
    id: 'personnel_actions',
    displayName: 'Personnel Actions',
    sourceFile: 'canister_stamp_personnel_actions.svg',
    exportDirectory: 'department-overlays/personnel_actions',
  },
  {
    id: 'supplies',
    displayName: 'Supplies',
    sourceFile: 'canister_stamp_supplies.svg',
    exportDirectory: 'department-overlays/supplies',
  },
  {
    id: 'applications',
    displayName: 'Applications',
    sourceFile: 'canister_stamp_applications.svg',
    exportDirectory: 'department-overlays/applications',
  },
  {
    id: 'determinations',
    displayName: 'Determinations',
    sourceFile: 'canister_stamp_determinations.svg',
    exportDirectory: 'department-overlays/determinations',
  },
] as const satisfies ReadonlyArray<{
  id: DepartmentWorkTypeStamp;
  displayName: string;
  sourceFile: string;
  exportDirectory: string;
}>;

export const DEPARTMENT_MACHINE_DEFAULT_PROPS: readonly PropInstance[] =
  DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS.flatMap((template) =>
    template.variants.map((variant) => ({
      id: variant.propInstanceId,
      name: variant.displayName,
      templateId: template.id,
      params: { ...variant.params },
      palette: { ...DEPARTMENT_MACHINE_PALETTE },
    })));

export const DEPARTMENT_MACHINE_TEMPLATE_IDS =
  DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS.map(({ id }) => id);
