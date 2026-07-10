import { describe, expect, it } from 'vitest';

import { bodyPickerOptions } from '../src/ui/characterPartOptions';

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
  });

  it('does not surface renderer-owned or unknown bodies', () => {
    expect(bodyPickerOptions('body-unit').map((option) => option.value)).toEqual(PRODUCTION_BODY_IDS);
    expect(bodyPickerOptions('body-missing').map((option) => option.value)).toEqual(PRODUCTION_BODY_IDS);
  });
});
