import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_FOOTPRINT_BOUNDARY,
  EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM,
  EQUAL_HEIGHT_FOOTPRINT_PROFILES,
  EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES,
  EQUAL_HEIGHT_FOOTPRINT_REPRESENTATIVE_MASKS,
  EQUAL_HEIGHT_FOOTPRINT_SELECTED_PROFILE_ID,
  EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
  calibrateEqualHeightFootprintShape,
  calibrateEqualHeightFootprintShapes,
  equalHeightFootprintScale,
  equalHeightFootprintSourceBackDatum,
  transformEqualHeightFootprintPoint,
  type EqualHeightFootprintProfile,
  type EqualHeightFootprintSourceState,
} from '../scripts/highOblique/equalHeightFootprintCalibration';
import {
  equalHeightAllMaskSourceFootprintState,
} from '../scripts/highOblique/equalHeightFootprintAllMaskCalibration';
import {
  compileEqualHeightEvaluationFrames,
  type CompiledEqualHeightFrame,
} from '../scripts/walls/equalHeightImporter';
import { composeWallShapes } from '../src/core/compositor';
import { defaultProject } from '../src/data/defaults';
import type { ShapeSpec } from '../src/core/types';

const SOURCE_ROOTS = [
  {
    inputDir: path.resolve('assets/walls/quota-co-building-system'),
    sourcePathPrefix: 'assets/walls/quota-co-building-system',
  },
  {
    inputDir: path.resolve(
      'assets/walls/quota-co-building-system-proofs',
    ),
    sourcePathPrefix:
      'assets/walls/quota-co-building-system-proofs',
  },
] as const;

const profile = (
  id: EqualHeightFootprintProfile['id'],
): EqualHeightFootprintProfile => {
  const result = EQUAL_HEIGHT_FOOTPRINT_PROFILES.find(
    (candidate) => candidate.id === id,
  );
  if (!result) throw new Error(`Missing footprint profile ${id}`);
  return result;
};

let compiledFrames: Promise<CompiledEqualHeightFrame[]> | undefined;

function frames(): Promise<CompiledEqualHeightFrame[]> {
  compiledFrames ??= compileEqualHeightEvaluationFrames({
    sourceRoots: SOURCE_ROOTS,
  });
  return compiledFrames;
}

async function sourceState(): Promise<EqualHeightFootprintSourceState> {
  return equalHeightAllMaskSourceFootprintState(await frames());
}

