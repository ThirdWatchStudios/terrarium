import type { Projection, PropPalette } from '../core/types';

export const IRIS_HARDWARE_SOURCE_PREFIX = 'assets/props/iris-hardware-v1';
export const IRIS_HARDWARE_HEIGHTS = [78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98] as const;

export interface IrisHardwareSourceDefinition {
  readonly id:
    | 'iris-installation-unit'
    | 'iris-installation-unit-dormant'
    | 'iris-charging-dock';
  readonly sourceFile: string;
  readonly projection: Projection;
  readonly paletteDefaults: PropPalette;
  readonly heights?: readonly number[];
}

export const IRIS_HARDWARE_SOURCE_DEFINITIONS: readonly IrisHardwareSourceDefinition[] = [
  {
    id: 'iris-installation-unit',
    sourceFile: 'iris-installation-unit.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DDE2DE', secondary: '#B8C0BC', accent: '#5BE08A' },
    heights: IRIS_HARDWARE_HEIGHTS,
  },
  {
    id: 'iris-installation-unit-dormant',
    sourceFile: 'iris-installation-unit-dormant.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DDE2DE', secondary: '#B8C0BC', accent: '#5BE08A' },
    heights: IRIS_HARDWARE_HEIGHTS,
  },
  {
    id: 'iris-charging-dock',
    sourceFile: 'iris-charging-dock.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#B7BDBA', secondary: '#565E5B', accent: '#5BE08A' },
  },
];
