import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  EXPECTED_WORKSTATION_FAMILY_CONTRACTS,
  PROP_NATIVE_FRAME_CELLS,
  WORKSTATION_CALIBRATION_CONTROL_IDS,
  WORKSTATION_GAMEPLAY_ART_SCALES,
  WORKSTATION_FAMILY_DECISIONS,
  WORKSTATION_FAMILY_PROP_IDS,
  proposalWorkstationPropSvg,
  validateWorkstationFamilyContracts,
} from '../scripts/quotaCoWorkstationFamilyCalibrationPreview';

describe('QuotaCo workstation-family review proof', () => {
  it('keeps the seven-item family and accepted controls explicit', () => {
    expect(WORKSTATION_FAMILY_PROP_IDS).toEqual([
      'standing-desk',
      'cubicle-workstation',
      'reception-desk',
      'conference-table',
      'supply-cabinet',
      'desk-lamp',
      'desk-clutter',
    ]);
    expect(WORKSTATION_CALIBRATION_CONTROL_IDS).toEqual([
      'desk',
      'office-chair',
      'filing-cabinet',
    ]);
    expect(PROP_NATIVE_FRAME_CELLS).toBe(2);
    expect(WORKSTATION_GAMEPLAY_ART_SCALES).toEqual({
      'office-chair': 0.72,
      'filing-cabinet': 0.76,
      'supply-cabinet': 0.76,
      'desk-lamp': 0.58,
    });
    expect(WORKSTATION_FAMILY_DECISIONS.map(({ id }) => id))
      .toEqual(WORKSTATION_FAMILY_PROP_IDS);
  });

  it('pins the live projection, occupancy, shadow, parameter, and default contracts', () => {
    const result = validateWorkstationFamilyContracts();
    expect(result.errors).toEqual([]);
    expect(result.pass).toBe(true);
    expect(result.contracts).toEqual(EXPECTED_WORKSTATION_FAMILY_CONTRACTS);
  });

  it.each(EXPECTED_WORKSTATION_FAMILY_CONTRACTS)(
    'renders a non-empty review-only proposal for $id at close and far zoom',
    (contract) => {
      const source = proposalWorkstationPropSvg(
        contract.id,
        contract.defaultInstanceParams,
      );
      expect(source).toContain('viewBox="0 0 128 128"');
      expect(source).not.toContain('<script');
      const close = new Resvg(source).render();
      const far = new Resvg(source, {
        fitTo: { mode: 'width', value: 40 },
      }).render();
      expect(close.width).toBe(128);
      expect(close.height).toBe(128);
      expect(close.asPng().byteLength).toBeGreaterThan(250);
      expect(far.width).toBe(40);
      expect(far.height).toBe(40);
      expect(far.asPng().byteLength).toBeGreaterThan(120);
    },
  );

  it('keeps every live parameter visually active in the temporary proof', () => {
    for (const contract of EXPECTED_WORKSTATION_FAMILY_CONTRACTS) {
      const baseline = proposalWorkstationPropSvg(
        contract.id,
        contract.defaultInstanceParams,
      );
      for (const parameter of contract.params) {
        const atMin = proposalWorkstationPropSvg(contract.id, {
          ...contract.defaultInstanceParams,
          [parameter.key]: parameter.min,
        });
        const atMax = proposalWorkstationPropSvg(contract.id, {
          ...contract.defaultInstanceParams,
          [parameter.key]: parameter.max,
        });
        expect(
          atMin !== atMax || baseline !== atMin,
          `${contract.id}.${parameter.key}`,
        ).toBe(true);
      }
    }
  });
});
