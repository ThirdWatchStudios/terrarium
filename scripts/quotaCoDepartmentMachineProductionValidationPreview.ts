import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeProp } from '../src/core/compositor';
import { DEFAULT_PROPS, DEFAULT_STYLE } from '../src/data/defaults';
import { departmentAssetCatalogJson } from '../src/props/departmentAssetCatalog';
import { DEPARTMENT_MACHINE_DEFAULT_PROPS } from '../src/props/departmentMachineManifest';

const OUTPUT = 'docs/previews/quota-co-department-machine-production-validation-v1';
const INK = '#252A28';
const GREEN = '#294B3C';
const TEAL = '#4E7D79';
const CREAM = '#D9D0B9';
const FLOOR = '#B9B4A8';

function escape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function prop(id: string): string {
  const instance = DEPARTMENT_MACHINE_DEFAULT_PROPS.find((item) => item.id === id)
    ?? DEFAULT_PROPS.find((item) => item.id === id);
  if (!instance) throw new Error(`Missing production prop ${id}`);
  return inner(composeProp(instance, DEFAULT_STYLE));
}

function placed(id: string, x: number, y: number, size: number): string {
  return `<g transform="translate(${x} ${y}) scale(${size / 128})">${prop(id)}</g>`;
}

function label(value: string, x: number, y: number, size = 16, anchor = 'start'): string {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" ` +
    `font-weight="700" fill="${INK}" text-anchor="${anchor}">${escape(value)}</text>`;
}

function room(x: number, y: number, width: number, height: number, title: string): string {
  return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" fill="${FLOOR}" ` +
    `stroke="${INK}" stroke-width="8"/><path d="M ${x + 10} ${y + 34} H ${x + width - 10}" ` +
    `stroke="${CREAM}" stroke-width="4"/>${label(title, x + 18, y + 27, 14)}</g>`;
}

function productionRoute(): string {
  const ids = ['prop-tube_straight', 'prop-tube_straight', 'prop-tube_wallpass', 'prop-tube_riser'];
  return ids.map((id, index) =>
    `<g transform="translate(${index * 64 - 32} 0)">${prop(id)}</g>`
  ).join('');
}

function composedOfficeSvg(): string {
  const width = 1500;
  const height = 1020;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#EEEAE0"/>`,
    label('QuotaCo department layer · Priority 1 production composition', 54, 48, 26),
    label('Owner-accepted B control · canonical imported sprites · post-rescale grid', 54, 76, 14),
    room(48, 108, 440, 500, 'INTAKE'),
    room(530, 108, 440, 500, 'DATA PROCESSING'),
    room(1012, 108, 440, 500, 'DELIVERY'),
    placed('prop-loading_dock-high', 64, 158, 184),
    placed('prop-sorting_frame', 262, 146, 190),
    placed('prop-franking_machine', 92, 366, 126),
    placed('prop-intake_tray_small-high', 270, 378, 126),
    placed('prop-keypunch_bank', 554, 154, 192),
    placed('prop-tabulating_machine', 760, 150, 192),
    placed('prop-intake_tray_large-low', 568, 376, 128),
    placed('prop-dispatch_station-high', 760, 378, 128),
    placed('prop-pneumatic_dispatch_node', 858, 376, 128),
    placed('prop-delivery_uplink', 1058, 176, 254),
    placed('prop-canister_base', 1308, 424, 104),
    label('raw records → structured data', 1080, 546, 15),
    `<rect x="48" y="640" width="1404" height="310" rx="12" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>`,
    label('PNEUMATIC ROUTE · PRODUCTION COMPOSITOR', 72, 688, 15),
    `<g transform="translate(160 660) scale(2.2)">${productionRoute()}</g>`,
    label('28u outer / 22u liner / 16u lumen / 10u canister', 780, 746, 16),
    label('butt sockets meet continuously at 64u cell pitch', 780, 780, 16),
    label('fill states are baked variants', 780, 838, 15),
    label('footprints remain suggested', 780, 870, 15),
    `<circle cx="752" cy="741" r="7" fill="${GREEN}"/><circle cx="752" cy="775" r="7" fill="${TEAL}"/>`,
    label('No product UI, amber/rose status accents, camera cues, wear, or baked clutter.', 54, 992, 14),
    '</svg>',
  ].join('');
}