function stripSvgShell(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

describe('QuotaCo equal-height footprint calibration proof', () => {
  it('declares four explicit review profiles and no production integration', () => {
    expect(
      EQUAL_HEIGHT_FOOTPRINT_PROFILES.map(
        ({ id, targetThickness, role }) => ({
          id,
          targetThickness,
          role,
        }),
      ),
    ).toEqual([
      {
        id: 'current-68',
        targetThickness: 68,
        role: 'current',
      },
      {
        id: 'candidate-96',
        targetThickness: 96,
        role: 'lighter-candidate',
      },
      {
        id: 'candidate-112',
        targetThickness: 112,
        role: 'selected-candidate',
      },
      {
        id: 'control-128',
        targetThickness: 128,
        role: 'overscan-control',
      },
    ]);
    expect(EQUAL_HEIGHT_FOOTPRINT_BOUNDARY).toEqual({
      reviewOnly: false,
      comparisonProfilesReviewOnly: true,
      acceptedSourceState: 'accepted-112',
      modifiesAcceptedSourceSvg: true,
      all47Propagation: true,
      exporterIntegration: false,
      schemaChange: false,
      unityRegistration: false,
    });
    expect(EQUAL_HEIGHT_FOOTPRINT_SELECTED_PROFILE_ID).toBe(
      'candidate-112',
    );
  });

  it('keeps the source-matching profile byte-identical', async () => {
    const state = await sourceState();
    const sourceProfile = profile(
      state === 'accepted-112' ? 'candidate-112' : 'current-68',
    );
    const result = await frames();
    for (const mask of EQUAL_HEIGHT_FOOTPRINT_REPRESENTATIVE_MASKS) {
      const source = result[mask].shapes;
      const calibrated = calibrateEqualHeightFootprintShapes(
        source,
        EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES[mask],
        sourceProfile,
        state,
      );
      expect(calibrated, `mask_${mask}`).toBe(source);
      expect(JSON.stringify(calibrated), `mask_${mask}`).toBe(
        JSON.stringify(source),
      );
    }
  });

  it('grows only toward north and west around the fixed frontage datum', () => {
    const expectedBackDatums = {
      'current-68': 56,
      'candidate-96': 27.5,
      'candidate-112': 11.5,
      'control-128': -4.5,
    } as const;
    for (const candidate of EQUAL_HEIGHT_FOOTPRINT_PROFILES) {
      const back = transformEqualHeightFootprintPoint(
        {
          x: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
          y: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
        },
        'both',
        candidate,
      );
      const front = transformEqualHeightFootprintPoint(
        {
          x: EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM,
          y: EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM,
        },
        'both',
        candidate,
      );
      expect(back.x, candidate.id).toBeCloseTo(
        expectedBackDatums[candidate.id],
        6,
      );
      expect(back.y, candidate.id).toBeCloseTo(
        expectedBackDatums[candidate.id],
        6,
      );
      expect(front, candidate.id).toEqual({
        x: EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM,
        y: EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM,
      });
    }
  });

  it('preserves each run axis while expanding only its cross axis', () => {
    const candidate = profile('candidate-96');
    const point = { x: 37, y: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM };
    const horizontal = transformEqualHeightFootprintPoint(
      point,
      'y',
      candidate,
    );
    expect(horizontal.x).toBe(point.x);
    expect(horizontal.y).toBeCloseTo(27.5, 6);

    const vertical = transformEqualHeightFootprintPoint(
      {
        x: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
        y: 37,
      },
      'x',
      candidate,
    );
    expect(vertical.x).toBeCloseTo(27.5, 6);
    expect(vertical.y).toBe(37);
  });

  it('keeps the mirrored east frontage fixed after calibration', () => {
    const candidate = profile('candidate-96');
    const directBack = transformEqualHeightFootprintPoint(
      { x: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM, y: 0 },
      'x',
      candidate,
    ).x;
    const directFront = transformEqualHeightFootprintPoint(
      { x: EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM, y: 0 },
      'x',
      candidate,
    ).x;
    expect(128 - directFront).toBe(4.5);
    expect(128 - directBack).toBe(100.5);
  });

  it('rephases every drawable path together without changing paint metadata', () => {
    const source: ShapeSpec = {
      d: 'M56 56H123.5V123.5H56Z',
      fill: '#f4e4be',
      stroke: '#272b29',
      strokeWidth: 2,
      opacity: 0.75,
      silhouette: false,
    };
    const calibrated = calibrateEqualHeightFootprintShape(
      source,
      'both',
      profile('candidate-112'),
    );
    expect(calibrated).not.toBe(source);
    expect(calibrated.d).not.toBe(source.d);
    expect({ ...calibrated, d: source.d }).toEqual(source);
    expect(calibrated.d).toContain('11.5');
    expect(calibrated.d).toContain('123.5');
  });

  it('maps only proof representatives and their installed-context termini', () => {
    expect(EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES).toEqual({
      1: 'x',
      2: 'y',
      5: 'x',
      6: 'both',
      8: 'y',
      10: 'y',
    });
    expect(EQUAL_HEIGHT_FOOTPRINT_REPRESENTATIVE_MASKS).toEqual([
      10,
      5,
      6,
      8,
    ]);
  });

  it('transforms compiled proof masks deterministically without mutating them', async () => {
    const result = await frames();
    const state = await sourceState();
    const candidate = profile('candidate-112');
    for (const [maskText, axis] of Object.entries(
      EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES,
    )) {
      const mask = Number(maskText);
      const source = result[mask].shapes;
      const before = JSON.stringify(source);
      const first = calibrateEqualHeightFootprintShapes(
        source,
        axis,
        candidate,
        state,
      );
      const second = calibrateEqualHeightFootprintShapes(
        source,
        axis,
        candidate,
        state,
      );
      expect(first, `mask_${mask}`).toHaveLength(source.length);
      expect(JSON.stringify(first), `mask_${mask}`).toBe(
        JSON.stringify(second),
      );
      expect(JSON.stringify(source), `mask_${mask}`).toBe(before);
    }
  });

  it('keeps the calibrated corner joined to its straight east and south runs', async () => {
    const result = await frames();
    const state = await sourceState();
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    expect(wall).toBeDefined();
    for (const candidate of EQUAL_HEIGHT_FOOTPRINT_PROFILES.filter(
      ({ id }) => id === EQUAL_HEIGHT_FOOTPRINT_SELECTED_PROFILE_ID,
    )) {
      const markup = (mask: 5 | 6 | 10): string => {
        const shapes = calibrateEqualHeightFootprintShapes(
          result[mask].shapes,
          EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES[mask],
          candidate,
          state,
        );
        return stripSvgShell(
          composeWallShapes(shapes, wall!, project.style, 128),
        );
      };
      const rendered = new Resvg(
        '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" ' +
          'viewBox="0 0 256 256">' +
          `<g>${markup(6)}</g>` +
          `<g transform="translate(128 0)">${markup(10)}</g>` +
          `<g transform="translate(0 128)">${markup(5)}</g>` +
          '</svg>',
        { font: { loadSystemFonts: false } },
      ).render();
      const alphaAt = (x: number, y: number): number =>
        rendered.pixels[(y * rendered.width + x) * 4 + 3];
      const transformedBack = transformEqualHeightFootprintPoint(
        {
          x: equalHeightFootprintSourceBackDatum(state),
          y: equalHeightFootprintSourceBackDatum(state),
        },
        'both',
        candidate,
        state,
      ).x;
      const start = Math.max(2, Math.ceil(transformedBack) + 2);
      for (let coordinate = start; coordinate <= 120; coordinate += 1) {
        expect(alphaAt(127, coordinate), `${candidate.id} east join left`)
          .toBeGreaterThan(0);
        expect(alphaAt(128, coordinate), `${candidate.id} east join right`)
          .toBeGreaterThan(0);
        expect(alphaAt(coordinate, 127), `${candidate.id} south join upper`)
          .toBeGreaterThan(0);
        expect(alphaAt(coordinate, 128), `${candidate.id} south join lower`)
          .toBeGreaterThan(0);
      }
    }
  });

  it('uses the accepted 67.5 px authored band as the transform denominator', () => {
    expect(equalHeightFootprintScale(profile('current-68'))).toBe(1);
    expect(equalHeightFootprintScale(profile('candidate-96'))).toBeCloseTo(
      96 / 67.5,
      8,
    );
    expect(equalHeightFootprintScale(profile('candidate-112'))).toBeCloseTo(
      112 / 67.5,
      8,
    );
    expect(equalHeightFootprintScale(profile('control-128'))).toBeCloseTo(
      128 / 67.5,
      8,
    );
    expect(
      equalHeightFootprintScale(
        profile('candidate-112'),
        'accepted-112',
      ),
    ).toBe(1);
    expect(
      equalHeightFootprintScale(profile('current-68'), 'accepted-112'),
    ).toBeCloseTo(67.5 / 112, 8);
  });
});
