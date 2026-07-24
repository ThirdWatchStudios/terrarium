import { describe, expect, it } from 'vitest';

import {
  ACCEPTED_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,
  ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE,
  ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE,
  ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE,
  ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
  ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE,
  ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE,
  ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE,
  ACCEPTED_THICK_WALL_BLOCK_GATE,
  ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE,
  ACCEPTED_ISOLATED_SHELL_GATE,
  ACCEPTED_CORRIDOR_GATE,
  ACCEPTED_HORIZONTAL_TERMINUS_GATE,
  ACCEPTED_MAPPING_GATE,
  ACCEPTED_THICK_WALL_REPEAT_GATE,
  ACCEPTED_VERTICAL_TERMINUS_GATE,
  ARCHIVED_WORKBENCH_BOARDS,
  CURRENT_WORKBENCH_BOARDS,
  renderStyleWorkbenchPage,
} from '../scripts/highOblique/styleWorkbenchPage';
import { EQUAL_HEIGHT_CORRIDOR_GATE } from '../scripts/highOblique/equalHeightCorridorGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledEastCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledNorthCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledOppositeDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledWestCrossJunctionGate';
import { EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE } from '../scripts/highOblique/equalHeightEastPartialTJunctionGate';
import { EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE } from '../scripts/highOblique/equalHeightHorizontalOpenPocketTJunctionGate';
import { EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE } from '../scripts/highOblique/equalHeightHorizontalPartialTJunctionGate';
import { EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE } from '../scripts/highOblique/equalHeightHorizontalTerminusGate';
import { EQUAL_HEIGHT_ISOLATED_SHELL_GATE } from '../scripts/highOblique/equalHeightIsolatedShellGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightOpenPocketCrossJunctionGate';
import { EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE } from '../scripts/highOblique/equalHeightOpenPocketTJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleFilledCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleFilledNorthwestCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleFilledSoutheastCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleFilledSouthwestCrossJunctionGate';
import { EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE } from '../scripts/highOblique/equalHeightThickWallBlockGate';
import { EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE } from '../scripts/highOblique/equalHeightThickWallHorizontalRepeatGate';
import { EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE } from '../scripts/highOblique/equalHeightThickWallRepeatGate';
import { EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE } from '../scripts/highOblique/equalHeightVerticalTerminusGate';
import { EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE } from '../scripts/highOblique/equalHeightWestPartialTJunctionGate';

const occurrences = (source: string, needle: string): number => source.split(needle).length - 1;

