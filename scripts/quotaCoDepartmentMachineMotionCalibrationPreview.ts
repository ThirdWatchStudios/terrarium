/**
 * Review-only motion pilot for QuotaCo department machines.
 *
 * This file authors provisional frame differences and contract recommendations only.
 * It does not change canonical SVGs, templates/defaults, manifests, browser exports, or Unity.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { refinedPriorityOneAssetSvg } from './quotaCoDepartmentMachineReadabilityRefinementPreview';
import { priorityTwoAssetSvg } from './quotaCoDepartmentMachinePhaseASpineCalibrationPreview';
import { DEPARTMENT_MACHINE_PALETTE } from './quotaCoDepartmentMachineFamilyCalibrationPreview';

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const PANEL_COLD = '#E4ECE8';
const PANEL_WARN = '#F2E4DE';
const FLOOR = '#7B8890';
const INK = '#292C2A';
const MUTED = '#626861';
const Q = {
  cream: DEPARTMENT_MACHINE_PALETTE.cream,
  green: DEPARTMENT_MACHINE_PALETTE.green,
  teal: DEPARTMENT_MACHINE_PALETTE.teal,
  charcoal: '#252A28',
  metal: '#979A91',
  coral: '#B65F4D',
  white: '#FFFFFF',
};

export const DEPARTMENT_MACHINE_MOTION_PILOTS = [
  {
    id: 'tabulating_machine',
    pollution: 'noise',
    primitive: 'impact-cycle',
    movingParts: ['primary drum index', 'secondary drum index', 'percussion hammer'],
  },
  {
    id: 'calculating_engine',
    pollution: 'heat',
    primitive: 'continuous-mechanism',
    movingParts: ['arithmetic drums', 'exhaust louvers', 'paper feed'],
  },
  {
    id: 'rotary_duplicator',
    pollution: 'fumes',
    primitive: 'rotary-feed',
    movingParts: ['ink drum index', 'paper registration mark', 'drying fingers'],
  },
  {
    id: 'comparator',
    pollution: 'quiet-control',
    primitive: 'gate-settle',
    movingParts: ['comparison gate', 'result card'],
  },
] as const;

export type DepartmentMachineMotionPilotId = (typeof DEPARTMENT_MACHINE_MOTION_PILOTS)[number]['id'];
export type DepartmentMachineMotionFrame = 0 | 1 | 2 | 3;

export const DEPARTMENT_MACHINE_MOTION_CONTRACT_QUESTIONS = [
  {
    id: 'frame-vocabulary',
    recommendation: 'Begin with one four-frame working loop per animated SKU; the accepted static sprite remains the idle frame.',
  },
  {
    id: 'state-ownership',
    recommendation: 'The sim chooses idle/working/blocked and playback rate; Terrarium owns aligned pixels and moving-part membership.',
  },
  {
    id: 'phase-desynchronization',
    recommendation: 'The sim assigns a stable per-instance phase offset so machine rows never cycle in lockstep.',
  },
  {
    id: 'pollution-boundary',
    recommendation: 'Motion implies the source mechanically; heat haze, fumes, sound rings, glow, and meters remain separate presentation effects.',
  },
  {
    id: 'export-shape',
    recommendation: 'Add optional animations[] to department manifest v4; keep project schema v21 because this remains derived content.',
  },
] as const;

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 16,
  weight = 500,
  fill: string = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" ` +
    `font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  max: number,
  size = 14,
  leading = 21,
  weight = 600,
  fill: string = INK,
): string {
  const lines: string[] = [];
  let current = '';
  for (const word of value.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > max) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines.map((line, index) => text(x, y + index * leading, line, size, weight, fill)).join('');
}

function panel(x: number, y: number, width: number, height: number, fill = PANEL): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" ` +
    `fill="${fill}" stroke="#A39B8B" stroke-width="2"/>`;
}

function asset(markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${markup}</svg>`;
}

function page(width: number, height: number, markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${markup}</svg>`;
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placed(source: string, x: number, y: number, size: number): string {
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" overflow="visible" `)
    .replace(/width="[^"]+" height="[^"]+"/, `width="${size}" height="${size}"`);
}

function acceptedAsset(id: DepartmentMachineMotionPilotId): string {
  return id === 'tabulating_machine'
    ? refinedPriorityOneAssetSvg('tabulating_machine')
    : priorityTwoAssetSvg(id);
}

function radialLine(cx: number, cy: number, radius: number, angleDeg: number, width = 2): string {
  const angle = angleDeg * Math.PI / 180;
  const x2 = cx + Math.cos(angle) * radius;
  const y2 = cy + Math.sin(angle) * radius;
  return `<path d="M ${cx} ${cy} L ${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="${Q.charcoal}" ` +
    `stroke-width="${width}" stroke-linecap="round"/>`;
}

function tabulatorMotion(frame: DepartmentMachineMotionFrame): string {
  if (frame === 0) return '';
  const angles = [0, -35, -90, -25];
  const hammerDrops = [0, 2, 7, 3];
  const angle = angles[frame];
  const drop = hammerDrops[frame];
  return `<g id="tabulator-motion-frame-${frame}">` +
    `<circle cx="41" cy="69" r="9" fill="${Q.green}"/>${radialLine(41, 69, 8, angle, 2.2)}` +
    `<circle cx="76" cy="54" r="7" fill="${Q.metal}"/>${radialLine(76, 54, 6, angle + 55, 2)}` +
    `<g id="percussion-hammer" transform="translate(0 ${drop})">` +
    `<path d="M 61 25 V 39" stroke="${Q.metal}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M 55 38 H 67 V 43 H 55 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.5"/>` +
    `</g>` +
    `<path id="paper-registration" d="M ${84 + frame} 67 H ${108 + frame} V 94 H ${84 + frame} Z" ` +
    `fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.5"/>` +
    `</g>`;
}

function calculatingMotion(frame: DepartmentMachineMotionFrame): string {
  if (frame === 0) return '';
  const angle = [0, 32, 78, 126][frame];
  const louverTilt = [0, -2, 2, -1][frame];
  const drums = [46, 65, 84].map((cx, index) =>
    `<circle cx="${cx}" cy="61" r="7.5" fill="${Q.teal}"/>` +
    radialLine(cx, 61, 7, angle + index * 35, 1.8) +
    radialLine(cx, 61, 7, angle + index * 35 + 180, 1.8),
  ).join('');
  const louvers = [43, 53, 63, 73].map((y, index) =>
    `<path d="M 17 ${y} L 25 ${y + louverTilt * (index % 2 ? -1 : 1)}" stroke="${Q.charcoal}" ` +
    `stroke-width="2" stroke-linecap="round"/>`,
  ).join('');
  return `<g id="calculating-motion-frame-${frame}">${drums}` +
    `<path d="M 15 39 H 27 V 78 H 15 Z" fill="${Q.cream}"/>${louvers}` +
    `<g id="paper-feed-shift" transform="translate(${frame % 2} ${frame === 2 ? -2 : -1})">` +
    `<path d="M 96 79 H 115 L 113 88 H 95 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.5"/>` +
    `</g></g>`;
}

function duplicatorMotion(frame: DepartmentMachineMotionFrame): string {
  if (frame === 0) return '';
  const angle = [0, 45, 105, 165][frame];
  const fingerShift = [0, 1, 3, 1][frame];
  const fingers = [0, 5, 10, 15].map((offset, index) =>
    `<path d="M ${92 + offset} ${70 + index * .7} L ${105 + offset} ${92 + fingerShift}" ` +
    `stroke="${Q.metal}" stroke-width="2" stroke-linecap="round"/>`,
  ).join('');
  return `<g id="duplicator-motion-frame-${frame}">` +
    `<circle cx="65" cy="59" r="20" fill="${Q.teal}"/>` +
    radialLine(65, 59, 18, angle, 3) + radialLine(65, 59, 18, angle + 180, 3) +
    `<circle cx="65" cy="59" r="8" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<circle id="paper-registration-mark" cx="${65 + Math.cos(angle * Math.PI / 180) * 16}" ` +
    `cy="${59 + Math.sin(angle * Math.PI / 180) * 16}" r="2.5" fill="${Q.cream}"/>` +
    `<path d="M 90 67 H 119 V 100 H 90 Z" fill="${Q.cream}" opacity=".08"/>${fingers}` +
    `</g>`;
}

function comparatorMotion(frame: DepartmentMachineMotionFrame): string {
  if (frame === 0) return '';
  const shift = [0, -1, 2, 0][frame];
  return `<g id="comparator-motion-frame-${frame}">` +
    `<g id="quiet-gate-settle" transform="translate(${shift} 0)">` +
    `<path d="M 51 63 H 77 V 82 H 51 Z" fill="${Q.charcoal}"/>` +
    `<path d="M 55 67 H 73 V 78 H 55 Z" fill="${Q.teal}"/>` +
    `</g>` +
    `<path id="quiet-result-card" d="M ${54 + shift} 86 H ${76 + shift} V 97 H ${54 + shift} Z" ` +
    `fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.5"/>` +
    `</g>`;
}

export function departmentMachineMotionFrameSvg(
  id: DepartmentMachineMotionPilotId,
  frame: DepartmentMachineMotionFrame,
): string {
  const overlay = id === 'tabulating_machine'
    ? tabulatorMotion(frame)
    : id === 'calculating_engine'
      ? calculatingMotion(frame)
      : id === 'rotary_duplicator'
        ? duplicatorMotion(frame)
        : comparatorMotion(frame);
  return asset(`<g id="${id}-accepted-static-base">${inner(acceptedAsset(id))}</g>${overlay}`);
}

function frameLabel(frame: DepartmentMachineMotionFrame): string {
  return ['idle', 'work-a', 'impact / turn', 'recover'][frame];
}

function ladderPage(): string {
  const width = 2200;
  const height = 1580;
  const parts = [
    text(36, 48, 'DEPARTMENT MACHINES · MOTION PRIMITIVE PILOT', 26, 860),
    text(36, 78, 'Review only · functional components move; housings, footprints, pivots, and product colors remain fixed.', 14, 650, MUTED),
    text(width - 36, 48, 'NOT PROMOTED', 12, 840, Q.coral, 'end'),
  ];
  DEPARTMENT_MACHINE_MOTION_PILOTS.forEach((pilot, row) => {
    const y = 108 + row * 350;
    const fill = row % 2 === 0 ? PANEL : PANEL_ALT;
    parts.push(
      panel(36, y, width - 72, 320, fill),
      text(58, y + 38, `${pilot.id.replaceAll('_', ' ').toUpperCase()} · ${pilot.pollution.toUpperCase()}`, 13, 840, Q.green),
      text(58, y + 68, pilot.primitive, 11, 760, MUTED),
      wrappedText(58, y + 104, `Moving: ${pilot.movingParts.join(' · ')}`, 38, 13, 20, 620, INK),
    );
    ([0, 1, 2, 3] as const).forEach((frame, column) => {
      const x = 440 + column * 370;
      parts.push(
        placed(departmentMachineMotionFrameSvg(pilot.id, frame), x, y + 30, 230),
        placed(departmentMachineMotionFrameSvg(pilot.id, frame), x + 238, y + 96, 80),
        text(x + 115, y + 286, frameLabel(frame), 11, 760, frame === 0 ? MUTED : Q.green, 'middle'),
      );
    });
  });
  return page(width, height, parts.join(''));
}

function roomGrid(x: number, y: number, columns: number, rows: number, cell: number): string {
  const parts = [`<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" fill="${FLOOR}"/>`];
  for (let column = 1; column < columns; column += 1) {
    parts.push(`<path d="M ${x + column * cell} ${y} V ${y + rows * cell}" stroke="#D9D4C7" opacity=".25"/>`);
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(`<path d="M ${x} ${y + row * cell} H ${x + columns * cell}" stroke="#D9D4C7" opacity=".25"/>`);
  }
  return parts.join('');
}

function roomPage(): string {
  const width = 2100;
  const height = 1260;
  const cell = 92;
  const frames: DepartmentMachineMotionFrame[] = [0, 2];
  const parts = [
    text(36, 48, 'MACHINE MOTION · COMPOSED ROOM READ', 26, 860),
    text(36, 78, 'Idle and peak-action snapshots at normal room scale; no glow, haze, fumes, sound rings, or UI.', 14, 650, MUTED),
  ];
  frames.forEach((frame, index) => {
    const panelX = 36 + index * 1028;
    const gridX = panelX + 34;
    const gridY = 176;
    parts.push(
      panel(panelX, 108, 994, 1090, index === 0 ? PANEL_ALT : PANEL_COLD),
      text(panelX + 22, 146, index === 0 ? 'IDLE CONTROL' : 'WORKING · PEAK ACTION', 13, 840, index === 0 ? MUTED : Q.green),
      roomGrid(gridX, gridY, 10, 8, cell),
      placed(departmentMachineMotionFrameSvg('tabulating_machine', frame), gridX + .5 * cell, gridY + .7 * cell, cell * 2.4),
      placed(departmentMachineMotionFrameSvg('calculating_engine', frame), gridX + 4.0 * cell, gridY + .7 * cell, cell * 2.4),
      placed(departmentMachineMotionFrameSvg('rotary_duplicator', frame), gridX + .5 * cell, gridY + 4.0 * cell, cell * 2.4),
      placed(departmentMachineMotionFrameSvg('comparator', frame), gridX + 4.0 * cell, gridY + 4.0 * cell, cell * 2.4),
      text(panelX + 210, 1012, 'NOISE', 11, 820, Q.cream, 'middle'),
      text(panelX + 532, 1012, 'HEAT', 11, 820, Q.cream, 'middle'),
      text(panelX + 210, 1060, 'FUMES', 11, 820, Q.cream, 'middle'),
      text(panelX + 532, 1060, 'QUIET CONTROL', 11, 820, Q.cream, 'middle'),
      wrappedText(panelX + 22, 1126,
        index === 0
          ? 'Accepted static pixels remain the idle source of truth.'
          : 'Different mechanisms carry different activity signatures without moving the whole housing.',
        88, 13, 20, 620, INK),
    );
  });
  return page(width, height, parts.join(''));
}

function contractPage(): string {
  const width = 1960;
  const height = 1220;
  const parts = [
    text(36, 48, 'MACHINE MOTION · CONTRACT GATES', 26, 860),
    text(36, 78, 'Nothing below is an export promise until the frame read and ownership split are approved.', 14, 650, MUTED),
    panel(36, 108, 1240, 1048, PANEL),
    text(58, 148, 'RECOMMENDED FIRST CONTRACT', 13, 840, Q.green),
  ];
  DEPARTMENT_MACHINE_MOTION_CONTRACT_QUESTIONS.forEach((question, index) => {
    const y = 206 + index * 168;
    parts.push(
      text(58, y, `${index + 1}. ${question.id.replaceAll('-', ' ').toUpperCase()}`, 11, 840, Q.coral),
      wrappedText(58, y + 36, question.recommendation, 108, 14, 22, 620, INK),
    );
  });
  parts.push(
    panel(1308, 108, 616, 500, PANEL_COLD),
    text(1330, 148, 'TERRARIUM OWNS', 12, 840, Q.green),
    wrappedText(1330, 190,
      'frame pixels · pivots · moving-part membership · source alignment · sprite-sheet order · far-scale readability',
      58, 14, 22, 620, INK),
    panel(1308, 640, 616, 516, PANEL_WARN),
    text(1330, 680, 'SIM OWNS', 12, 840, Q.coral),
    wrappedText(1330, 722,
      'machine state · start/stop · playback rate · stable phase offset · pollution magnitude · sound · heat haze · fumes · jams and degradation triggers',
      58, 14, 22, 620, INK),
    text(1330, 934, 'NEVER BAKED INTO SKU', 11, 840, Q.coral),
    wrappedText(1330, 970,
      'meters · readouts · glow · amber/rose accents · camera cues · smoke clouds · sound rings · wear · clutter',
      58, 14, 22, 620, INK),
  );
  return page(width, height, parts.join(''));
}

function animatedPilotSvg(): string {
  const width = 1600;
  const height = 440;
  const keyframes = ([0, 1, 2, 3] as const).map((frame) => {
    const start = frame * 25;
    const end = start + 24.9;
    return `@keyframes phase-${frame}{0%,${start - .1}%{opacity:0}${start}%,${end}%{opacity:1}${end + .1}%,100%{opacity:0}}`;
  }).join('');
  const machines = DEPARTMENT_MACHINE_MOTION_PILOTS.map((pilot, machineIndex) => {
    const x = 76 + machineIndex * 380;
    return ([0, 1, 2, 3] as const).map((frame) =>
      `<g class="motion-phase phase-${frame}">${placed(departmentMachineMotionFrameSvg(pilot.id, frame), x, 64, 280)}</g>`,
    ).join('') + text(x + 140, 386, pilot.id.replaceAll('_', ' '), 14, 760, INK, 'middle');
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<style>${keyframes}.motion-phase{opacity:0;animation-duration:1.2s;animation-timing-function:steps(1,end);animation-iteration-count:infinite}.phase-0{animation-name:phase-0}.phase-1{animation-name:phase-1}.phase-2{animation-name:phase-2}.phase-3{animation-name:phase-3}</style>` +
    `<rect width="${width}" height="${height}" fill="${PAGE}"/>` +
    text(24, 34, 'REVIEW-ONLY SYNCHRONIZED LOOP · runtime must desynchronize instances', 14, 820, Q.coral) +
    machines + `</svg>`;
}

export function renderDepartmentMachineMotionLadderSvg(): string { return ladderPage(); }
export function renderDepartmentMachineMotionRoomSvg(): string { return roomPage(); }
export function renderDepartmentMachineMotionContractSvg(): string { return contractPage(); }
export function renderDepartmentMachineMotionLoopSvg(): string { return animatedPilotSvg(); }

export interface DepartmentMachineMotionCalibrationResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderDepartmentMachineMotionCalibration(
  output: string,
): Promise<DepartmentMachineMotionCalibrationResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-motion-primitive-ladder', ladderPage()],
    ['02-composed-room-motion-read', roomPage()],
    ['03-motion-contract-gates', contractPage()],
  ] as const;
  const files: string[] = [];
  const loopPath = path.join(output, '00-motion-pilot-loop.svg');
  await writeFile(loopPath, animatedPilotSvg(), 'utf8');
  files.push(loopPath);
  for (const [stem, svg] of pages) {
    const svgPath = path.join(output, `${stem}.svg`);
    const pngPath = path.join(output, `${stem}.png`);
    await writeFile(svgPath, svg, 'utf8');
    await writeFile(pngPath, new Resvg(svg).render().asPng());
    files.push(svgPath, pngPath);
  }
  const metrics = {
    reviewStatus: 'awaiting-owner-machine-motion-direction-and-contract-approval',
    scope: 'department-machine-motion-pilot-review-only',
    pilots: DEPARTMENT_MACHINE_MOTION_PILOTS,
    frameCountPerWorkingLoop: 4,
    contractQuestions: DEPARTMENT_MACHINE_MOTION_CONTRACT_QUESTIONS,
    productionMutation: false,
    canonicalSvgAuthoring: false,
    templateRegistration: false,
    departmentManifestMutation: false,
    contractMutation: false,
    schemaMutation: false,
    exportRun: false,
    parityClaim: false,
    currentStaticSpritesStable: true,
    pollutionEffectsBakedIntoFrames: false,
    wholeHousingMotion: false,
    unityImport: false,
  };
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# QuotaCo department machines — motion pilot calibration',
    '',
    'Status: **review only; no animation or export contract has been promoted**',
    '',
    'This proof tests four aligned frames on one representative machine from each pollution family',
    'plus a quiet control. Only functional mechanisms move. The accepted static sprite remains frame',
    'zero and the visual source of truth for housing, footprint, pivot, palette, and product identity.',
    '',
    'The recommended ownership split is: Terrarium authors aligned frame pixels and moving-part',
    'membership; the sim owns state selection, playback rate, stable per-instance phase offset, and all',
    'pollution effects. No glow, haze, fumes, sound rings, meters, readouts, or reserved colors are baked.',
    '',
    'The animated SVG is intentionally synchronized only to make frame differences easy to inspect.',
    'A runtime implementation must desynchronize machine instances.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return { output, files, metricsPath, readmePath };
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quota-co-department-machine-motion-calibration-v1');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  const result = await renderDepartmentMachineMotionCalibration(outputPath(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} review-only motion files to ${result.output}\n`);
}