function farmFormPriorityOneSvg(): string {
  const width = 1560;
  const height = 920;
  const horizontalRun = Array.from({ length: 5 }, (_, index) =>
    placed('prop-cubicle_partition_straight-horizontal', 118 + index * 64, 274, 128)
  ).join('');
  const verticalRun = Array.from({ length: 5 }, (_, index) =>
    placed('prop-cubicle_partition_straight-vertical', 492, 126 + index * 64, 128)
  ).join('');
  const isolatedHorizontalRun = Array.from({ length: 5 }, (_, index) =>
    placed('prop-cubicle_partition_straight-horizontal', 1028 + index * 64, 190, 128)
  ).join('');
  const isolatedVerticalRun = Array.from({ length: 4 }, (_, index) =>
    placed('prop-cubicle_partition_straight-vertical', 1200, 404 + index * 64, 128)
  ).join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#EEEAE0"/>`,
    label('QuotaCo farm-form Priority 1 · production composition', 42, 48, 26),
    label('Canonical imported sprites · authored H/V baffles · one conversion station per staffed seat', 42, 76, 14),
    room(36, 112, 930, 660, 'DATA PROCESSING FARM'),
    horizontalRun,
    verticalRun,
    placed('prop-cubicle_partition_endcap-horizontal', 54, 274, 128),
    placed('prop-cubicle_partition_endcap-vertical', 492, 446, 128),
    placed('prop-cubicle_partition_corner', 492, 274, 128),
    placed('prop-keypunch_console', 96, 148, 158),
    placed('prop-keypunch_console', 284, 148, 158),
    placed('prop-keypunch_console', 96, 404, 158),
    placed('prop-keypunch_console', 284, 404, 158),
    placed('prop-tabulating_machine', 654, 194, 220),
    placed('prop-dispatch_station-low', 694, 482, 132),
    label('per-seat conversion', 266, 716, 13, 'middle'),
    label('shared collector + dispatch', 758, 716, 13, 'middle'),
    `<rect x="1002" y="112" width="522" height="660" rx="12" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>`,
    label('EDGE-SLOT PARITY', 1028, 154, 14),
    label('horizontal · shared endpoint beam', 1028, 192, 14),
    isolatedHorizontalRun,
    label('vertical · feet beneath continuous top strip', 1028, 422, 14),
    isolatedVerticalRun,
    label('Authored variants; no runtime quarter-turn.', 1028, 748, 14),
    label('Keypunch Bank remains export-resolvable for old saves but is no longer builder-placeable.', 42, 866, 14),
    '</svg>',
  ].join('');
}

function farmFormPriorityTwoSvg(): string {
  const width = 1560;
  const height = 920;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#EEEAE0"/>`,
    label('QuotaCo farm-form Priority 2 · production composition', 42, 48, 26),
    label('Canonical imported sprites · one Approvals conversion station per staffed seat · baked collector states', 42, 76, 14),
    room(36, 112, 980, 660, 'APPROVALS FARM'),
    placed('prop-intake_tray_large-high', 62, 168, 154),
    placed('prop-adjudication_desk_set', 256, 162, 166),
    placed('prop-adjudication_desk_set', 448, 162, 166),
    placed('prop-adjudication_desk_set', 640, 162, 166),
    placed('prop-adjudication_desk_set', 256, 398, 166),
    placed('prop-adjudication_desk_set', 448, 398, 166),
    placed('prop-adjudication_desk_set', 640, 398, 166),
    placed('prop-docket_rack-high', 824, 226, 176),
    placed('prop-dispatch_station-high', 824, 470, 132),
    label('applications in', 139, 356, 13, 'middle'),
    label('determinations aggregate', 902, 430, 13, 'middle'),
    label('determinations out', 890, 630, 13, 'middle'),
    `<rect x="1050" y="112" width="474" height="660" rx="12" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>`,
    label('DOCKET RACK · BAKED STATES', 1076, 154, 14),
    placed('prop-docket_rack-empty', 1074, 180, 126),
    placed('prop-docket_rack-low', 1244, 180, 126),
    placed('prop-docket_rack-high', 1074, 390, 126),
    placed('prop-docket_rack-overflowing', 1244, 390, 126),
    label('empty', 1137, 328, 12, 'middle'),
    label('low', 1307, 328, 12, 'middle'),
    label('high', 1137, 538, 12, 'middle'),
    label('overflowing', 1307, 538, 12, 'middle'),
    label('applications + determinations use transparent stamps over canister_base.', 1076, 646, 13),
    label('No runtime tint, product UI, or animation frame contract is inferred.', 1076, 682, 13),
    label('Partition replacement remains a separate review-only refinement; current production sprites stay stable.', 42, 866, 14),
    '</svg>',
  ].join('');
}

