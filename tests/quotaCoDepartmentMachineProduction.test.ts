import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { composeProp } from '../src/core/compositor';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_PROPS, DEFAULT_STYLE } from '../src/data/defaults';
import { authoredPropArt } from '../src/props/authoredArt';
import { departmentAssetCatalogJson } from '../src/props/departmentAssetCatalog';
import {
  DEPARTMENT_MACHINE_DEFAULT_PROPS,
  DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS,
  DEPARTMENT_MACHINE_TEMPLATE_IDS,
  DEPARTMENT_STAMP_DEFINITIONS,
} from '../src/props/departmentMachineManifest';
import { PROP_TEMPLATES } from '../src/props/templates';

const SOURCE_ROOT = path.resolve('assets/props/quota-co-department-machines-v1');

function raster(svg: string): PNG {
  return PNG.sync.read(new Resvg(svg).render().asPng());
}

function stripSvg(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

describe('QuotaCo department assets in production', () => {
  it('treats the complete checked-in SVG bank as immutable production authority', async () => {
    const expectedSources = [
      ...DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS.flatMap((template) =>
        template.variants.map((variant) => variant.sourceFile)),
      ...DEPARTMENT_STAMP_DEFINITIONS.map((overlay) => overlay.sourceFile),
    ].sort();
    const actualSources = (await readdir(SOURCE_ROOT))
      .filter((filename) => filename.endsWith('.svg'))
      .sort();
    expect(actualSources).toEqual(expectedSources);

    const sourceManifest = JSON.parse(
      await readFile(path.join(SOURCE_ROOT, 'manifest.json'), 'utf8'),
    );
    expect(sourceManifest).toMatchObject({
      schemaVersion: 2,
      authority: 'canonical-svg',
      sourcePolicy: {
        visualAuthority: 'checked-in-svg',
        compiledOutput: 'src/props/generated/quotaCoDepartmentMachineArt.ts',
        ordinaryCommandsWriteSources: false,
      },
    });

    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts['department-machines:sources']).toBeUndefined();
    expect(packageJson.scripts['department-machines:sources:check']).toBeUndefined();
    expect(Object.values(packageJson.scripts).join('\n'))
      .not.toContain('promoteQuotaCoDepartmentMachines');
    await expect(access(path.resolve('scripts/promoteQuotaCoDepartmentMachines.ts')))
      .rejects.toThrow();
  });

  it('registers exactly the accepted 38 templates and 54 baked prop instances', () => {
    expect(DEPARTMENT_MACHINE_TEMPLATE_IDS).toHaveLength(38);
    expect(DEPARTMENT_MACHINE_DEFAULT_PROPS).toHaveLength(54);
    const templates = new Map(PROP_TEMPLATES.map((template) => [template.id, template]));
    const defaults = new Map(DEFAULT_PROPS.map((prop) => [prop.id, prop]));
    for (const definition of DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS) {
      expect(templates.get(definition.id)).toMatchObject({
        id: definition.id,
        projection: definition.projection,
        gridFootprint: definition.gridFootprint,
      });
      expect(authoredPropArt(definition.id)?.variants).toBeDefined();
      for (const variant of definition.variants) {
        expect(defaults.get(variant.propInstanceId)).toMatchObject({
          templateId: definition.id,
          params: variant.params,
        });
      }
    }
  });

  it('keeps every production-composed state pixel-identical to its accepted canonical SVG', async () => {
    for (const definition of DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS) {
      for (const variant of definition.variants) {
        const source = await readFile(path.join(SOURCE_ROOT, variant.sourceFile), 'utf8');
        const prop = DEPARTMENT_MACHINE_DEFAULT_PROPS.find(({ id }) => id === variant.propInstanceId)!;
        const sourcePng = raster(source);
        const productionPng = raster(composeProp(prop, DEFAULT_STYLE));
        expect(productionPng.width, variant.sourceFile).toBe(sourcePng.width);
        expect(productionPng.height, variant.sourceFile).toBe(sourcePng.height);
        expect(Buffer.compare(productionPng.data, sourcePng.data), variant.sourceFile).toBe(0);
      }
    }
  }, 30_000);

  it('preserves unbroken exact-socket joins through the production compositor', () => {
    const sequence = ['tube_straight', 'tube_straight', 'tube_wallpass', 'tube_riser'];
    const parts = sequence.map((templateId, index) => {
      const prop = DEPARTMENT_MACHINE_DEFAULT_PROPS.find((item) => item.templateId === templateId)!;
      return `<g transform="translate(${index * 64 - 32} 0)">${stripSvg(composeProp(prop, DEFAULT_STYLE))}</g>`;
    });
    const route = raster(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="128" viewBox="0 0 256 128">${parts.join('')}</svg>`);
    for (const seamX of [64, 128, 192]) {
      for (let y = 53; y <= 75; y += 1) {
        const alpha = route.data[(y * route.width + seamX) * 4 + 3];
        expect(alpha, `transparent production route seam at ${seamX},${y}`).toBeGreaterThan(0);
      }
    }
  });

  it('exports manifest v3 with farm-form authored facings and existing transport inventory', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
    const catalog = departmentAssetCatalogJson();
    expect(catalog).toMatchObject({
      kind: 'department-assets',
      version: 3,
      schemaVersion: 21,
      footprintPolicy: 'suggested',
    });
    expect(catalog.canister.stamps.map(({ workType }) => workType))
      .toEqual(DEPARTMENT_STAMP_DEFINITIONS.map(({ id }) => id));
    expect(catalog.canister.stamps.map(({ workType }) => workType)).toEqual([
      'raw_records',
      'structured_data',
      'findings',
      'reports',
      'requirements',
      'specifications',
      'code',
      'release',
      'repairs',
      'personnel_actions',
      'supplies',
      'applications',
      'determinations',
    ]);
    expect(catalog.facilities.find(({ id }) => id === 'keypunch_bank')).toMatchObject({
      placeable: false,
    });
    expect(catalog.facilities.find(({ id }) => id === 'keypunch_console')).toMatchObject({
      placeable: true,
      placement: 'floor',
      suggestedFootprint: { w: 1, h: 1 },
      interactionType: 'keypunch_console',
    });
    expect(catalog.facilities.find(({ id }) => id === 'cubicle_partition_straight'))
      .toMatchObject({
        placement: 'cell-edge-furniture-slot',
        suggestedFootprint: { w: 1, h: 1 },
        states: [
          expect.objectContaining({ id: 'horizontal' }),
          expect.objectContaining({ id: 'vertical' }),
        ],
      });
    expect(catalog.facilities.find(({ id }) => id === 'cubicle_partition_corner'))
      .toMatchObject({ placement: 'cell-corner-furniture-slot' });
    expect(catalog.facilities.find(({ id }) => id === 'cubicle_partition_endcap'))
      .toMatchObject({
        placement: 'cell-edge-furniture-slot',
        states: [
          expect.objectContaining({ id: 'horizontal' }),
          expect.objectContaining({ id: 'vertical' }),
        ],
      });
    expect(catalog.facilities.find(({ id }) => id === 'adjudication_desk_set'))
      .toMatchObject({
        placeable: true,
        placement: 'floor',
        suggestedFootprint: { w: 1, h: 1 },
        interactionType: 'adjudication_desk_set',
      });
    expect(catalog.facilities.find(({ id }) => id === 'docket_rack'))
      .toMatchObject({
        placeable: true,
        placement: 'floor',
        suggestedFootprint: { w: 1, h: 1 },
        interactionType: 'docket_rack',
        states: [
          expect.objectContaining({ id: 'empty' }),
          expect.objectContaining({ id: 'low' }),
          expect.objectContaining({ id: 'high' }),
          expect.objectContaining({ id: 'overflowing' }),
        ],
      });
    expect(catalog.facilities.some(({ id }) => id === 'pay_envelope')).toBe(false);
    expect(catalog.handCarriedItems).toEqual([expect.objectContaining({
      id: 'pay_envelope',
      transport: 'hand-carried',
      pneumaticCompatible: false,
      placeable: false,
      propInstanceId: 'prop-pay_envelope',
      propDirectory: 'props/pay-envelope',
    })]);
    expect(catalog.tube.canisterDiameter + catalog.tube.radialClearance * 2)
      .toBe(catalog.tube.lumenDiameter);
  });
});
