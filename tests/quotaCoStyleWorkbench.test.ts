import { describe, expect, it } from 'vitest';

import {
  ACCEPTED_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE,
  ACCEPTED_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,
  ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE,
  ACCEPTED_FULLY_FILLED_CROSS_JUNCTION_GATE,
  ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE,
  ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE,
  ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
  ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE,
  ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE,
  ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE,
  ACCEPTED_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE,
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
import { EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE } from '../scripts/highOblique/equalHeightAllMaskConsistencyGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledEastCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledNorthCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledOppositeDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledSouthCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightDoubleFilledWestCrossJunctionGate';
import { EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE } from '../scripts/highOblique/equalHeightEastPartialTJunctionGate';
import { EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightFullyFilledCrossJunctionGate';
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
import { EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleOpenNortheastCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleOpenNorthwestCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleOpenSoutheastCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleOpenSouthwestCrossJunctionGate';
import { EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE } from '../scripts/highOblique/equalHeightThickWallBlockGate';
import { EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE } from '../scripts/highOblique/equalHeightThickWallHorizontalRepeatGate';
import { EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE } from '../scripts/highOblique/equalHeightThickWallRepeatGate';
import { EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE } from '../scripts/highOblique/equalHeightVerticalTerminusGate';
import { EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE } from '../scripts/highOblique/equalHeightWestPartialTJunctionGate';

const occurrences = (source: string, needle: string): number => source.split(needle).length - 1;

describe('QuotaCo current wall workbench', () => {
  it('keeps accepted mask_46 ahead of mask_45 and the accepted single-open controls', () => {
    expect(ACCEPTED_FULLY_FILLED_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_46 fully filled center',
      summary:
        'Accepted one independently authored flattened buried-center pair. All four cardinal sockets and all four diagonal crooks are occupied; accepted perimeter pieces own every visible face cue.',
      alt:
        'owner-accepted mask forty-six QuotaCo fully filled buried center source in three by three four by four and six by six solid wall masses',
    });
    expect(ACCEPTED_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_45 single-open northeast cross-junction',
      summary:
        'Accepted the plain whole-cell X mirror of mask_33; southeast, southwest, and northwest are solid while the northeast floor crook remains open, with the shared outer-ledger reveal correction inherited unchanged.',
      alt:
        'owner-accepted mask forty-five QuotaCo single-open northeast cross-junction plain whole-cell X derivation in source compact and long installed proofs',
    });
    expect(ACCEPTED_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_33 single-open northwest cross-junction',
      summary:
        'Accepted one independently authored fixed-view four-way union with northeast, southeast, and southwest solid while the northwest floor crook remains open; its reveal band and dark arris seam now share one outer ledge.',
      alt:
        'owner-accepted mask thirty-three QuotaCo single-open northwest cross-junction in source compact and long installed proofs',
    });
    expect(ACCEPTED_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_44 single-open southeast cross-junction',
      summary:
        'Accepted the plain whole-cell X mirror of mask_41; northwest, northeast, and southwest are solid while the southeast floor crook remains open.',
      alt:
        'owner-accepted mask forty-four QuotaCo single-open southeast cross-junction plain whole-cell X derivation in source compact and long installed proofs',
    });
    expect(ACCEPTED_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_41 single-open southwest cross-junction',
      summary:
        'Accepted one independently authored fixed-view four-way union with northeast, southeast, and northwest solid while the southwest floor crook remains open. Its shade, coral, green, highlight, and seam share one curved return into the south socket; mask_44 inherits the same pixels through its plain X mirror.',
      alt:
        'owner-accepted mask forty-one QuotaCo single-open southwest cross-junction in source compact and long installed proofs',
    });
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'review'))
      .toEqual([
        {
          stem: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem,
          previewStem: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewStem,
          state: 'review',
          status: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.status,
          refreshGroup: 'consistency',
          title: 'All-47 family consistency review',
          summary: 'Paused, review-only whole-vocabulary pass across all 50 accepted visual presentations, compact occupancy, direct/derived pairs, 1/3/6-cell extents, and light/dark composed environments. The accepted source-owned 112-unit footprint and 28/19/0/0 ledger remain frozen.',
          alt: 'review-only QuotaCo equal-height all forty-seven mask family consistency sheet across scales grounds derivations sockets extents and composed environments',
        },
      ]);
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'accepted'))
      .toHaveLength(5);
    expect(EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE)
      .toMatchObject({
        candidate: {
          maskIndex: 33,
          sourceMaskIndex: 33,
          connectedEdges: ['n', 'e', 's', 'w'],
          openPockets: ['nw'],
          solidDiagonals: ['ne', 'se', 'sw'],
          transform: 'none',
          derivation: 'none',
          resolution: 'direct-reuse',
        },
        baselineMaskRows: [25, 32, 30],
        maskRowsUnderReview: [],
        maskRowsAccepted: [33],
        acceptedLedgerCounts: {
          'direct-reuse': 28,
          'approved-derivation': 19,
          'synthetic-assembly': 0,
          'unresolved-authored-geometry': 0,
        },
        directSourceAccepted: true,
        productionRegistration: false,
        productionTopologyMutation: false,
        schemaChange: false,
        exportable: false,
        committedAtlas: false,
      });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[33]).toMatchObject({
      index: 33,
      pockets: ['nw'],
      solidDiagonals: ['ne', 'se', 'sw'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[41]).toMatchObject({
      index: 41,
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[44]).toMatchObject({
      index: 44,
      pockets: ['se'],
      solidDiagonals: ['ne', 'sw', 'nw'],
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[45]).toMatchObject({
      index: 45,
      pockets: ['ne'],
      solidDiagonals: ['se', 'sw', 'nw'],
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[46]).toMatchObject({
      index: 46,
      pockets: [],
      solidDiagonals: ['ne', 'se', 'sw', 'nw'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 28,
      'approved-derivation': 19,
      'synthetic-assembly': 0,
      'unresolved-authored-geometry': 0,
    });
  });

  it('locks the accepted mask_32 direct source behind accepted mask_41', () => {
    expect(ACCEPTED_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_32 south-filled slab cross-junction',
      summary:
        'Accepted one independently authored fixed-view union for a two-row south slab with a centered north spur. Both southern diagonals are solid, both northern crooks remain open floor, and mask_32 now has direct proof-layer provenance.',
      alt:
        'owner-accepted mask thirty-two QuotaCo south-filled slab cross-junction in source compact and long installed proofs',
    });
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'review'))
      .toHaveLength(1);
    expect(CURRENT_WORKBENCH_BOARDS.filter(({ state }) => state === 'accepted'))
      .toHaveLength(5);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[32]).toMatchObject({
      index: 32,
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
      'unresolved-authored-geometry': 0,
    });
  });

  it('places accepted mask_30 ahead of the accepted mask_39 and mask_37 gates', () => {
    expect(ACCEPTED_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_30 diagonal-filled cross-junction',
      summary: 'Accepted one authored fixed-light union with northeast and southwest solid, northwest and southeast open floor, and the northwest reveal plus dark arris seam phased onto one shared outer ledge; filtered-X mask_40 inherits the correction.',
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
    'direct-reuse': 28,
          'approved-derivation': 19,
    'synthetic-assembly': 0,
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
      summary: 'Accepted one authored west-fixed union for a two-row north slab with a south spur. Its cream plane, light arris, dimensional shade, and seam share one parallel curve into the existing coral/green south-branch return while all socket pixels remain fixed.',
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
    'direct-reuse': 28,
          'approved-derivation': 19,
    'synthetic-assembly': 0,
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
      summary: 'Accepted one separately authored east-register four-way union with a solid northwest crook and three genuine floor crooks. Its southwest cream plane, light arris, dimensional shade, and seam share one nested curve into the existing coral/green return while every full-resolution socket pixel remains fixed.',
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
    'direct-reuse': 28,
          'approved-derivation': 19,
    'synthetic-assembly': 0,
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
      .toHaveLength(1);
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
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
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
      summary: 'Accepted the plain whole-cell X mirror of mask_23 as one east-register four-way union; it inherits the synchronized cream, arris, shade, coral, green, and seam turn without filtering or moving any socket pixel.',
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
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
      'unresolved-authored-geometry': 0,
    });
  });

  it('keeps mask_43 immediately behind the accepted mask_29 derivation gate', () => {
    expect(ACCEPTED_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_43 west-filled slab junction',
      summary: 'Accepted the plain whole-cell X mirror of mask_25 for an east branch entering a two-cell-wide north–south slab; it inherits one local cream reveal exposure through the turn while preserving the outer socket bands.',
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
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
      'unresolved-authored-geometry': 0,
    });
  });

  it('keeps accepted mask_25 immediately behind accepted mask_43 without adding either to the ordinary board manifest', () => {
    expect(ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'mask_25 east-filled slab junction',
      summary: 'Accepted one west-fixed authored union for a west branch entering a two-cell-wide north–south slab; its local x=58…120 highlight keeps one cream reveal exposure through the turn while preserving the outer socket bands.',
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
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
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
      summary: 'Accepted one west-fixed authored four-way union with a solid southeast crook and three genuine floor crooks. Its northeast cream plane, light arris, dimensional shade, coral, green, and both seams share one nested curve inherited unchanged by the plain-X mask_29 companion while every full-resolution socket pixel remains fixed.',
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
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
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
      summary: 'Accepted one west-fixed authored four-way union with a solid northeast crook and three genuine floor crooks. Its northwest reveal and dark arris seam now share the outer ledge, while the approved southeast cream, shade, and material return remain fixed.',
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
      .toHaveLength(1);
  });

  it('keeps the accepted horizontal single-filled-pocket family explicit behind the cross-junction gate', () => {
    expect(ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE).toEqual({
      stem: EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.stem,
      state: 'accepted',
      title: 'Horizontal single-filled-pocket T-junction family',
      summary: 'Accepted masks 18/22 as two fixed-light direct sources and masks 35/28 as approved whole-cell X derivations. Masks 22/28 share the approved shade, cream lip, dark outline, coral, and green hierarchy on the exposed south face.',
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
    'direct-reuse': 28,
        'approved-derivation': 19,
    'synthetic-assembly': 0,
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
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
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
      .toHaveLength(1);
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

  it('keeps ordinary accepted pieces unchanged behind the active consistency review', () => {
    expect(CURRENT_WORKBENCH_BOARDS.map(({ stem, state }) => ({ stem, state }))).toEqual([
      { stem: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem, state: 'review' },
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
      summary: 'Accepted topology map: 28 direct reuses, 19 approved derivations, 0 synthetic candidates, and 0 authored-geometry gaps.',
      alt: 'owner-accepted equal-height 47-mask mapping ledger with all proof-layer rows resolved',
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
        `data-stem="${board.stem}"${
          board.previewStem === undefined
            ? ''
            : ` data-preview-stem="${board.previewStem}"`
        } data-refresh="${
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
      /^<section class="current-section review" aria-labelledby="review-title"/,
    );
    expect(primary).toContain('id="review-title">Review next</h2>');
    expect(occurrences(primary!, 'data-state="review"')).toBe(1);
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem}" data-preview-stem="${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewStem}" data-refresh="consistency"`,
    );
    expect(primary).toContain('All-47 family consistency review');
    expect(primary).not.toContain(
      'review-only-fully-filled-cross-junction-proposal',
    );
    expect(primary).not.toContain(
      'equal-height-fully-filled-cross-junction-proposal',
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="fully-filled-cross-junction"',
    );
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE.stem}" data-refresh="fully-filled-cross-junction"`,
    );
    expect(primary).toContain('mask_46 fully filled center');
    expect(primary).toContain(
      'ledger row mask_46 are locked at the proof layer',
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="single-open-northeast-cross-junction"',
    );
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE.stem}" data-refresh="single-open-northeast-cross-junction"`,
    );
    expect(primary).toContain(
      '<img alt="owner-accepted mask forty-five QuotaCo single-open northeast cross-junction plain whole-cell X derivation in source compact and long installed proofs">',
    );
    expect(primary).not.toContain(
      `<img src="${EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE.stem}.png"`,
    );
    expect(primary).toContain(
      'mask_45 single-open northeast cross-junction',
    );
    expect(primary).toContain(
      'ledger row mask_45 are locked at the proof layer',
    );
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE.stem}" data-refresh="single-open-northwest-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="single-open-northwest-cross-junction"',
    );
    expect(primary).toContain('Accepted source gate');
    expect(primary).toContain('mask_33 single-open northwest cross-junction');
    expect(primary).toContain('ledger row mask_33 are locked at the proof layer');
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE.stem}" data-refresh="single-open-southeast-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="single-open-southeast-cross-junction"',
    );
    expect(primary).toContain('Accepted derivation gate');
    expect(primary).toContain('mask_44 single-open southeast cross-junction');
    expect(primary).toContain('ledger row mask_44 are locked at the proof layer');
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE.stem}" data-refresh="single-open-southwest-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="single-open-southwest-cross-junction"',
    );
    expect(primary).toContain('mask_41 single-open southwest cross-junction');
    expect(primary).toContain('ledger row mask_41 are locked at the proof layer');
    expect(primary).toContain(
      'approved shared shade, coral, green, highlight, and seam curve',
    );
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE.stem}" data-refresh="double-filled-south-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="double-filled-south-cross-junction"',
    );
    expect(primary).toContain('mask_32 south-filled slab cross-junction');
    expect(primary).toContain('ledger row mask_32 are locked at the proof layer');
    expect(primary).toMatch(
      new RegExp(
        `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE.stem}"[\\s\\S]*?</section><section class="current-section system-accepted" aria-labelledby="accepted-double-filled-opposite-diagonal-cross-junction-title">`,
      ),
    );
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
    expect(primary).toContain(
      'filtered-X mask_40 inherits the correction',
    );
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
    expect(primary).toContain(
      'approved parallel cream, arris, shade, and seam curve',
    );
    expect(primary).toContain('all socket pixels remain fixed');
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
    expect(primary).toContain(
      'approved nested southwest cream, arris, shade, and seam curve',
    );
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
    expect(primary).toContain('approved shared reveal exposure and unchanged socket bands');
    expect(primary).toContain(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem}" data-refresh="double-filled-east-cross-junction"`,
    );
    expect(primary).toContain(
      'data-state="system-accepted" data-gate="double-filled-east-cross-junction"',
    );
    expect(primary).toContain('ledger row mask_25 are locked at the proof layer');
    expect(primary).toContain('one local cream reveal exposure through the turn and unchanged socket bands');
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
    expect(primary).toContain(
      'ledger row mask_23 are locked at the proof layer with the approved nested cream, arris, shade, coral, green, and seam turn',
    );
    expect(primary).toContain(
      'Accepted one west-fixed authored four-way union with a solid southeast crook and three genuine floor crooks. Its northeast cream plane, light arris, dimensional shade, coral, green, and both seams share one nested curve',
    );
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
    expect(primary).toContain('approved parallel cream, arris, shade, and seam turn');
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
    expect(primary).toContain('masks 22/28 share the approved shade, cream lip, dark outline, coral, and green hierarchy');
    expect(primary).toContain('28 direct reuses, 19 approved derivations, 0 synthetic candidates');
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
    expect(occurrences(primary!, 'Review next')).toBe(2);
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
    expect(primary).toContain('The mapping structure is locked; all 47 rows have accepted direct or derived proof-layer provenance and no authored-geometry gaps remain.');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_CORRIDOR_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_CORRIDOR_GATE.stem}" data-refresh="corridor"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="corridor"');
    expect(primary).toContain('Accepted system proof');
    expect(primary).toContain('Accepted · System gate');
    expect(primary).toContain('Horizontal terminus pair');
    expect(primary).toContain('Accepted mask_8 direct source');
    expect(page).toContain(
      '<p class="lede">The source-owned 112-unit all-47 footprint is accepted and now feeds the production office-wall exporter and atlas.',
    );
    expect(page).toContain('Paused review · 1 piece');
    expect(page).toContain(
      'This remains review-only and is not part of the accepted working set.',
    );
    expect(page).toContain('Accepted system geometry');
    expect(page).toContain('112-unit all-47 wall footprint');
    expect(page).toContain('11.5..123.5 direct/high and 4.5..116.5 mirrored/low');
    expect(page).toContain('mask_46 directly reuses one independently authored flattened buried-center pair');
    expect(page).toContain('mask_45 is the accepted plain whole-cell X mirror of mask_33');
    expect(page).toContain('mask_33 directly reuses one independently authored fixed-view union');
    expect(page).toContain('mask_44 is the accepted plain whole-cell X mirror of mask_41');
    expect(page).toContain('mask_41 directly reuses one independently authored fixed-view union');
    expect(page).toContain('mask_32 directly reuses one independently authored fixed-view union');
    expect(page).toContain('mask_40 is the accepted filtered whole-cell X mirror of mask_30');
    expect(page).toContain('mask_30 directly reuses one authored fixed-light four-way union');
    expect(page).toContain('mask_39 directly reuses one west-fixed authored four-way union');
    expect(page).toContain(
      'one approved parallel shared-turn curve across cream, arris, shade, and seam',
    );
    expect(page).toContain('mask_37 directly reuses one east-fixed authored four-way union');
    expect(page).toContain('mask_29 is the accepted plain whole-cell X mirror of mask_23');
    expect(page).toContain('mask_43 is the accepted plain whole-cell X mirror of mask_25');
    expect(page).toContain('mask_25 directly reuses one west-fixed authored union');
    expect(page).toContain('mask_23 directly reuses one west-fixed authored four-way union');
    expect(page).toContain('mask_19 directly reuses one west-fixed authored four-way union');
    expect(page).toContain(
      'approved shared right-hand curve and one combined coral/green return',
    );
    expect(page).toContain('mask_18/mask_22 are direct; mask_35/mask_28 are approved X derivations');
    expect(page).toContain('Masks 22/28 share the approved shade, cream lip, dark outline, coral, and green hierarchy');
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
    expect(page).toContain('all rows have accepted direct or derived proof-layer provenance and no synthetic candidates remain');
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
    expect(page.indexOf(
      `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE.stem}"`,
    )).toBeLessThan(
      page.indexOf(
        `data-stem="${EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE.stem}"`,
      ),
    );
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

  it('eagerly loads only the bounded active-review preview', () => {
    const page = renderStyleWorkbenchPage([
      'full_n_straight',
      'transition_n_to_e',
    ]);
    const imageTags = [...page.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
    const eagerImages = imageTags.filter((tag) => tag.includes(' src="'));

    expect(eagerImages).toEqual([
      `<img src="${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewStem}.png" alt="review-only QuotaCo equal-height all forty-seven mask family consistency sheet across scales grounds derivations sockets extents and composed environments bounded preview">`,
    ]);
    expect(page).not.toContain(
      `<img src="${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem}.png"`,
    );
    expect(page).toContain(
      `data-stem="${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem}" data-preview-stem="${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewStem}"`,
    );
    expect(page).toContain('data-full-resolution="download-only"');
    expect(page).toContain(
      `<a href="${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem}.png" download>Download full-resolution PNG</a>`,
    );
    expect(page).toContain(
      'The full sheet is download-only and is never decoded by this page.',
    );
  });

  it('keeps accepted, archived, and diagnostic images unloaded behind controls', () => {
    const page = renderStyleWorkbenchPage([
      'full_n_straight',
      'transition_n_to_e',
    ]);
    const imageTags = [...page.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
    const unloadedImages = imageTags.filter((tag) => !tag.includes(' src="'));

    expect(unloadedImages.length).toBeGreaterThan(0);
    expect(occurrences(page, 'data-loadable="true"')).toBe(imageTags.length);
    expect(occurrences(page, '<button type="button" data-action="load"'))
      .toBe(imageTags.length);
    expect(occurrences(page, '<button type="button" data-action="unload"'))
      .toBe(imageTags.length);
    expect(page).toContain(
      `data-stem="${ACCEPTED_MAPPING_GATE.stem}" data-refresh="mapping" data-loadable="true" data-loaded="false"`,
    );
    expect(page).toContain(
      'data-stem="transition-w-to-s-focus" data-refresh="focus" data-loadable="true" data-loaded="false"',
    );
    expect(page).toContain(
      'data-stem="full_n_straight" data-refresh="root" data-loadable="true" data-loaded="false"',
    );
    expect(page).toContain(
      '<button type="button" data-action="load">Load image</button><button type="button" data-action="unload" disabled>Unload image</button>',
    );
    expect(page).toContain('image.removeAttribute("src")');
    expect(page).toContain('setFigureLoaded(figure,target.dataset.action==="load")');
  });

  it('seeds first-tick stamps without cache-busting and refreshes only loaded figures', () => {
    const page = renderStyleWorkbenchPage([]);

    expect(page).toContain(
      'if(!(group in stamps)){stamps[group]=next;continue;}',
    );
    expect(page).toContain(
      'if(image?.hasAttribute("src"))image.src=resourceUrl(figure);',
    );
    expect(page).not.toContain('Date.now()');
    expect(page).not.toContain(
      'if(next&&stamps[group]!==next){stamps[group]=next;',
    );
  });

  it('refreshes by declared groups without requiring any single figure to exist', () => {
    const page = renderStyleWorkbenchPage([]);

    expect(page).toContain('document.querySelectorAll(`[data-refresh="${group}"]`)');
    expect(page).toContain('"single-open-northeast-cross-junction":s.singleOpenNortheastCrossJunctionRenderedAt');
    expect(page).toContain('"single-open-northwest-cross-junction":s.singleOpenNorthwestCrossJunctionRenderedAt');
    expect(page).toContain('"single-open-southeast-cross-junction":s.singleOpenSoutheastCrossJunctionRenderedAt');
    expect(page).toContain('"single-open-southwest-cross-junction":s.singleOpenSouthwestCrossJunctionRenderedAt');
    expect(page).toContain('"double-filled-south-cross-junction":s.doubleFilledSouthCrossJunctionRenderedAt');
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
    expect(page).toContain('consistency:s.consistencyRenderedAt');
    expect(page).toContain('corridor:s.corridorRenderedAt');
    expect(page).toContain('"fully-filled-cross-junction":s.fullyFilledCrossJunctionRenderedAt');
    expect(page).not.toContain('querySelector("figure.gate")');
    expect(page).not.toContain('querySelector("figure.proofs")');
  });
});