function phaseASpineSvg(): string {
  const width = 1840;
  const height = 880;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#EEEAE0"/>`,
    label('QuotaCo department layer · Priority 2 Phase A production composition', 42, 48, 26),
    label('Registered compositor pixels · suggested footprints · static animation contract deferred', 42, 76, 14),
    room(36, 112, 420, 520, 'ANALYSIS'),
    room(484, 112, 420, 520, 'DOCUMENTATION'),
    room(932, 112, 420, 520, 'AUDIT'),
    room(1380, 112, 420, 520, 'DISPATCH'),
    placed('prop-calculating_engine', 64, 166, 174),
    placed('prop-comparator', 260, 166, 174),
    placed('prop-intake_tray_small-low', 80, 422, 122),
    placed('prop-dispatch_station-low', 276, 422, 122),
    placed('prop-rotary_duplicator', 512, 166, 174),
    placed('prop-binding_press', 708, 166, 174),
    placed('prop-intake_tray_small-low', 528, 422, 122),
    placed('prop-dispatch_station-high', 724, 422, 122),
    placed('prop-conference-table', 960, 166, 174),
    placed('prop-verification_comparator', 1156, 166, 174),
    placed('prop-intake_tray_small-low', 976, 422, 122),
    placed('prop-dispatch_station-low', 1172, 422, 122),
    placed('prop-manifest_press', 1404, 164, 154),
    placed('prop-pneumatic_dispatch_node', 1572, 170, 154),
    placed('prop-delivery_uplink', 1498, 350, 232),
    label('findings', 246, 594, 13, 'middle'),
    label('reports', 694, 594, 13, 'middle'),
    label('reports · Review Table reused', 1142, 594, 13, 'middle'),
    label('requirements / SOW', 1590, 594, 13, 'middle'),
    `<rect x="36" y="666" width="1764" height="158" rx="12" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>`,
    label('STATIC ACCEPTANCE', 62, 706, 14),
    label('Six canonical SKUs and three canister overlays now travel through the shared browser/headless export path.', 62, 742, 15),
    label('Pollution readability remains a deferred machine-animation problem; no glow, haze, meters, or inferred frame names ship here.', 62, 778, 15),
    '</svg>',
  ].join('');
}

function phaseBEngineeringMaintenanceSvg(): string {
  const width = 1260;
  const height = 820;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#EEEAE0"/>`,
    label('QuotaCo department layer · Priority 3A Phase B production composition', 42, 48, 26),
    label('Registered compositor pixels · Terminal Bank 3×2 suggested · machine animation deferred', 42, 76, 14),
    room(36, 112, 570, 520, 'ENGINEERING'),
    room(654, 112, 570, 520, 'MAINTENANCE'),
    placed('prop-terminal_bank', 72, 164, 230),
    placed('prop-compiler_press', 350, 186, 184),
    placed('prop-intake_tray_small-low', 84, 430, 122),
    placed('prop-dispatch_station-high', 432, 430, 122),
    label('specifications → code', 321, 594, 13, 'middle'),
    placed('prop-parts_crib', 694, 186, 184),
    placed('prop-workbench', 956, 186, 184),
    placed('prop-intake_tray_small-low', 702, 430, 122),
    placed('prop-dispatch_station-low', 1080, 430, 122),
    label('repairs → internal machine consumption', 939, 594, 13, 'middle'),
    `<rect x="36" y="666" width="1188" height="108" rx="12" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>`,
    label('STATIC ACCEPTANCE', 62, 706, 14),
    label('Four canonical SKUs and four stamp overlays use the shared browser/headless export path; release remains a Documentation control.', 62, 742, 14),
    '</svg>',
  ].join('');
}