describe('QuotaCo current wall workbench', () => {
  it('locks the accepted mask_40 filtered derivation without leaving an active proposal', () => {
    expect(ACCEPTED_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE)
      .toEqual({
      stem:
        EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_40 opposite-diagonal cross-junction',
      summary:
        'Accepted the whole-cell X mirror of mask_30 after omitting only the two duplicated west-boundary seam paths. Northwest and southeast are solid while northeast and southwest remain open floor.',
      alt:
        'owner-accepted mask forty opposite-diagonal QuotaCo cross-junction filtered mirror derivation in compact and long installed proofs',
    });
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'review'))
      .toHaveLength(0);
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'accepted'))
      .toHaveLength(5);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[40]).toMatchObject({
      index: 40,
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 17,
      'synthetic-assembly': 6,
      'unresolved-authored-geometry': 0,
    });
  });

  it('places accepted mask_30 ahead of the accepted mask_39 and mask_37 gates', () => {
    expect(ACCEPTED_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_30 diagonal-filled cross-junction',
      summary: 'Accepted one authored fixed-light union with northeast and southwest solid, northwest and southeast open floor, and source-owned north/west-to-south/east register handoff; mask_30 now has direct proof-layer provenance.',
      alt: 'owner-accepted mask thirty diagonal-filled QuotaCo cross-junction in source compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE)
      .toMatchObject({
        stem: 'equal-height-double-filled-diagonal-cross-junction-gate',
        status: 'owner-accepted-double-filled-diagonal-cross-junction-gate',
        candidate: {
          maskIndex: 30,
          sourceMaskIndex: 30,
          sourceStem: 'open_cross_filled_ne_sw',
          baseFile: 'open_cross_filled_ne_sw-base.svg',
          upperFile: 'open_cross_filled_ne_sw-upper.svg',
          transform: 'none',
          derivation: 'none',
          resolution: 'direct-reuse',
        },
        renderingDecision: {
          sourceDirectory:
            'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction',
        },
        maskRowsUnderReview: [],
        maskRowsAccepted: [30],
        acceptedLedgerCounts: {
          'direct-reuse': 24,
          'approved-derivation': 17,
          'synthetic-assembly': 6,
          'unresolved-authored-geometry': 0,
        },
        directSourceAccepted: true,
        productionRegistration: false,
        productionTopologyMutation: false,
        schemaChange: false,
        exportable: false,
        committedAtlas: false,
      });
    expect(ACCEPTED_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_39 north-filled slab cross-junction',
      summary: 'Accepted one authored west-fixed union for a two-row north slab with a south spur. Both northern diagonals are solid, both southern crooks remain open floor, and mask_39 now has direct proof-layer provenance.',
      alt: 'owner-accepted mask thirty-nine QuotaCo north-filled slab cross-junction in source compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE)
      .toMatchObject({
        stem: 'equal-height-double-filled-north-cross-junction-gate',
        status: 'owner-accepted-double-filled-north-cross-junction-gate',
        candidate: {
          maskIndex: 39,
          sourceMaskIndex: 39,
          sourceStem: 'open_cross_filled_n',
          baseFile: 'open_cross_filled_n-base.svg',
          upperFile: 'open_cross_filled_n-upper.svg',
          transform: 'none',
          derivation: 'none',
          resolution: 'direct-reuse',
        },
        renderingDecision: {
          sourceDirectory:
            'assets/walls/quota-co-building-system-proofs/double-filled-north-cross-junction',
        },
        maskRowsUnderReview: [],
        maskRowsAccepted: [39],
        acceptedLedgerCounts: {
          'direct-reuse': 24,
          'approved-derivation': 17,
          'synthetic-assembly': 6,
          'unresolved-authored-geometry': 0,
        },
        directSourceAccepted: true,
        productionRegistration: false,
        productionTopologyMutation: false,
        schemaChange: false,
        exportable: false,
        committedAtlas: false,
      });
    expect(ACCEPTED_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_37 northwest-filled cross-junction',
      summary: 'Accepted one separately authored east-register four-way union with a solid northwest crook and three genuine floor crooks; mask_37 now has direct proof-layer provenance.',
      alt: 'owner-accepted mask thirty-seven QuotaCo northwest-filled cross-junction authored east-register source in compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE)
      .toMatchObject({
        stem: 'equal-height-single-filled-northwest-cross-junction-gate',
        status: 'owner-accepted-single-filled-northwest-cross-junction-gate',
        candidate: {
          maskIndex: 37,
          sourceMaskIndex: 37,
          sourceStem: 'open_cross_filled_nw',
          baseFile: 'open_cross_filled_nw-base.svg',
          upperFile: 'open_cross_filled_nw-upper.svg',
          fixedLightRole: 'northwest-filled-four-way-hub-east-register',
          transform: 'none',
          derivation: 'none',
          resolution: 'direct-reuse',
        },
        renderingDecision: {
          sourceDirectory:
            'assets/walls/quota-co-building-system-proofs/single-filled-northwest-cross-junction',
        },
        maskRowsUnderReview: [],
        maskRowsAccepted: [37],
        acceptedLedgerCounts: {
          'direct-reuse': 24,
          'approved-derivation': 17,
          'synthetic-assembly': 6,
          'unresolved-authored-geometry': 0,
        },
        directSourceAccepted: true,
        productionRegistration: false,
        productionTopologyMutation: false,
        schemaChange: false,
        exportable: false,
        committedAtlas: false,
      });
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'review'))
      .toHaveLength(0);
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'accepted'))
      .toHaveLength(5);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[39]).toMatchObject({
      index: 39,
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[37]).toMatchObject({
      index: 37,
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 17,
      'synthetic-assembly': 6,
      'unresolved-authored-geometry': 0,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[30]).toMatchObject({
      index: 30,
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
      },
    });
  });

  it('keeps accepted mask_29 directly behind the accepted mask_37 source gate', () => {
    expect(ACCEPTED_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE).toEqual({
      stem:
        EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_29 southwest-filled cross-junction',
      summary: 'Accepted the plain whole-cell X mirror of mask_23 as one east-register four-way union; the southwest crook is solid while northeast, southeast, and northwest remain open floor.',
      alt: 'owner-accepted mask twenty-nine QuotaCo southwest-filled cross-junction mirror derivation in compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE)
      .toMatchObject({
        stem: 'equal-height-single-filled-southwest-cross-junction-gate',
        status: 'owner-accepted-single-filled-southwest-cross-junction-gate',
        candidate: {
          maskIndex: 29,
          sourceMaskIndex: 23,
          transform: 'mirror-x',
          derivation: 'none',
          resolution: 'approved-derivation',
        },
        maskRowsUnderReview: [],
        maskRowsAccepted: [29],
        productionRegistration: false,
        productionTopologyMutation: false,
        schemaChange: false,
        exportable: false,
        committedAtlas: false,
      });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[29].resolution).toMatchObject({
      kind: 'approved-derivation',
      status: 'accepted-source-mapping',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 17,
      'synthetic-assembly': 6,
      'unresolved-authored-geometry': 0,
    });
  });

  it('keeps mask_43 immediately behind the accepted mask_29 derivation gate', () => {
    expect(ACCEPTED_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_43 west-filled slab junction',
      summary: 'Accepted the plain whole-cell X mirror of mask_25 for an east branch entering a two-cell-wide north–south slab; both west crooks are solid while northeast and southeast remain open floor.',
      alt: 'owner-accepted mask forty-three QuotaCo west-filled slab junction in source compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-double-filled-west-cross-junction-gate',
      status: 'owner-accepted-double-filled-west-cross-junction-gate',
      candidate: {
        maskIndex: 43,
        sourceMaskIndex: 25,
        transform: 'mirror-x',
        derivation: 'none',
        resolution: 'approved-derivation',
      },
      maskRowsUnderReview: [],
      maskRowsAccepted: [43],
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'accepted'))
      .toHaveLength(5);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[43].resolution).toMatchObject({
      kind: 'approved-derivation',
      status: 'accepted-source-mapping',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 17,
      'synthetic-assembly': 6,
      'unresolved-authored-geometry': 0,
    });
  });

  it('keeps accepted mask_25 immediately behind accepted mask_43 without adding either to the ordinary board manifest', () => {
    expect(ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_25 east-filled slab junction',
      summary: 'Accepted one west-fixed authored union for a west branch entering a two-cell-wide north–south slab; both east crooks are solid while northwest and southwest remain open floor.',
      alt: 'owner-accepted mask twenty-five QuotaCo east-filled slab junction in source compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE).toMatchObject({
      status: 'owner-accepted-double-filled-east-cross-junction-gate',
      maskRowsUnderReview: [],
      maskRowsAccepted: [25],
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[25].resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 17,
      'synthetic-assembly': 6,
      'unresolved-authored-geometry': 0,
    });
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({
        stem: ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem,
      }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({
        stem: ACCEPTED_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.stem,
      }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({
        stem: ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem,
      }),
    );
  });

  it('keeps accepted mask_23 behind mask_25 without adding it to the ordinary board manifest', () => {
    expect(ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_23 southeast-filled cross-junction',
      summary: 'Accepted one west-fixed authored four-way union with a solid southeast crook and three genuine floor crooks; mask_23 now has direct proof-layer provenance.',
      alt: 'owner-accepted mask twenty-three single-filled southeast crook QuotaCo cross-junction in source compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE).toMatchObject({
      status: 'owner-accepted-single-filled-southeast-cross-junction-gate',
      maskRowsUnderReview: [],
      maskRowsAccepted: [23],
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[23].resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 17,
      'synthetic-assembly': 6,
      'unresolved-authored-geometry': 0,
    });
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({
        stem: ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem,
      }),
    );
  });

  it('keeps accepted mask_19 behind mask_23 and ahead of the accepted mask_15 control', () => {
    expect(ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_19 single-filled-crook cross-junction',
      summary: 'Accepted one west-fixed authored four-way union with a solid northeast crook and three genuine floor crooks; mask_19 now has direct proof-layer provenance.',
      alt: 'owner-accepted mask nineteen single-filled northeast crook QuotaCo cross-junction in source compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE).toMatchObject({
      status: 'owner-accepted-single-filled-cross-junction-gate',
      maskRowsUnderReview: [],
      maskRowsAccepted: [19],
      productionRegistration: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[19].resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
    });
    expect(ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_15 open-pocket cross-junction',
      summary: 'Accepted one authored fixed-light four-way union with four cardinal sockets and four genuine floor crooks; mask_15 now has direct proof-layer provenance.',
      alt: 'owner-accepted mask fifteen open-pocket four-way QuotaCo wall hub in source compact and long installed proofs',
    });
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE).toMatchObject({
      status: 'owner-accepted-open-pocket-cross-junction-gate',
      maskRowsUnderReview: [],
      maskRowsAccepted: [15],
      productionRegistration: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[15].resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
    });
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'review'))
      .toHaveLength(0);
  });

  it('keeps the accepted horizontal single-filled-pocket family explicit behind the cross-junction gate', () => {
    expect(ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'Horizontal single-filled-pocket T-junction family',
      summary: 'Accepted masks 18/22 as two fixed-light direct sources and masks 35/28 as approved whole-cell X derivations; cross-family south-face plane-cue continuity remains deferred polish.',
      alt: 'owner-accepted horizontal single-filled-pocket T-junction masks eighteen thirty-five twenty-two and twenty-eight in compact and long wall masses',
    });
    expect(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE).toMatchObject({
      status: 'owner-accepted-horizontal-partial-t-junction-gate',
      stateDiamonds: {
        openSouth: { openMaskIndex: 11, partialMaskIndices: [18, 35], filledMaskIndex: 38 },
        openNorth: { openMaskIndex: 14, partialMaskIndices: [22, 28], filledMaskIndex: 31 },
      },
      maskRowsUnderReview: [],
      maskRowsAccepted: [18, 35, 22, 28],
      xMirrorAllowed: true,
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.candidates)
      .toEqual([
        expect.objectContaining({
          maskIndex: 18, sourceMaskIndex: 18, sourceStem: 'open_s_t_filled_ne',
          transform: 'none', derivation: 'none',
          resolution: 'direct-reuse',
        }),
        expect.objectContaining({
          maskIndex: 35, sourceMaskIndex: 18, sourceStem: 'open_s_t_filled_ne',
          transform: 'mirror-x', derivation: 'accepted-southeast-seam-filter',
          resolution: 'approved-derivation',
        }),
        expect.objectContaining({
          maskIndex: 22, sourceMaskIndex: 22, sourceStem: 'open_n_t_filled_se',
          transform: 'none', derivation: 'none',
          resolution: 'direct-reuse',
        }),
        expect.objectContaining({
          maskIndex: 28, sourceMaskIndex: 22, sourceStem: 'open_n_t_filled_se',
          transform: 'mirror-x', derivation: 'none',
          resolution: 'approved-derivation',
        }),
      ]);
    expect(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.acceptedLedgerCounts)
      .toEqual({
        'direct-reuse': 24,
        'approved-derivation': 17,
        'synthetic-assembly': 6,
        'unresolved-authored-geometry': 0,
      });
    for (const index of [18, 35, 22, 28] as const) {
      expect(EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution).toMatchObject({
        kind: [18, 22].includes(index) ? 'direct-reuse' : 'approved-derivation',
        status: 'accepted-source-mapping',
      });
    }
  });

  it('keeps the accepted east partial T pair explicit', () => {
    expect(ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'East single-filled-pocket T-junction pair',
      summary: 'Accepted mask_36 as the filtered whole-cell X mirror of foreground mask_17 and mask_27 as the whole-cell X mirror of rear mask_21.',
      alt: 'owner-accepted east-side equal-height T junction masks thirty-six and twenty-seven with one filled diagonal and one open floor pocket',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[36].resolution).toMatchObject({
      kind: 'approved-derivation', status: 'accepted-source-mapping',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[27].resolution).toMatchObject({
      kind: 'approved-derivation', status: 'accepted-source-mapping',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 17,
      'synthetic-assembly': 6,
      'unresolved-authored-geometry': 0,
    });
  });

  it('keeps the accepted west partial T pair explicit', () => {
    expect(ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'Single-filled-pocket T-junction pair',
      summary: 'Accepted mask_17 and mask_21 as two separately authored west fixed-light direct proof sources; mask_36 and mask_27 are their accepted east-side mirror derivations.',
      alt: 'owner-accepted west-side equal-height T junction masks seventeen and twenty-one with one filled diagonal and one open floor pocket',
    });
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'accepted')).toHaveLength(5);
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'review'))
      .toHaveLength(0);
  });

  it('keeps the accepted horizontal open-pocket T pair explicit', () => {
    expect(ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'Horizontal open-pocket T-junction pair',
      summary: 'Accepted mask_11 and mask_14 as two separately authored fixed-light direct proof sources; same-mask lateral X mirrors remain comparison evidence, not accepted derivations.',
      alt: 'owner-accepted horizontal open-pocket T-junction pair with masks eleven and fourteen as direct fixed-light proof sources',
    });
  });

  it('keeps the accepted proof-layer T-junction identity explicit', () => {
    expect(ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'Open-pocket T-junction pair',
      summary: 'Accepted mask_7 as the authored open-west direct source and mask_13 as its approved whole-cell X mirror with the southeast boundary-seam filter.',
      alt: 'owner-accepted equal-height open-pocket T-junction pair with mask seven direct and mask thirteen as a filtered mirror',
    });
  });

  it('keeps the owner-facing decisions in explicit accepted states', () => {
    expect(CURRENT_WORKBENCH_BOARDS.map(({ stem, state }) => ({ stem, state }))).toEqual([
      { stem: 'full-height-east-proof', state: 'accepted' },
      { stem: 'full-height-northeast-proof', state: 'accepted' },
      { stem: 'full-height-south-proof', state: 'accepted' },
      { stem: 'full-height-southwest-proof', state: 'accepted' },
      { stem: 'full-height-southeast-proof', state: 'accepted' },
    ]);
  });

  it('keeps every accepted source and system gate explicit', () => {
    expect(ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE).toEqual({
      stem: EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem,
      state: 'accepted',
      title: 'N×2 thick-wall horizontal repeat unit',
      summary: 'Accepted masks 31/38 as two direct fixed-light middle sources, proven inside 3×2, 4×2, and 6×2 solid wall masses.',
      alt: 'owner-accepted equal-height horizontal thick-wall repeat family with masks thirty-one and thirty-eight as direct sources',
    });
    expect(ACCEPTED_THICK_WALL_REPEAT_GATE).toEqual({
      stem: EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE.stem,
      state: 'accepted',
      title: '2×N thick-wall repeat unit',
      summary: 'Accepted mask_24 as one west-authored open-Y cream spine and mask_42 as its approved whole-cell X mirror, proven inside 2×3, 2×4, and 2×6 solid wall masses.',
      alt: 'owner-accepted equal-height two-column thick-wall repeat family with mask twenty-four direct and mask forty-two mirrored',
    });
    expect(ACCEPTED_THICK_WALL_BLOCK_GATE).toEqual({
      stem: EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.stem,
      state: 'accepted',
      title: '2×2 thick-wall source family',
      summary: 'Accepted masks 16/20 as direct fixed-light sources and 26/34 as approved X mirrors: one continuous cream wall top with the south-facing material shade preserving the foreground plane break.',
      alt: 'owner-accepted equal-height two by two solid wall block assembled from direct and mirrored proof sources',
    });
    expect(ACCEPTED_ISOLATED_SHELL_GATE).toEqual({
      stem: EQUAL_HEIGHT_ISOLATED_SHELL_GATE.stem,
      state: 'accepted',
      title: 'mask_0 isolated structural shell',
      summary: 'Accepted direct source for one full-height zero-socket wall cell: a single molded tri-tone housing proven at 240/90/40 px and in compact floor contexts.',
      alt: 'owner-accepted mask zero isolated structural wall shell at multiple scales and compact placements',
    });
    expect(ACCEPTED_VERTICAL_TERMINUS_GATE).toEqual({
      stem: EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.stem,
      state: 'accepted',
      title: 'Vertical terminus family',
      summary: 'Accepted mask_1 south-facing and mask_4 north-facing wall-owned closures, with west-authored sources and approved east mirror-X derivations proven at 240/90/40 px and short/long runs.',
      alt: 'owner-accepted equal-height vertical terminus family with tri-tone exposed wall ends at multiple sizes and run lengths',
    });
    expect(ACCEPTED_CORRIDOR_GATE).toEqual({
      stem: EQUAL_HEIGHT_CORRIDOR_GATE.stem,
      state: 'accepted',
      title: '3×8 narrow-corridor closure',
      summary: 'Accepted equal-height enclosure baseline at 90 and 40 pixels per cell.',
      alt: 'accepted equal-height wall family narrow-corridor closure gate',
    });
    expect(ACCEPTED_MAPPING_GATE).toEqual({
      stem: EQUAL_HEIGHT_MASK_LEDGER.stem,
      state: 'accepted',
      title: '47-mask mapping ledger',
      summary: 'Accepted topology map: 24 direct reuses, 17 approved derivations, 6 synthetic cross-junction candidates, and 0 authored-geometry gaps.',
      alt: 'owner-accepted equal-height 47-mask mapping ledger with unaccepted synthetic candidates',
    });
    expect(ACCEPTED_HORIZONTAL_TERMINUS_GATE).toEqual({
      stem: EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.stem,
      state: 'accepted',
      title: 'Horizontal terminus pair',
      summary: 'Accepted mask_8 direct source and mask_2 whole-cell X mirror, proven at 90/40 px and across 1/3/6-cell runs.',
      alt: 'owner-accepted equal-height horizontal terminus direct and mirrored source sheet',
    });
    expect(ACCEPTED_MAPPING_GATE).not.toHaveProperty('productionRegistration');
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({
        stem: ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem,
      }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({
        stem: EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem,
      }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_CORRIDOR_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_MAPPING_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_CORRIDOR_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_MAPPING_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_HORIZONTAL_TERMINUS_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_VERTICAL_TERMINUS_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_ISOLATED_SHELL_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_ISOLATED_SHELL_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_THICK_WALL_BLOCK_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_THICK_WALL_BLOCK_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_THICK_WALL_REPEAT_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_THICK_WALL_REPEAT_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE.stem }),
    );
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE.stem }),
    );
  });

  it('shows only current boards in the open primary surface', () => {
    const page = renderStyleWorkbenchPage(['full_n_straight', 'transition_n_to_e']);
    const primary = page.match(/<main id="current-equal-height-wall-system">([\s\S]*?)<\/main>/)?.[1];

    expect(primary).toBeDefined();
    for (const board of CURRENT_WORKBENCH_BOARDS) {
      expect(occurrences(primary!, `data-stem="${board.stem}"`)).toBe(1);
      expect(primary).toContain(
        `data-stem="${board.stem}" data-refresh="${
          board.refreshGroup ?? 'focus'
        }"`,
      );
    }
    for (const board of ARCHIVED_WORKBENCH_BOARDS) {
      expect(primary).not.toContain(`data-stem="${board.stem}"`);
    }
    expect(primary).not.toContain('full_n_straight');
    expect(primary).not.toContain('transition_n_to_e');
    expect(primary?.trimStart()).toMatch(
      /^<section class="current-section system-accepted" aria-labelledby="accepted-double-filled-opposite-diagonal-cross-junction-title"/,
    );
    expect(primary).not.toContain('id="review-title">Review next</h2>');
    expect(occurrences(primary!, 'data-state="review"')).toBe(0);
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE.stem}" data-refresh="double-filled-opposite-diagonal-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="double-filled-opposite-diagonal-cross-junction"',
    );
    expect(primary).toContain('mask_40 opposite-diagonal cross-junction');
    expect(primary).toContain(
      'ledger row mask_40 are locked at the proof layer',
    );
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE.stem}" data-refresh="double-filled-diagonal-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="double-filled-diagonal-cross-junction"',
    );
    expect(primary).toContain('mask_30 diagonal-filled cross-junction');
    expect(primary).toContain('ledger row mask_30 are locked at the proof layer');
    expect(primary).toContain('mask_30 now has direct proof-layer provenance');
    expect(primary).toMatch(
      new RegExp(
        `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE.stem}"[\\s\\S]*?</section><section class="current-section system-accepted" aria-labelledby="accepted-double-filled-north-cross-junction-title">`,
      ),
    );
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE.stem}" data-refresh="double-filled-north-cross-junction"`,
    );
    expect(primary).toContain('mask_39 north-filled slab cross-junction');
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="double-filled-north-cross-junction"',
    );
    expect(primary).toContain('ledger row mask_39 are locked at the proof layer');
    expect(primary).toContain('mask_39 now has direct proof-layer provenance');
    expect(occurrences(
      primary!,
      `data-stem="${EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBe(1);
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE.stem}" data-refresh="single-filled-northwest-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="single-filled-northwest-cross-junction"',
    );
    expect(primary).toContain('mask_37 northwest-filled cross-junction');
    expect(primary).toContain('ledger row mask_37 are locked at the proof layer');
    expect(primary).toContain('mask_37 now has direct proof-layer provenance');
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE.stem}" data-refresh="single-filled-southwest-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="single-filled-southwest-cross-junction"',
    );
    expect(primary).toContain('mask_29 southwest-filled cross-junction');
    expect(primary).toContain('ledger row mask_29 are locked at the proof layer');
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.stem}" data-refresh="double-filled-west-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="double-filled-west-cross-junction"',
    );
    expect(primary).toContain('Accepted derivation gate');
    expect(primary).toContain('mask_43 west-filled slab junction');
    expect(primary).toContain('ledger row mask_43 are locked at the proof layer');
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem}" data-refresh="double-filled-east-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="double-filled-east-cross-junction"',
    );
    expect(primary).toContain('ledger row mask_25 are locked at the proof layer');
    expect(primary).toContain('mask_25 east-filled slab junction');
    expect(occurrences(
      primary!,
      `data-stem="${ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem}" data-refresh="single-filled-southeast-cross-junction"`,
    );
    expect(primary).toContain('mask_23 southeast-filled cross-junction');
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="single-filled-southeast-cross-junction"',
    );
    expect(primary).toContain('ledger row mask_23 are locked at the proof layer');
    expect(primary).toContain('mask_23 now has direct proof-layer provenance');
    expect(occurrences(
      primary!,
      `data-stem="${ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE.stem}"`,
    )).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE.stem}" data-refresh="single-filled-cross-junction"`,
    );
    expect(primary).toContain('mask_19 single-filled-crook cross-junction');
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="single-filled-cross-junction"',
    );
    expect(primary).toContain('ledger row mask_19 are locked at the proof layer');
    expect(primary).toContain('mask_19 now has direct proof-layer provenance');
    expect(occurrences(
      primary!,
      `data-stem="${ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE.stem}"`,
    )).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE.stem}" data-refresh="open-pocket-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="open-pocket-cross-junction"',
    );
    expect(primary).toContain('ledger row mask_15 are locked at the proof layer');
    expect(occurrences(
      primary!,
      `data-stem="${ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.stem}"`,
    )).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.stem}" data-refresh="horizontal-partial-t-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="horizontal-partial-t-junction"',
    );
    expect(primary).toContain('mask_18/mask_35/mask_22/mask_28 are locked at the proof layer');
    expect(primary).toContain('uniform south-face shading is deferred family-wide polish');
    expect(primary).toContain('24 direct reuses, 17 approved derivations, 6 synthetic cross-junction candidates');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE.stem}" data-refresh="east-partial-t-junction"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="east-partial-t-junction"');
    expect(primary).toContain('The filtered foreground mirror, rear mirror, and ledger rows mask_36/mask_27 are locked at the proof layer.');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE.stem}" data-refresh="single-filled-pocket-t-junction"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="single-filled-pocket-t-junction"');
    expect(occurrences(primary!, 'data-state="system-review"')).toBe(0);
    expect(primary).toContain('mask_17/mask_21 are locked at the proof layer');
    expect(primary).toContain('their east mirror rows are accepted separately');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.stem}" data-refresh="horizontal-open-pocket-t-junction"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="horizontal-open-pocket-t-junction"');
    expect(primary).toContain('mask_11/mask_14 are locked at the proof layer');
    expect(primary).toContain('lateral X mirrors remain comparison evidence only');
    expect(primary).not.toContain('data-state="system-review" data-gate="horizontal-open-pocket-t-junction"');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE.stem}" data-refresh="open-pocket-t-junction"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="open-pocket-t-junction"');
    expect(primary).toContain('Accepted mask_7 as the authored open-west direct source');
    expect(primary).toContain('mask_7/mask_13 are locked at the proof layer');
    expect(primary).not.toContain('data-state="system-review" data-gate="open-pocket-t-junction"');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem}" data-refresh="thick-wall-horizontal-repeat"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="thick-wall-horizontal-repeat"');
    expect(primary).toContain('Accepted masks 31/38 as two direct fixed-light middle sources');
    expect(primary).toContain('mask_31/mask_38 are locked at the proof layer');
    expect(primary).not.toContain('data-state="system-review" data-gate="thick-wall-horizontal-repeat"');
    expect(occurrences(primary!, 'Review · Proof only')).toBe(0);
    expect(occurrences(primary!, `data-stem="${ACCEPTED_THICK_WALL_REPEAT_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_THICK_WALL_REPEAT_GATE.stem}" data-refresh="thick-wall-repeat"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="thick-wall-repeat"');
    expect(primary).toContain('mask_24 as one west-authored');
    expect(primary).toContain('mask_24/mask_42 are locked at the proof layer');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_THICK_WALL_BLOCK_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_THICK_WALL_BLOCK_GATE.stem}" data-refresh="thick-wall-block"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="thick-wall-block"');
    expect(primary).toContain('Accepted · System gate');
    expect(primary).toContain('south-facing material shade preserving the foreground plane break');
    expect(primary).toContain('mask_16/mask_20/mask_26/mask_34 are locked at the proof layer');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_ISOLATED_SHELL_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_ISOLATED_SHELL_GATE.stem}" data-refresh="isolated-shell"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="isolated-shell"');
    expect(primary).toContain('The fixed-view isolated shell and ledger row mask_0 are locked at the proof layer.');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_VERTICAL_TERMINUS_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_VERTICAL_TERMINUS_GATE.stem}" data-refresh="vertical-terminus"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="vertical-terminus"');
    expect(primary).toContain('mask_1/mask_4 are locked at the proof layer');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_HORIZONTAL_TERMINUS_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_HORIZONTAL_TERMINUS_GATE.stem}" data-refresh="terminus"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="terminus"');
    expect(primary).toContain('Accepted source gate');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_MAPPING_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_MAPPING_GATE.stem}" data-refresh="mapping"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="mapping"');
    expect(primary).toContain('Accepted system mapping');
    expect(primary).toContain('The mapping structure is locked; its remaining 6 cross-junction assembly diagrams stay proof-only and no authored-geometry gaps remain.');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_CORRIDOR_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_CORRIDOR_GATE.stem}" data-refresh="corridor"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="corridor"');
    expect(primary).toContain('Accepted system proof');
    expect(primary).toContain('Accepted · System gate');
    expect(primary).toContain('Horizontal terminus pair');
    expect(primary).toContain('Accepted mask_8 direct source');
    expect(page).toMatch(/<p class="lede">No wall proposal is active\. The accepted proof ledger now stands at 24 direct \/ 17 derived \/ 6 synthetic\.<\/p>/);
    expect(page).not.toContain('Review next ·');
    expect(page).not.toContain(
      'These remain active proposals and are not yet in the accepted working set.',
    );
    expect(page).toContain('mask_40 is the accepted filtered whole-cell X mirror of mask_30');
    expect(page).toContain('mask_30 directly reuses one authored fixed-light four-way union');
    expect(page).toContain('mask_39 directly reuses one west-fixed authored four-way union');
    expect(page).toContain('mask_37 directly reuses one east-fixed authored four-way union');
    expect(page).toContain('mask_29 is the accepted plain whole-cell X mirror of mask_23');
    expect(page).toContain('mask_43 is the accepted plain whole-cell X mirror of mask_25');
    expect(page).toContain('mask_25 directly reuses one west-fixed authored union');
    expect(page).toContain('mask_23 directly reuses one west-fixed authored four-way union');
    expect(page).toContain('mask_19 directly reuses one west-fixed authored four-way union');
    expect(page).toContain('mask_18/mask_22 are direct; mask_35/mask_28 are approved X derivations');
    expect(page).toContain('South-face plane-cue continuity remains deferred family-wide polish');
    expect(page).toContain('mask_17 and mask_21 are accepted direct proof sources');
    expect(page).toContain('mask_36 and mask_27 are their accepted east-side mirror derivations');
    expect(page).toContain('mask_11 and mask_14 are direct fixed-light proof sources');
    expect(page).toContain('lateral X mirrors are evidence only, not accepted derivations');
    expect(page).toContain('mask_7 is direct; mask_13 is the approved whole-cell X mirror');
    expect(page).toContain('mask_31 and mask_38 are accepted as two direct fixed-light proof sources');
    expect(page).toContain('mask_24 is direct; mask_42 is the accepted whole-cell mirror-X derivation');
    expect(page).toContain('mask_0 is accepted as one fixed-view direct source with zero cardinal sockets');
    expect(page).not.toContain('sole unresolved authored row');
    expect(page).toContain('3×8 narrow-corridor closure');
    expect(page).toContain('Accepted equal-height enclosure baseline at 90 and 40 pixels per cell');
    expect(page).toContain('Accepted system mapping');
    expect(occurrences(page, '47-mask mapping ledger')).toBe(3);
    expect(page).toContain('6 remaining synthetic cross-junction candidates remain proof-only');
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(primary).toMatch(
      new RegExp(
        `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE.stem}"[\\s\\S]*?</section><section class="current-section system-accepted" aria-labelledby="accepted-single-filled-northwest-cross-junction-title">`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(primary).toMatch(
      new RegExp(
        `data-stem="${EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE.stem}"[\\s\\S]*?</section><section class="current-section system-accepted" aria-labelledby="accepted-single-filled-southwest-cross-junction-title">`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(`data-stem="${ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem}"`),
    );
    expect(page.indexOf(`data-stem="${ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_THICK_WALL_REPEAT_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_THICK_WALL_REPEAT_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_THICK_WALL_BLOCK_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_THICK_WALL_BLOCK_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_ISOLATED_SHELL_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_ISOLATED_SHELL_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_VERTICAL_TERMINUS_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_VERTICAL_TERMINUS_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_HORIZONTAL_TERMINUS_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_HORIZONTAL_TERMINUS_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_MAPPING_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_MAPPING_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_CORRIDOR_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_CORRIDOR_GATE.stem}"`))
      .toBeLessThan(page.indexOf('id="accepted-title"'));
    expect(page).toContain('<link rel="icon" href="data:,">');
    expect(page).toContain('Accepted working set · 5 pieces');
    expect(page).toContain('East wall · Northeast corner · South wall · Southwest corner · Southeast corner');
  });

  it('keeps historical checkpoints and compiler cards closed and unambiguous', () => {
    const page = renderStyleWorkbenchPage(['full_n_straight', 'transition_n_to_e']);

    expect(page).toContain('<details class="archive"><summary>Archived checkpoints — not current');
    expect(page).toContain('<details class="diagnostics"><summary>Compiler diagnostics — not approval status');
    expect(page).not.toMatch(/<details class="(?:archive|diagnostics)" open/);
    expect(page).not.toContain('superseded comparison checkpoint');
    for (const board of ARCHIVED_WORKBENCH_BOARDS) {
      expect(occurrences(page, `data-stem="${board.stem}"`)).toBe(1);
    }
    expect(occurrences(page, 'data-stem="full_n_straight"')).toBe(1);
    expect(occurrences(page, 'data-stem="transition_n_to_e"')).toBe(1);
  });

  it('refreshes by declared groups without requiring any single figure to exist', () => {
    const page = renderStyleWorkbenchPage([]);

    expect(page).toContain('document.querySelectorAll(`[data-refresh="${group}"]`)');
    expect(page).toContain('"double-filled-opposite-diagonal-cross-junction":s.doubleFilledOppositeDiagonalCrossJunctionRenderedAt');
    expect(page).toContain('"double-filled-diagonal-cross-junction":s.doubleFilledDiagonalCrossJunctionRenderedAt');
    expect(page).toContain('"double-filled-north-cross-junction":s.doubleFilledNorthCrossJunctionRenderedAt');
    expect(page).toContain('"single-filled-northwest-cross-junction":s.singleFilledNorthwestCrossJunctionRenderedAt');
    expect(page).toContain('"single-filled-southwest-cross-junction":s.singleFilledSouthwestCrossJunctionRenderedAt');
    expect(page).toContain('"double-filled-west-cross-junction":s.doubleFilledWestCrossJunctionRenderedAt');
    expect(page).toContain('"double-filled-east-cross-junction":s.doubleFilledEastCrossJunctionRenderedAt');
    expect(page).toContain('"single-filled-southeast-cross-junction":s.singleFilledSoutheastCrossJunctionRenderedAt');
    expect(page).toContain('"single-filled-cross-junction":s.singleFilledCrossJunctionRenderedAt');
    expect(page).toContain('"open-pocket-cross-junction":s.openPocketCrossJunctionRenderedAt');
    expect(page).toContain('"horizontal-partial-t-junction":s.horizontalPartialTJunctionRenderedAt');
    expect(page).toContain('"east-partial-t-junction":s.eastPartialTJunctionRenderedAt');
    expect(page).toContain('"single-filled-pocket-t-junction":s.singleFilledPocketTJunctionRenderedAt');
    expect(page).toContain('"horizontal-open-pocket-t-junction":s.horizontalOpenPocketTJunctionRenderedAt');
    expect(page).toContain('"open-pocket-t-junction":s.openPocketTJunctionRenderedAt');
    expect(page).toContain('"thick-wall-horizontal-repeat":s.thickWallHorizontalRepeatRenderedAt');
    expect(page).toContain('"thick-wall-repeat":s.thickWallRepeatRenderedAt');
    expect(page).toContain('"thick-wall-block":s.thickWallBlockRenderedAt');
    expect(page).toContain('"isolated-shell":s.isolatedShellRenderedAt');
    expect(page).toContain('"vertical-terminus":s.verticalTerminusRenderedAt');
    expect(page).toContain('terminus:s.terminusRenderedAt');
    expect(page).toContain('mapping:s.mappingRenderedAt');
    expect(page).toContain('corridor:s.corridorRenderedAt');
    expect(page).not.toContain('querySelector("figure.gate")');
    expect(page).not.toContain('querySelector("figure.proofs")');
  });
});
