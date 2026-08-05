import type { PropPalette } from '../core/types';

export const QUOTA_CO_DOOR_PALETTE: PropPalette = {
  primary: '#D9D0B9',
  secondary: '#294B3C',
  accent: '#B65F4D',
};

export const QUOTA_CO_DOOR_SOURCE_DEFINITIONS = [
  {
    key: 'open=0;facing=0',
    axis: 'horizontal',
    state: 'closed',
    open: 0,
    facing: 0,
    sourceFile: 'door-horizontal-closed.svg',
  },
  {
    key: 'open=1;facing=0',
    axis: 'horizontal',
    state: 'open',
    open: 1,
    facing: 0,
    sourceFile: 'door-horizontal-open.svg',
  },
  {
    key: 'open=0;facing=1',
    axis: 'vertical',
    state: 'closed',
    open: 0,
    facing: 1,
    sourceFile: 'door-vertical-closed.svg',
  },
  {
    key: 'open=1;facing=1',
    axis: 'vertical',
    state: 'open',
    open: 1,
    facing: 1,
    sourceFile: 'door-vertical-open.svg',
  },
] as const;

export type QuotaCoDoorSourceDefinition =
  (typeof QUOTA_CO_DOOR_SOURCE_DEFINITIONS)[number];