function phaseCInternalServicesSvg(): string {
  const width = 1840;
  const height = 880;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#EEEAE0"/>`,
    label('QuotaCo department layer · Priority 3B Phase C production composition', 42, 48, 26),
    label('Registered compositor pixels · hand-carried payday law · machine animation deferred', 42, 76, 14),
    room(36, 112, 532, 520, 'PERSONNEL'),
    room(604, 112, 532, 520, 'PAYROLL'),
    room(1172, 112, 632, 520, 'SUPPLY'),
    placed('prop-records_cabinet', 66, 166, 180),
    placed('prop-badge_press', 292, 166, 180),
    placed('prop-dispatch_station-low', 388, 422, 122),
    label('personnel actions → staffing', 302, 594, 13, 'middle'),
    placed('prop-ledger_engine', 634, 166, 180),
    placed('prop-envelope_press', 860, 166, 180),
    placed('prop-pay_envelope', 760, 424, 122),
    placed('prop-pay_envelope', 880, 438, 94),
    label('pay envelopes walked to employees · never tubed', 870, 594, 13, 'middle'),
    placed('prop-requisition_counter', 1204, 166, 180),
    placed('prop-stock_shelving', 1430, 166, 180),
    placed('prop-dispatch_station-high', 1644, 422, 122),
    label('supplies → desks + machines', 1488, 594, 13, 'middle'),
    `<rect x="36" y="666" width="1768" height="158" rx="12" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>`,
    label('STATIC ACCEPTANCE · SCHEMA 21 / DEPARTMENT MANIFEST V3', 62, 706, 14),
    label('Six facility SKUs, two canister overlays, and one non-placeable hand-carried item use the shared browser/headless export path.', 62, 742, 15),
    label('The pay envelope is explicitly pneumaticCompatible:false; no tube stamp, facility footprint, or dispatch route is inferred.', 62, 778, 15),
    '</svg>',
  ].join('');
}

