import { describe, expect, it } from 'vitest';

import { bodyPickerOptions, partPickerOptions } from '../src/ui/characterPartOptions';

const PRODUCTION_BODY_IDS = [
  'body-compact',
  'body-balanced',
  'body-large-frame',
  'body-tall',
  'body-soft',
];

describe('character body picker options', () => {
  it('offers exactly the production bodies for a production recipe', () => {
    expect(bodyPickerOptions('body-balanced').map((option) => option.value)).toEqual(PRODUCTION_BODY_IDS);
    expect(partPickerOptions('body', 'body-balanced').map((option) => option.value))
      .toEqual(PRODUCTION_BODY_IDS);
  });

  it.each([
    ['body-standard', 'Standard (legacy)'],
    ['body-slim', 'Slim (legacy)'],
    ['body-broad', 'Broad (legacy)'],
  ])('injects only the current legacy body %s', (currentBodyId, label) => {
    const options = bodyPickerOptions(currentBodyId);
    expect(options.map((option) => option.value)).toEqual([currentBodyId, ...PRODUCTION_BODY_IDS]);
    expect(options[0]).toEqual({ value: currentBodyId, label });
    expect(options.find((option) => option.value === currentBodyId)).toBeTruthy();
    expect(partPickerOptions('body', currentBodyId)).toEqual(options);
  });

  it('does not surface renderer-owned or unknown bodies', () => {
    expect(bodyPickerOptions('body-unit').map((option) => option.value)).toEqual(PRODUCTION_BODY_IDS);
    expect(bodyPickerOptions('body-missing').map((option) => option.value)).toEqual(PRODUCTION_BODY_IDS);
    expect(partPickerOptions('body', 'body-unit').map((option) => option.value))
      .toEqual(PRODUCTION_BODY_IDS);
  });
});

describe('character non-body picker options', () => {
  it('injects the current fabrication head without making it generally selectable', () => {
    const ordinary = partPickerOptions('head', 'head-round');
    expect(ordinary.map((option) => option.value)).not.toContain('head-fab');

    const currentOnly = partPickerOptions('head', 'head-fab');
    expect(currentOnly[0]).toEqual({
      value: 'head-fab',
      label: 'Fabrication unit head (special)',
    });
    expect(currentOnly.filter((option) => option.value === 'head-fab')).toHaveLength(1);
  });

  it('injects the current fabrication chassis without making it generally selectable', () => {
    const ordinary = partPickerOptions('outfit', 'outfit-tee');
    expect(ordinary.map((option) => option.value)).not.toContain('outfit-fab-chassis');

    const currentOnly = partPickerOptions('outfit', 'outfit-fab-chassis');
    expect(currentOnly[0]).toEqual({
      value: 'outfit-fab-chassis',
      label: 'Fabrication chassis (special)',
    });
    expect(currentOnly.filter((option) => option.value === 'outfit-fab-chassis')).toHaveLength(1);
  });

  it('does not inject unknown or wrong-slot values', () => {
    const productionHeads = partPickerOptions('head', 'head-round').map((option) => option.value);
    expect(partPickerOptions('head', 'missing').map((option) => option.value)).toEqual(productionHeads);
    expect(partPickerOptions('head', 'outfit-fab-chassis').map((option) => option.value))
      .toEqual(productionHeads);
  });
});