async function main(): Promise<void> {
  const output = path.resolve(OUTPUT);
  await mkdir(output, { recursive: true });
  const svg = composedOfficeSvg();
  const png = new Resvg(svg).render().asPng();
  const farmFormSvg = farmFormPriorityOneSvg();
  const farmFormPng = new Resvg(farmFormSvg).render().asPng();
  const farmFormP2Svg = farmFormPriorityTwoSvg();
  const farmFormP2Png = new Resvg(farmFormP2Svg).render().asPng();
  const phaseASvg = phaseASpineSvg();
  const phaseAPng = new Resvg(phaseASvg).render().asPng();
  const phaseBSvg = phaseBEngineeringMaintenanceSvg();
  const phaseBPng = new Resvg(phaseBSvg).render().asPng();
  const phaseCSvg = phaseCInternalServicesSvg();
  const phaseCPng = new Resvg(phaseCSvg).render().asPng();
  const manifest = departmentAssetCatalogJson();
  const metrics = {
    status: 'owner-accepted-production-validation',
    direction: manifest.family.direction,
    facilityTemplates: manifest.facilities.length,
    bakedInstances: DEPARTMENT_MACHINE_DEFAULT_PROPS.length,
    schemaVersion: manifest.schemaVersion,
    departmentAssetManifestVersion: manifest.version,
    fillStates: { loadingDock: 3, intakeTraySmall: 4, intakeTrayLarge: 4, dispatchStation: 4 },
    tube: manifest.tube,
    workTypeStamps: manifest.canister.stamps.map(({ workType }) => workType),
    farmFormPriority1Promoted: true,
    farmFormPriority1: {
      keypunchConsole: { suggestedFootprint: { w: 1, h: 1 }, placement: 'floor' },
      partitionStraight: {
        placement: 'cell-edge-furniture-slot',
        authoredStates: ['horizontal', 'vertical'],
      },
      partitionCorner: { placement: 'cell-corner-furniture-slot' },
      partitionEndcap: {
        placement: 'cell-edge-furniture-slot',
        authoredStates: ['horizontal', 'vertical'],
      },
      keypunchBankBuilderPlaceable: false,
      refinementDebt: 'replacement review v2 is open; production partition pixels remain stable until owner approval',
    },
    farmFormPriority2Promoted: true,
    farmFormPriority2: {
      adjudicationDeskSet: { suggestedFootprint: { w: 1, h: 1 }, placement: 'floor' },
      docketRack: {
        suggestedFootprint: { w: 1, h: 1 },
        placement: 'floor',
        bakedStates: ['empty', 'low', 'high', 'overflowing'],
      },
      workTypeStamps: ['applications', 'determinations'],
    },
    priority2Promoted: true,
    priority3aPromoted: true,
    priority3aSuggestedFootprints: {
      terminalBank: { w: 3, h: 2 },
      compilerPress: { w: 2, h: 2 },
      partsCrib: { w: 2, h: 2 },
      workbench: { w: 2, h: 2 },
    },
    priority3bPromoted: true,
    priority3bSuggestedFootprints: {
      recordsCabinet: { w: 2, h: 2 },
      badgePress: { w: 1, h: 2 },
      ledgerEngine: { w: 2, h: 2 },
      envelopePress: { w: 1, h: 2 },
      requisitionCounter: { w: 2, h: 2 },
      stockShelving: { w: 2, h: 2 },
    },
    handCarriedItems: manifest.handCarriedItems,
    machineAnimationDeferred: true,
  };
  await writeFile(path.join(output, 'production-composed-office.svg'), svg, 'utf8');
  await writeFile(path.join(output, 'production-composed-office.png'), png);
  await writeFile(path.join(output, 'farm-form-priority1-production-composed-office.svg'), farmFormSvg, 'utf8');
  await writeFile(path.join(output, 'farm-form-priority1-production-composed-office.png'), farmFormPng);
  await writeFile(path.join(output, 'farm-form-priority2-approvals-production-composed-office.svg'), farmFormP2Svg, 'utf8');
  await writeFile(path.join(output, 'farm-form-priority2-approvals-production-composed-office.png'), farmFormP2Png);
  await writeFile(path.join(output, 'phase-a-production-composed-office.svg'), phaseASvg, 'utf8');
  await writeFile(path.join(output, 'phase-a-production-composed-office.png'), phaseAPng);
  await writeFile(path.join(output, 'phase-b-engineering-maintenance-production-composed-office.svg'), phaseBSvg, 'utf8');
  await writeFile(path.join(output, 'phase-b-engineering-maintenance-production-composed-office.png'), phaseBPng);
  await writeFile(path.join(output, 'phase-c-internal-services-production-composed-office.svg'), phaseCSvg, 'utf8');
  await writeFile(path.join(output, 'phase-c-internal-services-production-composed-office.png'), phaseCPng);
  await writeFile(path.join(output, 'metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  await writeFile(path.join(output, 'README.md'), [
    '# QuotaCo department assets — production validation',
    '',
    'This sheet uses only registered production `PropTemplate` instances and `composeProp`; no review renderer is used.',
    'It is the post-acceptance composed-office proof for the B / Administrative Percussion control.',
    '',
    '- Canonical SVG and production flat-composition pixels are checked for exact parity in tests.',
    '- The farm-form Priority 1 sheet uses the promoted 1×1 Keypunch Console plus authored horizontal/vertical partition variants.',
    '- The farm-form Priority 2 sheet uses the promoted 1×1 Adjudication Desk Set, the Docket Rack’s four baked backlog states, and the applications/determinations stamps.',
    '- Current partition production sprites remain stable while their replacement receives a separate review-only refinement pass.',
    '- Partition edge/corner slots are furniture placement hints, do not claim hidden whole-cell collision, and never rotate at runtime.',
    '- The superseded Keypunch Bank remains export-resolvable for old saves but is no longer builder-placeable.',
    '- The route strip uses the production tube sprites at the accepted 64u logical-cell pitch.',
    '- The Phase A sheet uses the six accepted Priority 2 templates and exact existing Review Table art.',
    '- The Phase B sheet uses the four accepted Priority 3A templates; Terminal Bank keeps the owner-selected 3×2 suggested footprint.',
    '- Specifications, code, release, and repairs join the base-plus-overlay canister system; release remains a Documentation control.',
    '- The Phase C sheet uses the six accepted Priority 3B facility templates and the registered pay-envelope sprite.',
    '- Personnel actions and supplies are canister stamps; pay envelope is manifest-v2 hand-carried content and never pneumatic.',
    '- The shared browser/headless exporter supplies all code-owned machine instances even for older saved projects.',
    '- Machine animation is necessary follow-up but remains contractually deferred; this promotion is static.',
    '',
  ].join('\n'), 'utf8');
  process.stdout.write(`Wrote department-machine production validation to ${output}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
