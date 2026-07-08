import type { CharacterRecipe, ProjectState, PropInstance, StylePreset, StyleSheet, TileInstance } from '../core/types';
import { CURRENT_SCHEMA_VERSION } from '../core/types';
import type { CharacterProfile, DriveDefinition, Relationship, RelationshipTypeDefinition, TraitDefinition } from '../core/profile';
import { applyDerived, createDefaultProfile } from '../core/profile';
import type { Scenario } from '../core/scenario';
import { defaultCapabilitiesForCategory, defaultThemeForCategory, type DepartmentDefinition } from '../core/department';
import type { BehaviorCategory, BehaviorDefinition, BehaviorRelationshipRequirements, BehaviorSeverity, BehaviorVisibility } from '../core/behavior';
import { MERIDIAN_DYNAMICS } from './companies';
import type { SceneState } from '../core/scene';
// Baked office scenes (ADR-0001): the sim now owns procedural office generation, so the
// tool ships static snapshots of its default offices instead of generating them. Re-bake
// (if the cast/theme inputs change) by temporarily restoring a generate call — see
// docs/adr/0001 and the sim's Tools/ParityHarness.
import defaultSceneJson from './baked/default-scene.json';
import goldenSceneJson from './baked/golden-scene.json';
import { addBuildingSurround } from '../core/buildingSurround';
import { deriveDepartments } from '../core/companyStructure';
import { generatePopulation, employeeRecipe, getProfile } from '../core/employee';
import { generateEmployeePersona } from '../core/populationPersona';
import { generateRelationshipGraph } from '../core/relationshipGraph';

export const DEFAULT_STYLE: StyleSheet = {
  outline: {
    width: 2.5,
    color: '#3A342E',
    mode: 'silhouette',
  },
  proportions: {
    headScale: 1,
    bodyWidth: 1,
  },
  render: {
    baseSize: 128,
    pixelScale: 1,
    contactShadow: 0.12,
    ambientTint: 0.07,
  },
  palettePools: {
    skin: ['#F4D3B0', '#E8B88A', '#D9A06B', '#C68B59', '#A9714B', '#8D5A3B', '#6B4226'],
    hair: ['#1F1A17', '#4A3325', '#6E4A2A', '#B8893B', '#C7782F', '#8A8A8A', '#D8D3C8'],
    clothing: [
      '#2E4057', '#3D5A80', '#1D9E75', '#0F6E56', '#D85A30',
      '#993C56', '#534AB7', '#5F5E5A', '#7A6C5D', '#B04A3A',
    ],
    secondary: ['#F5F2EA', '#E8E4D8', '#DCE6EC', '#F0E2C8'],
    accent: ['#A32D2D', '#D85A30', '#185FA5', '#3B6D11', '#854F0B', '#2C2C2A'],
  },
};

export const DEFAULT_STYLE_PRESETS: StylePreset[] = [
  {
    id: 'preset-warm-office',
    name: 'Warm office',
    style: structuredClone(DEFAULT_STYLE),
  },
  {
    id: 'preset-corporate-cold',
    name: 'Corporate cold',
    style: {
      outline: {
        width: 2,
        color: '#27323A',
        mode: 'silhouette',
      },
      proportions: {
        headScale: 0.96,
        bodyWidth: 0.94,
      },
      render: {
        baseSize: 128,
        pixelScale: 1,
        contactShadow: 0.1,
        ambientTint: 0.05,
      },
      palettePools: {
        skin: ['#F1D6BE', '#D6A77F', '#BC855F', '#8E6046', '#68422F'],
        hair: ['#17191D', '#353A42', '#5C6170', '#7F858F', '#C7CDD5'],
        clothing: ['#20344A', '#2F4A63', '#476579', '#58616F', '#30363F', '#68727D'],
        secondary: ['#EEF3F6', '#DCE7EF', '#CBD6E0', '#B7C4CF'],
        accent: ['#1E6BA8', '#2E8BC8', '#4E6B7A', '#7A8FA0', '#DA7C4B'],
      },
    },
  },
  {
    id: 'preset-high-contrast',
    name: 'High-contrast readability',
    style: {
      outline: {
        width: 4,
        color: '#111111',
        mode: 'per-part',
      },
      proportions: {
        headScale: 1.12,
        bodyWidth: 1.08,
      },
      render: {
        baseSize: 128,
        pixelScale: 1,
        contactShadow: 0.16,
        ambientTint: 0.09,
      },
      palettePools: {
        skin: ['#FFE1BD', '#D99A65', '#A86A42', '#6B3F27'],
        hair: ['#0B0B0B', '#3B2417', '#8B5A22', '#D8D8D8'],
        clothing: ['#0F4C81', '#C7362E', '#107A53', '#6D3FB5', '#D88918', '#242424'],
        secondary: ['#FFFFFF', '#F3F0E8', '#D6EAF8', '#FFE7B8'],
        accent: ['#FFB000', '#E52B2B', '#0066CC', '#118A28', '#6A1B9A'],
      },
    },
  },
];

/** The Experiment 001 cast from the design docs. */
export const DEFAULT_CAST: CharacterRecipe[] = [
  {
    id: 'janice',
    name: 'Janice',
    parts: {
      body: 'body-standard',
      head: 'head-oval',
      hair: 'hair-bob',
      outfit: 'outfit-blazer',
      accessories: ['acc-lanyard'],
    },
    palette: {
      skin: '#E8B88A',
      hair: '#4A3325',
      outfitPrimary: '#2E4057',
      outfitSecondary: '#F5F2EA',
      accent: '#D85A30',
    },
  },
  {
    id: 'carl',
    name: 'Carl',
    parts: {
      body: 'body-broad',
      head: 'head-round',
      hair: 'hair-short',
      outfit: 'outfit-polo',
      accessories: ['acc-mug'],
    },
    palette: {
      skin: '#C68B59',
      hair: '#1F1A17',
      outfitPrimary: '#1D9E75',
      outfitSecondary: '#F5F2EA',
      accent: '#854F0B',
    },
  },
  {
    id: 'linda',
    name: 'Linda',
    parts: {
      body: 'body-standard',
      head: 'head-round',
      hair: 'hair-bun',
      outfit: 'outfit-cardigan',
      accessories: ['acc-glasses'],
    },
    palette: {
      skin: '#8D5A3B',
      hair: '#1F1A17',
      outfitPrimary: '#D85A30',
      outfitSecondary: '#F0E2C8',
      accent: '#993C1D',
    },
  },
  {
    id: 'manager',
    name: 'The Manager',
    parts: {
      body: 'body-broad',
      head: 'head-boxy',
      hair: 'hair-balding',
      outfit: 'outfit-shirt-tie',
      accessories: ['acc-badge'],
    },
    palette: {
      skin: '#F4D3B0',
      hair: '#8A8A8A',
      outfitPrimary: '#5F5E5A',
      outfitSecondary: '#F5F2EA',
      accent: '#A32D2D',
    },
  },
];

export const DEFAULT_PROPS: PropInstance[] = [
  {
    id: 'prop-water-cooler',
    name: 'Water cooler',
    templateId: 'water-cooler',
    params: { height: 56 },
    palette: { primary: '#85B7EB', secondary: '#F1EFE8', accent: '#378ADD' },
  },
  {
    id: 'prop-printer',
    name: 'Printer',
    templateId: 'printer',
    params: { width: 56 },
    palette: { primary: '#5F5E5A', secondary: '#B4B2A9', accent: '#97C459' },
  },
  {
    id: 'prop-desk',
    name: 'Desk',
    templateId: 'desk',
    params: { width: 100, monitor: 1 },
    palette: { primary: '#A9714B', secondary: '#DCE6EC', accent: '#444441' },
  },
  {
    id: 'prop-coffee-machine',
    name: 'Coffee machine',
    templateId: 'coffee-machine',
    params: { height: 48 },
    palette: { primary: '#444441', secondary: '#B4B2A9', accent: '#E24B4A' },
  },
  // Broken twins of the interaction props — baked so the sim can swap to them when
  // the player tampers (jam / break / empty). Same params + palette as the base
  // prop so the swap reads as the same object, just damaged. Names slug to the
  // template ids the sim resolves against (printer-jammed, coffee-machine-broken,
  // water-cooler-empty).
  {
    id: 'prop-printer-jammed',
    name: 'Printer (jammed)',
    templateId: 'printer-jammed',
    params: { width: 56 },
    palette: { primary: '#5F5E5A', secondary: '#B4B2A9', accent: '#97C459' },
  },
  {
    id: 'prop-coffee-machine-broken',
    name: 'Coffee machine (broken)',
    templateId: 'coffee-machine-broken',
    params: { height: 48 },
    palette: { primary: '#444441', secondary: '#B4B2A9', accent: '#E24B4A' },
  },
  {
    id: 'prop-water-cooler-empty',
    name: 'Water cooler (empty)',
    templateId: 'water-cooler-empty',
    params: { height: 56 },
    palette: { primary: '#85B7EB', secondary: '#F1EFE8', accent: '#378ADD' },
  },
  {
    id: 'prop-office-plant',
    name: 'Office plant',
    templateId: 'office-plant',
    params: { bushiness: 2 },
    palette: { primary: '#639922', secondary: '#3B6D11', accent: '#B04A3A' },
  },
  {
    id: 'prop-potted-tree',
    name: 'Potted tree',
    templateId: 'potted-tree',
    params: { height: 90, fullness: 2 },
    palette: { primary: '#4E7C3A', secondary: '#2F5D25', accent: '#B07A4B' },
  },
  {
    id: 'prop-hanging-plant',
    name: 'Hanging plant',
    templateId: 'hanging-plant',
    params: { trail: 24, fullness: 2 },
    palette: { primary: '#5C9A5B', secondary: '#3B6D3A', accent: '#C9A66B' },
  },
  {
    id: 'prop-desk-succulent',
    name: 'Desk succulent',
    templateId: 'desk-succulent',
    params: { size: 14 },
    palette: { primary: '#6FA96A', secondary: '#3E7A57', accent: '#C77B54' },
  },
  {
    id: 'prop-floor-lamp',
    name: 'Floor lamp',
    templateId: 'floor-lamp',
    params: { height: 92 },
    palette: { primary: '#D8C48C', secondary: '#4A4640', accent: '#9A7B3F' },
  },
  {
    id: 'prop-desk-lamp',
    name: 'Desk lamp',
    templateId: 'desk-lamp',
    params: { size: 32 },
    palette: { primary: '#2E6E4E', secondary: '#7A5A2E', accent: '#E0B44C' },
  },
  {
    id: 'prop-bookshelf',
    name: 'Bookshelf',
    templateId: 'bookshelf',
    params: { shelves: 4, fill: 3 },
    palette: { primary: '#8A6A46', secondary: '#5F4326', accent: '#B8543E' },
  },
  {
    id: 'prop-framed-art',
    name: 'Framed art',
    templateId: 'framed-art',
    params: { width: 36, scene: 1 },
    palette: { primary: '#7A5A3C', secondary: '#9FC0D8', accent: '#EBB24A' },
  },
  {
    id: 'prop-poster',
    name: 'Poster',
    templateId: 'poster',
    params: { lines: 2 },
    palette: { primary: '#F2EDE0', secondary: '#3D6B8E', accent: '#E08A3C' },
  },
  {
    id: 'prop-wall-clock',
    name: 'Wall clock',
    templateId: 'wall-clock',
    params: { time: 10 },
    palette: { primary: '#3A3733', secondary: '#B4B2A9', accent: '#D85A30' },
  },
  {
    id: 'prop-personal-desk-items',
    name: 'Personal desk items',
    templateId: 'personal-desk-items',
    params: { variant: 0, items: 3 },
    palette: { primary: '#D8663C', secondary: '#7A5A3C', accent: '#5B8DB8' },
  },
  {
    id: 'prop-restroom-sink',
    name: 'Restroom sinks',
    templateId: 'restroom-sink',
    params: { basins: 2 },
    palette: { primary: '#D8D3C8', secondary: '#7E8A90', accent: '#9AA6AC' },
  },
  {
    id: 'prop-restroom-stall',
    name: 'Restroom stall',
    templateId: 'restroom-stall',
    params: { height: 72, occupied: 0 },
    palette: { primary: '#8C99A0', secondary: '#C2B69C', accent: '#97C459' },
  },
  {
    id: 'prop-wall-screen',
    name: 'Wall screen',
    templateId: 'wall-screen',
    params: { width: 56, content: 1 },
    palette: { primary: '#2C2C2A', secondary: '#22384D', accent: '#5BB0E8' },
  },
  {
    id: 'prop-lockers',
    name: 'Lockers',
    templateId: 'lockers',
    params: { columns: 3, height: 84 },
    palette: { primary: '#556069', secondary: '#7E8A92', accent: '#B8543E' },
  },
  {
    id: 'prop-open-shelving',
    name: 'Open shelving',
    templateId: 'open-shelving',
    params: { shelves: 4, fill: 3 },
    palette: { primary: '#5F5E5A', secondary: '#9A8F7C', accent: '#E08A3C' },
  },
  {
    id: 'prop-copier',
    name: 'Copier',
    templateId: 'copier',
    params: { height: 70 },
    palette: { primary: '#D3D1C7', secondary: '#9BA0A2', accent: '#3D6B8E' },
  },
  {
    id: 'prop-shredder',
    name: 'Paper shredder',
    templateId: 'shredder',
    params: { height: 42 },
    palette: { primary: '#4A4640', secondary: '#6E6B64', accent: '#97C459' },
  },
  {
    id: 'prop-server-rack',
    name: 'Server rack',
    templateId: 'server-rack',
    params: { height: 86, units: 5 },
    palette: { primary: '#2C2E33', secondary: '#4A4E55', accent: '#5BE08A' },
  },
  {
    id: 'prop-standing-desk',
    name: 'Standing desk',
    templateId: 'standing-desk',
    params: { width: 100, dual: 0 },
    palette: { primary: '#CFCABE', secondary: '#8A8B86', accent: '#D8663C' },
  },
  {
    id: 'prop-waiting-bench',
    name: 'Waiting bench',
    templateId: 'waiting-bench',
    params: { length: 96, seats: 3 },
    palette: { primary: '#4E6E8A', secondary: '#39506A', accent: '#D8A24C' },
  },
  {
    id: 'prop-coffee-table',
    name: 'Coffee table',
    templateId: 'coffee-table',
    params: { width: 62, decor: 2 },
    palette: { primary: '#8A6A46', secondary: '#3D6B8E', accent: '#C24A3A' },
  },
  {
    id: 'prop-phone-booth',
    name: 'Phone booth',
    templateId: 'phone-booth',
    params: { height: 90, occupied: 0 },
    palette: { primary: '#6E8A7E', secondary: '#AEC6CC', accent: '#E0A94C' },
  },
  {
    id: 'prop-kanban-board',
    name: 'Kanban board',
    templateId: 'kanban-board',
    params: { notes: 6 },
    palette: { primary: '#7A6C5D', secondary: '#EDE9DE', accent: '#4A7BA8' },
  },
  {
    id: 'prop-microwave',
    name: 'Microwave',
    templateId: 'microwave',
    params: { width: 44 },
    palette: { primary: '#C4C2BA', secondary: '#3A3C40', accent: '#5BB0E8' },
  },
  {
    id: 'prop-pantry-shelf',
    name: 'Pantry shelf',
    templateId: 'pantry-shelf',
    params: { shelves: 3 },
    palette: { primary: '#8A6A46', secondary: '#6E4A2A', accent: '#97C459' },
  },
  {
    id: 'prop-ping-pong-table',
    name: 'Ping-pong table',
    templateId: 'ping-pong-table',
    params: { width: 110 },
    palette: { primary: '#2E6E4E', secondary: '#3A3D42', accent: '#D8362F' },
  },
  {
    id: 'prop-foosball-table',
    name: 'Foosball table',
    templateId: 'foosball-table',
    params: { rods: 6 },
    palette: { primary: '#6E4A2A', secondary: '#2E7D4E', accent: '#3D6B8E' },
  },
  {
    id: 'prop-bean-bag',
    name: 'Bean bag',
    templateId: 'bean-bag',
    params: { size: 42 },
    palette: { primary: '#B8524E', secondary: '#8E3A38', accent: '#EFC94C' },
  },
  {
    id: 'prop-fish-tank',
    name: 'Fish tank',
    templateId: 'fish-tank',
    params: { fish: 3 },
    palette: { primary: '#6E4A2A', secondary: '#3A4A52', accent: '#EF9F27' },
  },
  {
    id: 'prop-nap-pod',
    name: 'Nap pod',
    templateId: 'nap-pod',
    params: { visor: 1 },
    palette: { primary: '#5A6B78', secondary: '#39424A', accent: '#5BE0C4' },
  },
  {
    id: 'prop-pet-bed',
    name: 'Pet bed',
    templateId: 'pet-bed',
    params: { size: 50 },
    palette: { primary: '#B0693C', secondary: '#D9A66B', accent: '#C24A4A' },
  },
  {
    id: 'prop-string-lights',
    name: 'String lights',
    templateId: 'string-lights',
    params: { bulbs: 6 },
    palette: { primary: '#3A3A38', secondary: '#FFE7A0', accent: '#FFC24C' },
  },
  {
    id: 'prop-bar-cart',
    name: 'Bar cart',
    templateId: 'bar-cart',
    params: { bottles: 4 },
    palette: { primary: '#C9A24B', secondary: '#7A6C5D', accent: '#B06A3C' },
  },
  {
    id: 'prop-recycling-bins',
    name: 'Recycling bins',
    templateId: 'recycling-bins',
    params: { bins: 3 },
    palette: { primary: '#2E7D4E', secondary: '#3D6B8E', accent: '#6E6B64' },
  },
  {
    id: 'prop-fridge',
    name: 'Break room fridge',
    templateId: 'fridge',
    params: { height: 78 },
    palette: { primary: '#DCE6EC', secondary: '#D85A30', accent: '#5F5E5A' },
  },
  {
    id: 'prop-conference-table',
    name: 'Conference table',
    templateId: 'conference-table',
    params: { width: 110, chairs: 6 },
    palette: { primary: '#6E4A2A', secondary: '#5F5E5A', accent: '#444441' },
  },
  {
    id: 'prop-reception-desk',
    name: 'Reception desk',
    templateId: 'reception-desk',
    params: { width: 88 },
    palette: { primary: '#3D5A80', secondary: '#E8E4D8', accent: '#EF9F27' },
  },
  {
    id: 'prop-badge-reader',
    name: 'Badge reader',
    templateId: 'badge-reader',
    params: { granted: 1 },
    palette: { primary: '#444441', secondary: '#D3D1C7', accent: '#97C459' },
  },
  {
    id: 'prop-door',
    name: 'Door',
    templateId: 'door',
    params: { width: 56, open: 0 },
    palette: { primary: '#7A6C5D', secondary: '#B4B2A9', accent: '#EF9F27' },
  },
  {
    id: 'prop-open-door',
    name: 'Open door',
    templateId: 'door',
    params: { width: 56, open: 1 },
    palette: { primary: '#7A6C5D', secondary: '#B4B2A9', accent: '#EF9F27' },
  },
  {
    id: 'prop-window',
    name: 'Office window',
    templateId: 'window',
    params: { width: 72, blinds: 2 },
    palette: { primary: '#5F5E5A', secondary: '#B5D4F4', accent: '#EEF3F4' },
  },
  {
    id: 'prop-nameplate',
    name: 'Nameplate',
    templateId: 'nameplate',
    params: { width: 48, lines: 2 },
    palette: { primary: '#D3B56E', secondary: '#F7F4EC', accent: '#5F5E5A' },
  },
  {
    id: 'prop-hvac-vent',
    name: 'HVAC vent',
    templateId: 'hvac-vent',
    params: { width: 52, slats: 5 },
    palette: { primary: '#A9B3B8', secondary: '#CAD4D7', accent: '#5F5E5A' },
  },
  {
    id: 'prop-desk-clutter',
    name: 'Desk clutter',
    templateId: 'desk-clutter',
    params: { papers: 3, phone: 1 },
    palette: { primary: '#2C2C2A', secondary: '#B4B2A9', accent: '#D85A30' },
  },
  {
    id: 'prop-couch',
    name: 'Lobby couch',
    templateId: 'couch',
    params: { width: 82, cushions: 3 },
    palette: { primary: '#3D5A80', secondary: '#2E4057', accent: '#D85A30' },
  },
  {
    id: 'prop-rug',
    name: 'Office rug',
    templateId: 'rug',
    params: { width: 96, pattern: 1 },
    palette: { primary: '#993C56', secondary: '#E8E4D8', accent: '#D85A30' },
  },
  {
    id: 'prop-vending-machine',
    name: 'Vending machine',
    templateId: 'vending-machine',
    params: { height: 84, stocked: 3 },
    palette: { primary: '#A32D2D', secondary: '#22384D', accent: '#97C459' },
  },
  {
    id: 'prop-office-chair',
    name: 'Office chair',
    templateId: 'office-chair',
    params: { size: 13 },
    palette: { primary: '#444441', secondary: '#888780', accent: '#2C2C2A' },
  },
  {
    id: 'prop-cubicle-workstation',
    name: 'Cubicle workstation',
    templateId: 'cubicle-workstation',
    params: { openness: 0, clutter: 1 },
    palette: { primary: '#8A9199', secondary: '#5F5E5A', accent: '#D85A30' },
  },
  {
    id: 'prop-whiteboard',
    name: 'Whiteboard',
    templateId: 'whiteboard',
    params: { width: 64, scribbles: 2 },
    palette: { primary: '#B4B2A9', secondary: '#F7F4EC', accent: '#D85A30' },
  },
  {
    id: 'prop-filing-cabinet',
    name: 'Filing cabinet',
    templateId: 'filing-cabinet',
    params: { drawers: 3 },
    palette: { primary: '#7A6C5D', secondary: '#8A8578', accent: '#2C2C2A' },
  },
  {
    id: 'prop-supply-cabinet',
    name: 'Supply cabinet',
    templateId: 'supply-cabinet',
    params: { height: 72 },
    palette: { primary: '#8A8578', secondary: '#D3D1C7', accent: '#185FA5' },
  },
  {
    id: 'prop-mail-station',
    name: 'Mail station',
    templateId: 'mail-station',
    params: { height: 60, columns: 4 },
    palette: { primary: '#7A6C5D', secondary: '#E8E4D8', accent: '#A32D2D' },
  },
  {
    id: 'prop-trash-bin',
    name: 'Trash bin',
    templateId: 'trash-bin',
    params: { height: 36 },
    palette: { primary: '#5F6B5A', secondary: '#3F4A3C', accent: '#D8D3C8' },
  },
  {
    id: 'prop-water-station',
    name: 'Water station',
    templateId: 'water-station',
    params: { height: 54 },
    palette: { primary: '#9FD0F2', secondary: '#5F5E5A', accent: '#378ADD' },
  },
  {
    id: 'prop-coat-rack',
    name: 'Coat rack',
    templateId: 'coat-rack',
    params: { hooks: 4 },
    palette: { primary: '#5F5E5A', secondary: '#2C2C2A', accent: '#854F0B' },
  },
  {
    id: 'prop-bulletin-board',
    name: 'Bulletin board',
    templateId: 'bulletin-board',
    params: { width: 64, notes: 4 },
    palette: { primary: '#7A6C5D', secondary: '#C9A36B', accent: '#D85A30' },
  },
  {
    id: 'prop-wall-calendar',
    name: 'Wall calendar',
    templateId: 'wall-calendar',
    params: { rows: 5 },
    palette: { primary: '#3D5A80', secondary: '#F7F4EC', accent: '#D85A30' },
  },
  {
    id: 'prop-water-fountain',
    name: 'Water fountain',
    templateId: 'water-fountain',
    params: { basins: 1 },
    palette: { primary: '#A9B3B8', secondary: '#CAD4D7', accent: '#185FA5' },
  },
  {
    id: 'prop-kitchenette-counter',
    name: 'Kitchenette counter',
    templateId: 'kitchenette-counter',
    params: { length: 108, sink: 1 },
    palette: { primary: '#D3D1C7', secondary: '#B4B2A9', accent: '#5F5E5A' },
  },
  {
    id: 'prop-lounge-seating',
    name: 'Lounge seating',
    templateId: 'lounge-seating',
    params: { seats: 3 },
    palette: { primary: '#534AB7', secondary: '#3A3490', accent: '#EF9F27' },
  },
  {
    id: 'prop-break-table',
    name: 'Break room table',
    templateId: 'break-table',
    params: { diameter: 52, stools: 4 },
    palette: { primary: '#9C6B43', secondary: '#C9B79C', accent: '#D85A30' },
  },
  // Building surround props (floor-in-a-tower border) — decorative only; the
  // ring generator places these outside the tenant rect and emits no
  // interaction anchors for them.
  {
    id: 'prop-elevator-bank',
    name: 'Elevator bank',
    templateId: 'elevator-bank',
    params: { doors: 2, height: 74 },
    palette: { primary: '#5A616B', secondary: '#AEB6BD', accent: '#EF9F27' },
  },
  {
    id: 'prop-exit-sign',
    name: 'Exit / stairwell door',
    templateId: 'exit-sign',
    params: { height: 76 },
    palette: { primary: '#5A616B', secondary: '#8A9199', accent: '#C0392B' },
  },
  {
    id: 'prop-neighbor-glass',
    name: 'Neighbor suite glass',
    templateId: 'neighbor-glass',
    params: { width: 96, lit: 0 },
    palette: { primary: '#4A535E', secondary: '#C3D2DD', accent: '#6E7A86' },
  },
  {
    id: 'prop-directory-placard',
    name: 'Building directory',
    templateId: 'directory-placard',
    params: { lines: 5 },
    palette: { primary: '#454B54', secondary: '#D7DCE0', accent: '#B08D57' },
  },
  {
    id: 'prop-fire-extinguisher',
    name: 'Extinguisher cabinet',
    templateId: 'fire-extinguisher',
    params: { size: 20 },
    palette: { primary: '#C0392B', secondary: '#D7DCE0', accent: '#A93226' },
  },
  // Exterior vehicles + lot decals (B1.5 build site) — decor on the outdoor
  // ground (NON_PLACEABLE), so the parking lot reads as a lot. A template with
  // no instance ships nothing, so each car style ships at least one instance;
  // two sedan colours give the lot variety.
  {
    id: 'prop-car',
    name: 'Car',
    templateId: 'car',
    params: { trim: 1 },
    palette: { primary: '#8A3A34', secondary: '#5E2723', accent: '#BFD4E4' },
  },
  {
    id: 'prop-car-blue',
    name: 'Car blue',
    templateId: 'car',
    params: { trim: 1 },
    palette: { primary: '#2E4A6E', secondary: '#22384F', accent: '#BFD4E4' },
  },
  {
    id: 'prop-car-suv',
    name: 'SUV',
    templateId: 'car-suv',
    params: { rails: 1 },
    palette: { primary: '#3A3F45', secondary: '#2C3035', accent: '#C7D2DA' },
  },
  {
    id: 'prop-parking-line',
    name: 'Parking line',
    templateId: 'parking-line',
    params: { stop: 1 },
    palette: { primary: '#E8E4D2', secondary: '#C9C6B6', accent: '#B7B4A4' },
  },
];

export const DEFAULT_WALLS: TileInstance[] = [
  {
    id: 'wall-office',
    name: 'Office wall',
    templateId: 'office-wall',
    params: { thickness: 28 },
    palette: { primary: '#B4B2A9', secondary: '#888780', accent: '#5F5E5A' },
  },
  {
    id: 'wall-glass',
    name: 'Glass partition',
    templateId: 'glass-partition',
    params: { thickness: 10 },
    palette: { primary: '#5F5E5A', secondary: '#B5D4F4', accent: '#185FA5' },
  },
  {
    id: 'wall-cubicle',
    name: 'Cubicle partition',
    templateId: 'cubicle-partition',
    params: { thickness: 14 },
    palette: { primary: '#8A9199', secondary: '#5F5E5A', accent: '#D85A30' },
  },
  {
    id: 'wall-brick',
    name: 'Brick wall',
    templateId: 'brick-wall',
    params: { thickness: 24 },
    palette: { primary: '#9C5A45', secondary: '#D8C9B8', accent: '#7A4334' },
  },
  {
    id: 'wall-panel',
    name: 'Panel wall',
    templateId: 'panel-wall',
    params: { thickness: 20 },
    palette: { primary: '#6E6A63', secondary: '#9AA0A6', accent: '#185FA5' },
  },
  // Building surround (floor-in-a-tower border). Cooler, heavier greys than the
  // tenant partitions so the shell reads as "the building, not yours."
  {
    id: 'wall-demising',
    name: 'Demising wall',
    templateId: 'demising-wall',
    // 28-unit band, matching wall-office — shell/tenant junctions align mid-run.
    params: { thickness: 28 },
    palette: { primary: '#7E8590', secondary: '#5A616B', accent: '#454B54' },
  },
  {
    id: 'wall-curtain',
    name: 'Curtain wall',
    templateId: 'curtain-wall',
    // accent = the `$sky` token (flat sky tint for v1); 28-unit band like wall-office.
    params: { thickness: 28 },
    palette: { primary: '#4A535E', secondary: '#ABC4D6', accent: '#A8C8E0' },
  },
  {
    id: 'wall-living',
    name: 'Living wall',
    templateId: 'living-wall',
    params: { thickness: 28 },
    palette: { primary: '#3E6B3A', secondary: '#2F5D25', accent: '#7DB05A' },
  },
  {
    id: 'wall-branded',
    name: 'Branded wall',
    templateId: 'branded-wall',
    params: { thickness: 24 },
    palette: { primary: '#2E4A6E', secondary: '#F2EDE0', accent: '#E0A94C' },
  },
  {
    id: 'wall-slat',
    name: 'Wood slat wall',
    templateId: 'slat-wall',
    params: { thickness: 22 },
    palette: { primary: '#A9714B', secondary: '#5F3E22', accent: '#C68B59' },
  },
];

export const DEFAULT_FLOORS: TileInstance[] = [
  {
    id: 'floor-carpet',
    name: 'Office carpet',
    templateId: 'carpet',
    params: { speckle: 2, seed: 3 },
    palette: { primary: '#667687', secondary: '#8B9AA8', accent: '#4E5B69' },
  },
  {
    id: 'floor-carpet-tiles',
    name: 'Lobby carpet tiles',
    templateId: 'carpet-tiles',
    params: { contrast: 2 },
    palette: { primary: '#7A6C5D', secondary: '#8A8578', accent: '#5F5E5A' },
  },
  {
    id: 'floor-wood',
    name: 'Executive wood',
    templateId: 'wood-floor',
    params: { seed: 5 },
    palette: { primary: '#A9714B', secondary: '#6E4A2A', accent: '#C68B59' },
  },
  {
    id: 'floor-linoleum',
    name: 'Break room linoleum',
    templateId: 'linoleum',
    params: { grid: 32 },
    palette: { primary: '#E8E4D8', secondary: '#D3D1C7', accent: '#B4B2A9' },
  },
  {
    id: 'floor-utility-vinyl',
    name: 'Utility vinyl',
    templateId: 'utility-vinyl',
    params: { grid: 32, scuff: 2, seed: 4 },
    palette: { primary: '#CAD4D7', secondary: '#EEF3F4', accent: '#7F8B91' },
  },
  {
    id: 'floor-quiet-carpet',
    name: 'Quiet room carpet',
    templateId: 'quiet-carpet',
    params: { weave: 2, seed: 6 },
    palette: { primary: '#496C68', secondary: '#6F908B', accent: '#314D55' },
  },
  {
    id: 'floor-terrazzo',
    name: 'Terrazzo',
    templateId: 'terrazzo',
    params: { density: 2, seed: 4 },
    palette: { primary: '#E2DED3', secondary: '#9AA7A0', accent: '#C2885E' },
  },
  {
    id: 'floor-rubber-mat',
    name: 'Rubber mat',
    templateId: 'rubber-mat',
    params: { studs: 8 },
    palette: { primary: '#3C4651', secondary: '#56626E', accent: '#2A323A' },
  },
  // Building surround — the shared elevator lobby / corridor ring.
  {
    id: 'floor-lobby-stone',
    name: 'Lobby stone',
    templateId: 'lobby-stone',
    params: { slab: 64, sheen: 2 },
    palette: { primary: '#9AA0A6', secondary: '#7E848B', accent: '#5F5E5A' },
  },
  {
    id: 'floor-polished-concrete',
    name: 'Polished concrete',
    templateId: 'polished-concrete',
    params: { joints: 1, seed: 3 },
    palette: { primary: '#9C9E9B', secondary: '#7E807C', accent: '#B4B6B2' },
  },
  {
    id: 'floor-accent-tile',
    name: 'Accent tile',
    templateId: 'accent-tile',
    params: { grid: 32, motif: 1 },
    palette: { primary: '#E8E4D8', secondary: '#3D6B8E', accent: '#E0A94C' },
  },
  {
    id: 'floor-astroturf',
    name: 'Astroturf',
    templateId: 'astroturf',
    params: { seed: 5 },
    palette: { primary: '#4E8A3E', secondary: '#3B6D2F', accent: '#7DB05A' },
  },
];

/**
 * Outdoor ground surfaces (B1.5 "the build site"). These ship as the DISTINCT
 * ground KIND (decision D2): their own `ground/` export folder, own atlas kind,
 * own sort band (−20000), so the sim draws them under everything and never
 * confuses them with interior floor. Generated-only for now (§9 — not
 * player-paintable), so there's no ground UI; they're a code-owned default the
 * export always ships.
 *
 * D2 AMENDED (natural-vs-paved register split, core/look.ts): the NATURAL
 * surfaces (grass / meadow / dirt) are exempt from the clinical drain and stay
 * lush and saturated — the game is about destroying something beautiful for
 * something bland, and the ground is the beautiful thing. Multiple grass
 * variants ship so open fields don't tile into one uniform swatch (same reason
 * the lot gets two sedan colors). The PAVED surfaces (asphalt / sidewalk) are
 * the bland thing and drain with the building.
 */
export const DEFAULT_GROUND: TileInstance[] = [
  {
    id: 'ground-grass',
    name: 'Lawn grass',
    templateId: 'grass',
    params: { blades: 2, flowers: 1, seed: 5 },
    palette: { primary: '#4E9A3C', secondary: '#37752A', accent: '#86C65A' },
  },
  {
    id: 'ground-grass-b',
    name: 'Deep grass',
    templateId: 'grass',
    params: { blades: 3, flowers: 0, seed: 8 },
    palette: { primary: '#3F7E33', secondary: '#2C5E23', accent: '#6BAE4C' },
  },
  {
    id: 'ground-meadow',
    name: 'Wildflower meadow',
    templateId: 'meadow',
    params: { flowers: 2, seed: 4 },
    palette: { primary: '#5E9C40', secondary: '#417831', accent: '#8FC85E' },
  },
  {
    id: 'ground-dirt',
    name: 'Bare dirt',
    templateId: 'dirt',
    params: { clods: 2, pebbles: 1, seed: 3 },
    palette: { primary: '#7E5533', secondary: '#5C3D22', accent: '#A97F4F' },
  },
  {
    id: 'ground-asphalt',
    name: 'Parking-lot asphalt',
    templateId: 'asphalt',
    params: { aggregate: 2, seed: 7 },
    palette: { primary: '#3C3E42', secondary: '#4E5157', accent: '#2C2E31' },
  },
  {
    id: 'ground-sidewalk',
    name: 'Concrete sidewalk',
    templateId: 'sidewalk',
    params: { slab: 64 },
    palette: { primary: '#B8B7B0', secondary: '#9C9B94', accent: '#8A8982' },
  },
];

// ---------------------------------------------------------------------------
// Default character profiles — the Experiment 001 cast authored up into the
// full-game character model (game-design-docs .../design/character_model.md).
// Prototype data maps up: traits → trait tags, goals → drives, the relationship
// matrix → directed multi-axis relationships, Carl's suspicion seed → a starting
// belief (confidence 1/3 → 33). A neutral base from createDefaultProfile is
// customized, then applyDerived fills the derived axes/tendencies/volatility.
// ---------------------------------------------------------------------------

/** Build a relationship, defaulting the unset axes to neutral. */
function rel(targetAgentId: string, over: Partial<Relationship>): Relationship {
  return {
    targetAgentId,
    trust: 50,
    suspicion: 0,
    affinity: 0,
    influence: 0,
    respect: 50,
    familiarity: 50,
    tags: [],
    ...over,
  };
}

function buildDefaultProfiles(): CharacterProfile[] {
  const byId = Object.fromEntries(DEFAULT_CAST.map((c) => [c.id, c]));

  const janice = createDefaultProfile(byId.janice);
  janice.identity = {
    ...janice.identity,
    roleTitle: 'Senior Analyst',
    department: 'operations',
    seniority: 'senior',
    pronouns: 'she/her',
    prototypeRole: 'Promotion Recipient',
    bio: 'Just promoted. Determined to show it was earned.',
  };
  janice.personality.ocean = { openness: 55, conscientiousness: 82, extraversion: 55, agreeableness: 60, neuroticism: 52 };
  janice.personality.axes = { ambition: 85, integrity: 75, loyalty: 60, discretion: 62 };
  janice.personality.traitTags = ['ambitious', 'hard_working', 'recognition_seeking'];
  janice.needs.recognition = { baseline: 45, sensitivity: 85 };
  janice.needs.competence = { baseline: 72, sensitivity: 70 };
  janice.needs.security = { baseline: 60, sensitivity: 60 };
  janice.drives = {
    primary: 'prove_readiness',
    secondary: 'avoid_reputational_damage',
    objectives: [
      {
        id: 'janice-prove-earned',
        sourceDrive: 'prove_readiness',
        targetOrConcern: 'Demonstrate the promotion was earned',
        expectedBehaviorTendency: 'support',
        status: 'active',
      },
    ],
  };
  janice.relationships = [
    rel('manager', { trust: 80, affinity: 50, influence: 40, respect: 75, familiarity: 60 }),
    rel('carl', { trust: 40, suspicion: 40, affinity: 0, respect: 45, familiarity: 70 }),
  ];

  const carl = createDefaultProfile(byId.carl);
  carl.identity = {
    ...carl.identity,
    roleTitle: 'Analyst',
    department: 'operations',
    seniority: 'senior',
    pronouns: 'he/him',
    prototypeRole: 'Promotion Skeptic',
    bio: 'Been here longer than most. Felt the last promotion should have been his.',
  };
  carl.personality.ocean = { openness: 45, conscientiousness: 50, extraversion: 70, agreeableness: 30, neuroticism: 60 };
  carl.personality.axes = { ambition: 75, integrity: 40, loyalty: 35, discretion: 25 };
  carl.personality.traitTags = ['cynical', 'competitive', 'socially_connected'];
  carl.needs.recognition = { baseline: 40, sensitivity: 80 };
  carl.needs.security = { baseline: 55, sensitivity: 65 };
  carl.needs.belonging = { baseline: 65, sensitivity: 60 };
  carl.drives = {
    primary: 'protect_status',
    secondary: 'challenge_unfair_advancement',
    objectives: [
      {
        id: 'carl-scrutinize-promotion',
        sourceDrive: 'challenge_unfair_advancement',
        targetOrConcern: "Janice's promotion",
        expectedBehaviorTendency: 'share',
        status: 'active',
      },
    ],
  };
  // Durable baseline rivalry toward Janice; the promotion-driven suspicion spike
  // (suspicion 100 / affinity -50) is a scenario relationshipOverride in
  // promotion_rumor_001, applied on top of this at load.
  carl.relationships = [
    rel('janice', { trust: 40, suspicion: 30, affinity: -20, influence: 33, respect: 35, familiarity: 70, relationshipType: 'rival', tags: ['rival'] }),
    rel('manager', { trust: 33, suspicion: 66, affinity: 0, influence: 0, respect: 40, familiarity: 55 }),
    // Mirror of Linda's secret romance.
    rel('linda', { trust: 100, suspicion: 0, affinity: 80, influence: 50, respect: 60, familiarity: 90, relationshipType: 'romance', secret: true }),
  ];
  carl.formativeEvents = [
    {
      id: 'carl-passed-over',
      title: 'Passed over for the promotion Janice got',
      description: 'Carl believed the role was his. It went to Janice after a closed-door meeting.',
      when: 'recent',
      involvedAgentIds: ['janice', 'manager'],
      visibility: 'private',
      knownToAgentIds: ['carl'],
      effects: [
        { targetKind: 'relationship_axis', targetRef: 'janice:suspicion', op: 'add', value: 40 },
        { targetKind: 'need_baseline', targetRef: 'recognition', op: 'add', value: -20 },
      ],
    },
  ];

  const linda = createDefaultProfile(byId.linda);
  linda.identity = {
    ...linda.identity,
    roleTitle: 'Coordinator',
    department: 'operations',
    seniority: 'junior',
    pronouns: 'she/her',
    prototypeRole: 'Information Amplifier',
    bio: 'Knows everyone and everything. The office switchboard.',
  };
  linda.personality.ocean = { openness: 70, conscientiousness: 50, extraversion: 80, agreeableness: 75, neuroticism: 45 };
  linda.personality.axes = { ambition: 40, integrity: 60, loyalty: 65, discretion: 28 };
  linda.personality.traitTags = ['social', 'trusting', 'curious'];
  linda.needs.belonging = { baseline: 60, sensitivity: 85 };
  linda.needs.recognition = { baseline: 60, sensitivity: 50 };
  linda.drives = {
    primary: 'maintain_social_access',
    secondary: 'reduce_uncertainty',
    objectives: [
      {
        id: 'linda-stay-informed',
        sourceDrive: 'maintain_social_access',
        targetOrConcern: 'Stay in the loop on the promotion',
        expectedBehaviorTendency: 'confirm',
        status: 'active',
      },
    ],
  };
  linda.relationships = [
    // A secret office romance with Carl — the live demo of the third-party
    // (jealousy) coupling: when Carl engages Janice (whom Linda is cool on), the
    // 'romance' type's thirdParty hook fires for Linda.
    rel('carl', { trust: 100, suspicion: 0, affinity: 80, influence: 66, respect: 60, familiarity: 90, relationshipType: 'romance', secret: true, tags: ['friend'] }),
    rel('janice', { trust: 66, suspicion: 0, affinity: -10, influence: 0, respect: 55, familiarity: 50, relationshipType: 'coworker' }),
  ];

  const manager = createDefaultProfile(byId.manager);
  manager.identity = {
    ...manager.identity,
    roleTitle: 'Office Manager',
    department: 'management',
    seniority: 'manager',
    prototypeRole: 'Source Of Truth',
    bio: 'Practical, busy, and protective of a stable team.',
  };
  manager.personality.ocean = { openness: 45, conscientiousness: 80, extraversion: 50, agreeableness: 55, neuroticism: 35 };
  manager.personality.axes = { ambition: 55, integrity: 75, loyalty: 60, discretion: 82 };
  manager.personality.traitTags = ['practical', 'busy'];
  manager.needs.security = { baseline: 70, sensitivity: 60 };
  manager.needs.autonomy = { baseline: 70, sensitivity: 55 };
  manager.drives = {
    primary: 'preserve_leadership_confidence',
    secondary: 'contain_variance',
    objectives: [
      {
        id: 'manager-keep-stable',
        sourceDrive: 'preserve_leadership_confidence',
        targetOrConcern: 'Team stability after the promotion',
        expectedBehaviorTendency: 'support',
        status: 'active',
      },
    ],
  };
  manager.relationships = [
    rel('janice', { trust: 100, affinity: 50, influence: 66, respect: 80, familiarity: 60 }),
    rel('carl', { trust: 50, suspicion: 33, affinity: 0, respect: 45, familiarity: 60 }),
  ];

  return [janice, carl, linda, manager].map(applyDerived);
}

export const DEFAULT_PROFILES: CharacterProfile[] = buildDefaultProfiles();

// ---------------------------------------------------------------------------
// Construction crew (B1.5 "the construction crew" — the builders who physically
// raise the office the player designs). Shipped as an authored PERSONA the sim
// spawns the crew from (decision D4), NOT a fixed default-cast agent id: keeping
// it out of DEFAULT_CAST avoids the contract.test.ts 4-hero agent-id lockstep and
// lets the sim size the crew dynamically. It's a code-owned ingredient (like the
// icon set), exported into its own `construction-crew/` folder decoupled from the
// editable office cast — never seated at a desk, never in the org chart.
// ---------------------------------------------------------------------------

/** The hi-vis palette: slate work shirt, orange vest, safety-yellow hard hat. */
export const HI_VIS_PALETTE = {
  skin: '#D9A06B',
  hair: '#3A2A1C',
  outfitPrimary: '#37414F',
  outfitSecondary: '#F26A1B',
  accent: '#F2C310',
} as const;

export const CONSTRUCTION_CREW: CharacterRecipe[] = [
  {
    id: 'construction-worker',
    name: 'Construction Worker',
    parts: {
      body: 'body-broad',
      head: 'head-round',
      hair: 'hair-short',
      outfit: 'outfit-hi-vis',
      accessories: ['acc-hard-hat'],
    },
    palette: { ...HI_VIS_PALETTE },
  },
];

function buildConstructionProfiles(): CharacterProfile[] {
  return CONSTRUCTION_CREW.map((recipe) => {
    const p = createDefaultProfile(recipe);
    p.identity = {
      ...p.identity,
      roleTitle: 'Construction Worker',
      department: '', // not an office employee — the crew builds it, doesn't staff it
      seniority: 'junior',
      prototypeRole: 'Construction Crew',
      bio: 'Raises the office the player designs — hi-vis, hard hat, and a punch list.',
    };
    p.personality.ocean = { openness: 45, conscientiousness: 72, extraversion: 50, agreeableness: 60, neuroticism: 32 };
    p.personality.axes = { ambition: 40, integrity: 70, loyalty: 55, discretion: 50 };
    p.personality.traitTags = ['hard_working', 'practical', 'reliable'];
    return p;
  }).map(applyDerived);
}

export const CONSTRUCTION_PROFILES: CharacterProfile[] = buildConstructionProfiles();

// ---------------------------------------------------------------------------
// Default scenarios — Experiment 001 ("The Promotion Rumor") authored as the
// first full scenario (game-design-docs .../design/scenario_model.md). It
// composes the cast by reference and adds the situation: locations bound to the
// office, truth facts, information items, the experiment variants, and the
// objective. Per the persona↔scenario boundary, the starting BELIEFS live here
// (Carl's "rigged" suspicion seed moves out of his persona into the scenario),
// and the promotion-driven suspicion spike is a relationship OVERRIDE on top of
// his persona baseline.
// ---------------------------------------------------------------------------

const PROMOTION_RUMOR_001: Scenario = {
  scenarioId: 'promotion_rumor_001',
  title: 'The Promotion Rumor',
  summary: 'An ambiguous promotion seeds a rumor; does it spread or stay contained?',
  cast: [
    {
      agentId: 'janice',
      spawnLocationId: 'janice_desk',
      prototypeRole: 'Promotion Recipient',
      relationshipOverrides: [],
      beliefSeeds: [
        { topic: 'janice_promotion', claim: 'I earned the promotion legitimately.', stance: 'accepts', confidence: 90 },
      ],
      knowledgeSeeds: ['official_promotion_notice'],
    },
    {
      agentId: 'carl',
      spawnLocationId: 'carl_desk',
      prototypeRole: 'Promotion Skeptic',
      // Scenario-driven shift on top of Carl's persona baseline toward Janice.
      relationshipOverrides: [{ targetAgentId: 'janice', suspicion: 100, affinity: -50 }],
      beliefSeeds: [
        { topic: 'janice_promotion', claim: 'The promotion was probably rigged.', stance: 'suspects', confidence: 33 },
      ],
      knowledgeSeeds: ['official_promotion_notice', 'manager_private_meeting_observation'],
    },
    {
      agentId: 'linda',
      spawnLocationId: 'linda_desk',
      prototypeRole: 'Information Amplifier',
      relationshipOverrides: [],
      beliefSeeds: [
        { topic: 'janice_promotion', claim: 'Janice was promoted.', stance: 'unknown', confidence: 0 },
      ],
      knowledgeSeeds: [],
    },
    {
      agentId: 'manager',
      spawnLocationId: 'manager_office',
      prototypeRole: 'Source Of Truth',
      relationshipOverrides: [],
      beliefSeeds: [
        { topic: 'janice_promotion', claim: 'Janice earned the promotion legitimately.', stance: 'accepts', confidence: 100 },
      ],
      knowledgeSeeds: ['official_promotion_notice'],
    },
  ],
  locations: [
    { locationId: 'janice_desk', displayName: "Janice's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindTo: { anchorId: 'desk:janice', roomId: 'cubicle-farm' } },
    { locationId: 'carl_desk', displayName: "Carl's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindTo: { anchorId: 'desk:carl', roomId: 'cubicle-farm' } },
    { locationId: 'linda_desk', displayName: "Linda's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindTo: { anchorId: 'desk:linda', roomId: 'cubicle-farm' } },
    { locationId: 'manager_office', displayName: 'Manager Office', tags: ['management'], accessState: 'open', fallbackLocationId: '', bindTo: { anchorId: '', roomId: 'manager-office' } },
    { locationId: 'break_room', displayName: 'Break Room', tags: ['break_area'], accessState: 'open', fallbackLocationId: 'hallway', bindTo: { anchorId: '', roomId: 'break-room' } },
    { locationId: 'hallway', displayName: 'Hallway', tags: ['transit'], accessState: 'open', fallbackLocationId: '', bindTo: { anchorId: '', roomId: 'hallway' } },
  ],
  truthFacts: [
    {
      truthId: 'janice_promotion_legitimate',
      topic: 'janice_promotion',
      statement: 'Janice earned the promotion legitimately.',
      subjectAgentIds: ['janice', 'manager'],
      objectiveValue: true,
      sourceAgentId: 'manager',
    },
  ],
  informationItems: [
    { informationId: 'official_promotion_notice', topic: 'janice_promotion', claim: 'Janice was promoted.', originType: 'official', truthId: 'janice_promotion_legitimate', truthAlignment: 'true', sourceAgentId: 'manager', initialHolderAgentIds: ['manager', 'janice'] },
    { informationId: 'manager_private_meeting_observation', topic: 'janice_promotion', claim: 'Janice had a private meeting with the manager.', originType: 'observation', truthId: 'janice_promotion_legitimate', truthAlignment: 'misleading', sourceAgentId: 'carl', initialHolderAgentIds: ['carl'] },
    { informationId: 'rigged_promotion_claim', topic: 'janice_promotion', claim: 'The promotion was rigged.', originType: 'rumor', truthId: 'janice_promotion_legitimate', truthAlignment: 'false', sourceAgentId: 'carl', initialHolderAgentIds: ['carl'] },
  ],
  interventionTypes: [
    { type: 'promotion_information_entry', values: ['public_announcement', 'private_notification'] },
    { type: 'break_room_access', values: ['open', 'locked'] },
  ],
  variants: [
    { variantId: 'public_announcement', selections: { promotion_information_entry: 'public_announcement', break_room_access: 'open' } },
    { variantId: 'private_notification', selections: { promotion_information_entry: 'private_notification', break_room_access: 'open' } },
    { variantId: 'private_notification_break_room_locked', selections: { promotion_information_entry: 'private_notification', break_room_access: 'locked' } },
  ],
  defaultVariantId: 'public_announcement',
  objective: {
    objectiveId: 'maintain_rumor_resistance',
    label: 'Maintain leadership confidence by testing rumor resistance after an ambiguous promotion.',
    category: 'stability',
    desiredPressure: 'management_trust',
    intendedObservableBehavior: "Carl's suspicion stays low OR Linda does not spread the rumor.",
    kpi: 'rumor_containment_or_amplification_assessment',
    expectedEvidence: ['belief changes', 'rumor reach count', 'trust metrics'],
  },
};

export const DEFAULT_SCENARIOS: Scenario[] = [PROMOTION_RUMOR_001];

/**
 * The shared, reusable drive catalog. Drives are common across an office cast, so
 * they live at the project level; personas reference them by id. `amplifiesNeeds`
 * is the sim-facing coupling (which needs the drive pushes). Free to extend.
 */
const drive = (
  id: string,
  category: DriveDefinition['category'],
  amplifiesNeeds: DriveDefinition['amplifiesNeeds'],
  label: string,
  description: string,
): DriveDefinition => ({ id, label, description, category, amplifiesNeeds });

export const DEFAULT_DRIVES: DriveDefinition[] = [
  // Status & advancement
  drive('advance_career', 'status', ['recognition', 'competence'], 'Advance career', 'Climb the ladder; take on higher-profile work.'),
  drive('seek_promotion', 'status', ['recognition', 'competence'], 'Seek promotion', 'Angle for the next title and pay bump.'),
  drive('prove_readiness', 'status', ['competence', 'recognition'], 'Prove readiness', 'Demonstrate they can handle more responsibility.'),
  drive('prove_competence', 'status', ['competence'], 'Prove competence', 'Show they are good at the job.'),
  drive('gain_recognition', 'status', ['recognition'], 'Gain recognition', 'Be seen and credited for contributions.'),
  drive('protect_status', 'status', ['recognition', 'security'], 'Protect status', 'Defend standing and seniority from threats.'),
  drive('earn_respect', 'status', ['recognition', 'belonging'], 'Earn respect', 'Be taken seriously by peers and leadership.'),
  drive('outperform_rivals', 'status', ['competence', 'recognition'], 'Outperform rivals', 'Beat specific colleagues at the work.'),
  drive('impress_leadership', 'status', ['recognition'], 'Impress leadership', 'Win favor with managers and executives.'),
  drive('preserve_leadership_confidence', 'status', ['recognition', 'security'], 'Preserve leadership confidence', 'Keep leadership trusting their judgment.'),
  // Security & risk
  drive('job_security', 'security', ['security'], 'Job security', 'Stay safely employed; avoid the chopping block.'),
  drive('avoid_blame', 'security', ['security'], 'Avoid blame', 'Stay clear of fault when things go wrong.'),
  drive('avoid_reputational_damage', 'security', ['security', 'recognition'], 'Avoid reputational damage', 'Protect their name from a black mark.'),
  drive('avoid_conflict', 'security', ['belonging', 'rest'], 'Avoid conflict', 'Steer clear of confrontation and friction.'),
  drive('reduce_uncertainty', 'security', ['security'], 'Reduce uncertainty', 'Pin down ambiguity; know where they stand.'),
  drive('contain_variance', 'security', ['security', 'autonomy'], 'Contain variance', 'Keep outcomes predictable and under control.'),
  drive('minimize_effort', 'security', ['rest', 'autonomy'], 'Minimize effort', 'Get by with the least work required.'),
  // Power & autonomy
  drive('gain_influence', 'power', ['autonomy', 'recognition'], 'Gain influence', 'Build sway over decisions and people.'),
  drive('maintain_control', 'power', ['autonomy', 'security'], 'Maintain control', 'Keep a grip on their domain and outcomes.'),
  drive('maximize_autonomy', 'power', ['autonomy'], 'Maximize autonomy', 'Work on their own terms, free of oversight.'),
  // Social & belonging
  drive('maintain_social_access', 'social', ['belonging'], 'Maintain social access', 'Stay in the loop and connected.'),
  drive('build_alliances', 'social', ['belonging', 'autonomy'], 'Build alliances', 'Cultivate allies and mutual favors.'),
  drive('be_liked', 'social', ['belonging', 'recognition'], 'Be liked', 'Be popular and well-regarded socially.'),
  drive('belong', 'social', ['belonging'], 'Belong', 'Feel part of the group; fit in.'),
  drive('preserve_harmony', 'social', ['belonging', 'rest'], 'Preserve harmony', 'Keep the peace across the team.'),
  drive('settle_score', 'social', ['recognition'], 'Settle a score', 'Get even with someone who wronged them.'),
  // Values & growth
  drive('uphold_fairness', 'growth', ['belonging', 'autonomy'], 'Uphold fairness', 'Insist things be done right and even-handedly.'),
  drive('challenge_unfair_advancement', 'growth', ['recognition', 'autonomy'], 'Challenge unfair advancement', 'Contest a promotion or call they see as unjust.'),
  drive('expose_wrongdoing', 'growth', ['autonomy', 'recognition'], 'Expose wrongdoing', 'Bring misconduct to light.'),
  drive('mentor_others', 'growth', ['belonging', 'competence'], 'Mentor others', 'Develop and look after junior colleagues.'),
  drive('master_craft', 'growth', ['competence'], 'Master the craft', 'Get genuinely excellent at the work itself.'),
  drive('protect_team', 'growth', ['belonging', 'security'], 'Protect the team', 'Shield the group from blame and overload.'),
];

/**
 * The shared, reusable trait catalog. Traits are personality shorthand personas
 * reference by id (`personality.traitTags`). `biasesReactions` is the sim-facing
 * coupling — signed −2..+2 nudges to reaction propensities the sim applies on top
 * of the spine-derived tendencies. Only behavioural traits carry biases; the rest
 * are categorized descriptors (extend or tune freely).
 */
const trait = (
  id: string,
  category: TraitDefinition['category'],
  biasesReactions: TraitDefinition['biasesReactions'],
  label: string,
  description: string,
): TraitDefinition => ({ id, label, description, category, biasesReactions });

export const DEFAULT_TRAITS: TraitDefinition[] = [
  // Work ethic & drive
  trait('workaholic', 'work_ethic', {}, 'Workaholic', 'Lives at the office; always working.'),
  trait('hard_working', 'work_ethic', {}, 'Hard-working', 'Reliably puts in the effort.'),
  trait('ambitious', 'work_ethic', { escalate: 1 }, 'Ambitious', 'Hungry to get ahead.'),
  trait('climber', 'work_ethic', { escalate: 1 }, 'Climber', 'Openly angling up the ladder.'),
  trait('overachiever', 'work_ethic', { verify: 1 }, 'Overachiever', 'Goes well beyond what is asked.'),
  trait('perfectionist', 'work_ethic', { verify: 2 }, 'Perfectionist', 'Sweats every detail; hard to satisfy.'),
  trait('deadline_driven', 'work_ethic', {}, 'Deadline-driven', 'Sprints as the clock runs down.'),
  trait('slacker', 'work_ethic', { ignore: 2, withdraw: 1 }, 'Slacker', 'Coasts on minimum effort.'),
  trait('procrastinator', 'work_ethic', { ignore: 1 }, 'Procrastinator', 'Puts things off to the last minute.'),
  trait('coaster', 'work_ethic', { ignore: 1 }, 'Coaster', 'Does just enough to get by.'),
  // Social style
  trait('social', 'social', { gossip: 1, reassure: 1 }, 'Social', 'Energized by people; chats freely.'),
  trait('socially_connected', 'social', { gossip: 1 }, 'Socially connected', 'Knows everyone; well-networked.'),
  trait('networker', 'social', { gossip: 1 }, 'Networker', 'Works the room for contacts.'),
  trait('team_player', 'social', { reassure: 1 }, 'Team player', 'Pulls for the group over self.'),
  trait('office_mom', 'social', { reassure: 2 }, 'Office mom', 'Looks after everyone; the caretaker.'),
  trait('people_pleaser', 'social', { reassure: 2, confront: -1 }, 'People-pleaser', 'Avoids saying no; seeks approval.'),
  trait('charmer', 'social', { reassure: 1 }, 'Charmer', 'Smooth and likeable.'),
  trait('class_clown', 'social', { reassure: 1, confront: -1 }, 'Class clown', 'Defuses with jokes.'),
  trait('peacemaker', 'social', { reassure: 2, escalate: -1 }, 'Peacemaker', 'Smooths over conflict.'),
  trait('lone_wolf', 'social', { withdraw: 2, gossip: -1 }, 'Lone wolf', 'Keeps to themselves; works solo.'),
  trait('wallflower', 'social', { withdraw: 2, confront: -1 }, 'Wallflower', 'Quiet; fades into the background.'),
  trait('private', 'social', { withdraw: 1, gossip: -1 }, 'Private', 'Guards their personal life.'),
  // Information & politics
  trait('gossip', 'politics', { gossip: 2 }, 'Gossip', 'Trades in who-said-what.'),
  trait('oversharer', 'politics', { gossip: 1 }, 'Oversharer', 'Says more than they should.'),
  trait('spin_doctor', 'politics', { gossip: 1, verify: -1 }, 'Spin doctor', 'Bends the story to suit them.'),
  trait('brown_noser', 'politics', { reassure: 1, confront: -1 }, 'Brown-noser', 'Flatters those above them.'),
  trait('opportunist', 'politics', {}, 'Opportunist', 'Plays whatever angle helps them.'),
  trait('whistleblower', 'politics', { confront: 1, escalate: 1 }, 'Whistleblower', 'Calls out wrongdoing.'),
  trait('straight_shooter', 'politics', { confront: 1, verify: 1 }, 'Straight shooter', 'Says it plainly; no games.'),
  trait('blunt', 'politics', { confront: 2 }, 'Blunt', 'Tactless and direct.'),
  trait('diplomat', 'politics', { reassure: 2, confront: -1 }, 'Diplomat', 'Tactful; reads the room.'),
  trait('contrarian', 'politics', { confront: 1 }, 'Contrarian', 'Argues the other side on reflex.'),
  trait('instigator', 'politics', { escalate: 2, gossip: 1 }, 'Instigator', 'Stirs the pot.'),
  trait('drama_magnet', 'politics', { escalate: 1, gossip: 1 }, 'Drama magnet', 'Trouble seems to find them.'),
  // Temperament
  trait('worrier', 'temperament', { withdraw: 1, verify: 1 }, 'Worrier', 'Anxious; sees the downside.'),
  trait('high_strung', 'temperament', { escalate: 1, withdraw: 1 }, 'High-strung', 'Tense and easily rattled.'),
  trait('hot_headed', 'temperament', { confront: 2, escalate: 2 }, 'Hot-headed', 'Quick to anger.'),
  trait('even_keeled', 'temperament', { escalate: -1, reassure: 1 }, 'Even-keeled', 'Steady under pressure.'),
  trait('thick_skinned', 'temperament', { ignore: 1, escalate: -1 }, 'Thick-skinned', 'Brushes off criticism.'),
  trait('sensitive', 'temperament', { withdraw: 1 }, 'Sensitive', 'Takes things to heart.'),
  trait('grudge_holder', 'temperament', { escalate: 1, reassure: -1 }, 'Grudge-holder', 'Slow to let things go.'),
  trait('forgiving', 'temperament', { reassure: 2, escalate: -1 }, 'Forgiving', 'Quick to move past slights.'),
  trait('optimist', 'temperament', { reassure: 1 }, 'Optimist', 'Expects things to work out.'),
  trait('pessimist', 'temperament', { withdraw: 1 }, 'Pessimist', 'Braces for the worst.'),
  trait('cynical', 'temperament', { verify: 1, reassure: -1 }, 'Cynical', 'Assumes the worst of motives.'),
  trait('easygoing', 'temperament', { ignore: 1, confront: -1 }, 'Easygoing', 'Relaxed; goes with the flow.'),
  trait('trusting', 'temperament', { reassure: 1, verify: -1 }, 'Trusting', 'Takes people at their word.'),
  trait('suspicious', 'temperament', { verify: 2, reassure: -1 }, 'Suspicious', 'Wary of others’ intentions.'),
  // Integrity & rules
  trait('rule_follower', 'integrity', { verify: 1 }, 'Rule-follower', 'Plays it by the book.'),
  trait('rule_bender', 'integrity', {}, 'Rule-bender', 'Treats rules as suggestions.'),
  trait('loyalist', 'integrity', {}, 'Loyalist', 'Stands by their people.'),
  trait('idealist', 'integrity', {}, 'Idealist', 'Holds to principle over expedience.'),
  // Openness & thinking
  trait('curious', 'openness', { verify: 1 }, 'Curious', 'Wants to know how things work.'),
  trait('creative', 'openness', {}, 'Creative', 'Generates novel ideas.'),
  trait('experimental', 'openness', {}, 'Experimental', 'Likes to try new approaches.'),
  trait('set_in_their_ways', 'openness', {}, 'Set in their ways', 'Resists change.'),
  trait('traditional', 'openness', {}, 'Traditional', 'Prefers the established way.'),
  trait('detail_oriented', 'openness', { verify: 2 }, 'Detail-oriented', 'Catches the small stuff.'),
  trait('big_picture', 'openness', {}, 'Big-picture', 'Thinks in strategy, not specifics.'),
  trait('pragmatic', 'openness', {}, 'Pragmatic', 'Whatever works in practice.'),
  trait('practical', 'openness', {}, 'Practical', 'Grounded and no-nonsense.'),
  // Competence & role
  trait('mentor', 'competence', { reassure: 1, verify: 1 }, 'Mentor', 'Develops and guides others.'),
  trait('micromanager', 'competence', { verify: 2, confront: 1 }, 'Micromanager', 'Hovers over every detail.'),
  trait('delegator', 'competence', {}, 'Delegator', 'Hands off and trusts the team.'),
  trait('fixer', 'competence', {}, 'Fixer', 'The one who makes problems go away.'),
  trait('know_it_all', 'competence', { confront: 1, verify: 1 }, 'Know-it-all', 'Always has the answer.'),
  trait('quick_learner', 'competence', {}, 'Quick learner', 'Picks things up fast.'),
  trait('tech_savvy', 'competence', {}, 'Tech-savvy', 'Comfortable with the tools.'),
  trait('organized', 'competence', { verify: 1 }, 'Organized', 'Everything in its place.'),
  trait('scatterbrained', 'competence', { ignore: 1, verify: -1 }, 'Scatterbrained', 'Forgetful and disorganized.'),
  trait('reliable', 'competence', { verify: 1 }, 'Reliable', 'Does what they say they will.'),
  trait('flaky', 'competence', { ignore: 1 }, 'Flaky', 'Hard to count on.'),
  // Status & misc
  trait('competitive', 'status', { escalate: 1, confront: 1 }, 'Competitive', 'Has to win.'),
  trait('recognition_seeking', 'status', {}, 'Recognition-seeking', 'Wants the credit and spotlight.'),
  trait('status_conscious', 'status', {}, 'Status-conscious', 'Keenly aware of pecking order.'),
  trait('frugal', 'status', {}, 'Frugal', 'Careful with money and resources.'),
  trait('generous', 'status', { reassure: 1 }, 'Generous', 'Free with help and credit.'),
  trait('punctual', 'status', {}, 'Punctual', 'Always on time.'),
  trait('always_late', 'status', {}, 'Always late', 'Never quite on schedule.'),
  trait('busy', 'status', {}, 'Busy', 'Perpetually slammed.'),
  trait('prickly', 'status', { confront: 1, reassure: -1 }, 'Prickly', 'Easily irritated; sharp edges.'),
];

/**
 * The shared relationship-type catalog. Bond types relationship edges reference by
 * id (`relationship.relationshipType`). `biasesReactions` colors the holder's
 * reactions toward the target (sim applies, like trait biases); `thirdParty` is
 * the optional jealousy/protectiveness coupling — when the target engages a third
 * party, the holder reacts per `sensitivity` + `biasesReactions`, scaled up toward
 * disliked third parties when `intensifiesTowardDisliked`. Behavior stays sim-side;
 * the tool ships the coupling. Free to extend.
 */
const relType = (
  id: string,
  category: RelationshipTypeDefinition['category'],
  biasesReactions: RelationshipTypeDefinition['biasesReactions'],
  label: string,
  description: string,
  extra?: Partial<Pick<RelationshipTypeDefinition, 'secretByDefault' | 'thirdParty'>>,
): RelationshipTypeDefinition => ({ id, label, description, category, biasesReactions, ...extra });

export const DEFAULT_RELATIONSHIP_TYPES: RelationshipTypeDefinition[] = [
  // Professional
  relType('coworker', 'professional', {}, 'Coworker', 'Neutral colleague; no strong pull either way.'),
  relType('manager', 'professional', { reassure: 1, confront: -1 }, 'Manager', 'Target is the holder’s boss; defers, avoids open conflict.'),
  relType('direct-report', 'professional', { reassure: 1, verify: 1 }, 'Direct report', 'Target reports to the holder; checks in, keeps tabs.'),
  relType('mentor', 'professional', { reassure: 1, verify: 1 }, 'Mentor', 'Target guides the holder; trusts and defers to their read.'),
  relType('protege', 'professional', { reassure: 1 }, 'Protégé', 'Target is the holder’s mentee; protective of them.', {
    thirdParty: { sensitivity: 45, biasesReactions: { verify: 1, confront: 1 }, intensifiesTowardDisliked: true },
  }),
  // Social
  relType('friend', 'social', { reassure: 1 }, 'Friend', 'Genuinely likes the target; gives benefit of the doubt.'),
  relType('close-friend', 'social', { reassure: 2, confront: -1 }, 'Close friend', 'Tight bond; backs them, slow to suspect them.', {
    thirdParty: { sensitivity: 30, biasesReactions: { withdraw: 1 }, intensifiesTowardDisliked: true },
  }),
  relType('confidant', 'social', { reassure: 1, gossip: 1 }, 'Confidant', 'Trades secrets with the target; shares freely with them.'),
  relType('ally', 'social', { reassure: 1, escalate: 1 }, 'Ally', 'Mutual-favor partner; takes their side, amplifies them.'),
  // Romantic (secret by default — office romances usually are)
  relType('romance', 'romantic', { reassure: 2, confront: -1 }, 'Romance', 'Romantic partner; devoted, soft on them — and possessive.', {
    secretByDefault: true,
    thirdParty: { sensitivity: 80, biasesReactions: { confront: 1, withdraw: 1, escalate: 1 }, intensifiesTowardDisliked: true },
  }),
  relType('crush', 'romantic', { reassure: 1, withdraw: 1 }, 'Crush', 'One-sided pining; nervous around them, watchful of rivals.', {
    secretByDefault: true,
    thirdParty: { sensitivity: 60, biasesReactions: { withdraw: 1, gossip: 1 }, intensifiesTowardDisliked: true },
  }),
  relType('work-spouse', 'romantic', { reassure: 2 }, 'Work spouse', 'Platonic-but-exclusive office pairing; playfully territorial.', {
    thirdParty: { sensitivity: 40, biasesReactions: { gossip: 1 }, intensifiesTowardDisliked: false },
  }),
  relType('ex-partner', 'romantic', { confront: 1, withdraw: 1 }, 'Ex-partner', 'Former romance; lingering charge, easily set off.', {
    thirdParty: { sensitivity: 50, biasesReactions: { gossip: 1, escalate: 1 }, intensifiesTowardDisliked: true },
  }),
  // Adversarial
  relType('rival', 'adversarial', { confront: 1, escalate: 1, verify: 1 }, 'Rival', 'Competes with the target; scrutinizes, pushes back.', {
    thirdParty: { sensitivity: 40, biasesReactions: { gossip: 1, escalate: 1 }, intensifiesTowardDisliked: false },
  }),
  relType('nemesis', 'adversarial', { confront: 2, escalate: 1, reassure: -1 }, 'Nemesis', 'Active antagonist; opposes them on reflex.'),
];

/**
 * The shared, reusable workplace-behavior catalog. Behaviors are observable
 * actions the sim selects for agents under pressure (CONTRACT.md §3.14). The tool
 * authors *what exists* + the constraints/couplings; the sim owns selection. The
 * same behavior is reachable from many motivations — "Steal lunch" pulls under
 * resentment, jealousy, spite, or boredom — so `pressureWeights` is a relative
 * pull, not a trigger. `traitModifiers` keys are trait ids (DEFAULT_TRAITS);
 * `relationshipTypeAnyOf` are relationship-type ids (DEFAULT_RELATIONSHIP_TYPES).
 * Free to extend — a designer can add 20–30 more without code.
 */
const behavior = (b: {
  id: string;
  displayName: string;
  category: BehaviorCategory;
  description: string;
  visibility: BehaviorVisibility;
  severity: BehaviorSeverity;
  context?: string[];
  affordances?: string[];
  pressures?: Record<string, number>;
  traits?: Record<string, number>;
  rel?: Partial<BehaviorRelationshipRequirements>;
  outcomes?: string[];
}): BehaviorDefinition => ({
  id: b.id,
  displayName: b.displayName,
  category: b.category,
  description: b.description,
  requiredContext: b.context ?? [],
  requiredAffordances: b.affordances ?? [],
  pressureWeights: b.pressures ?? {},
  traitModifiers: b.traits ?? {},
  relationshipRequirements: {
    requiresTarget: b.rel?.requiresTarget ?? false,
    targetKnown: b.rel?.targetKnown ?? false,
    relationshipTypeAnyOf: b.rel?.relationshipTypeAnyOf ?? [],
  },
  visibility: b.visibility,
  severity: b.severity,
  outcomes: b.outcomes ?? [],
});

export const DEFAULT_BEHAVIORS: BehaviorDefinition[] = [
  // --- Productivity ---------------------------------------------------------
  behavior({
    id: 'complete_task', displayName: 'Complete task', category: 'productivity', visibility: 'semi-private', severity: 'trivial',
    description: 'Finishes assigned work on time.',
    affordances: ['computer', 'document'],
    pressures: { ambition: 2, anxiety: 1 }, traits: { workaholic: 2, hard_working: 2, overachiever: 1, slacker: -2 },
    outcomes: ['task_complete', 'reputation_gain'],
  }),
  behavior({
    id: 'print_report', displayName: 'Print report', category: 'productivity', visibility: 'public', severity: 'trivial',
    description: 'Heads to the printer to run off a report — a routine trip that puts them in a shared space.',
    context: ['own_desk'], affordances: ['printer', 'document'],
    pressures: { ambition: 1 }, traits: { hard_working: 1, organized: 1 },
    outcomes: ['task_complete'],
  }),
  behavior({
    id: 'volunteer', displayName: 'Volunteer', category: 'productivity', visibility: 'public', severity: 'minor',
    description: 'Puts a hand up for extra or visible work.',
    context: ['meeting', 'audience_present'],
    pressures: { ambition: 3, insecurity: 1 }, traits: { ambitious: 2, climber: 2, overachiever: 2, brown_noser: 1, slacker: -2 },
    outcomes: ['reputation_gain', 'manager_notices'],
  }),
  behavior({
    id: 'ask_for_help', displayName: 'Ask for help', category: 'productivity', visibility: 'semi-private', severity: 'trivial',
    description: 'Reaches out to a colleague when stuck.',
    context: ['target_employee'],
    pressures: { anxiety: 2, overwhelm: 2 }, traits: { team_player: 1, people_pleaser: 1, lone_wolf: -2, private: -1 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['task_complete', 'trust_gain'],
  }),
  behavior({
    id: 'delay_task', displayName: 'Delay task', category: 'productivity', visibility: 'private', severity: 'minor',
    description: 'Pushes work to the last possible moment.',
    affordances: ['computer'],
    pressures: { boredom: 2, overwhelm: 2, anxiety: 1 }, traits: { procrastinator: 3, slacker: 2, deadline_driven: 1, hard_working: -2 },
    outcomes: ['task_delayed'],
  }),
  behavior({
    id: 'skip_task', displayName: 'Skip task', category: 'productivity', visibility: 'private', severity: 'moderate',
    description: 'Quietly drops an assigned task and hopes no one notices.',
    pressures: { boredom: 2, resentment: 2, overwhelm: 1, spite: 1 }, traits: { slacker: 3, coaster: 2, rule_bender: 1, reliable: -2, hard_working: -3 },
    outcomes: ['task_delayed', 'reputation_loss', 'manager_notices'],
  }),
  // --- Social ---------------------------------------------------------------
  behavior({
    id: 'start_conversation', displayName: 'Start conversation', category: 'social', visibility: 'public', severity: 'trivial',
    description: 'Strikes up a chat with a coworker.',
    context: ['target_employee', 'break_room'],
    pressures: { loneliness: 3, boredom: 2 }, traits: { social: 3, charmer: 1, wallflower: -2, lone_wolf: -2, private: -1 },
    rel: { requiresTarget: true },
    outcomes: ['trust_gain', 'morale_boost'],
  }),
  behavior({
    id: 'share_information', displayName: 'Share information', category: 'social', visibility: 'semi-private', severity: 'minor',
    description: 'Passes along something useful they know.',
    context: ['target_employee'],
    pressures: { loneliness: 1, ambition: 1 }, traits: { team_player: 2, social: 1, oversharer: 1, private: -2, lone_wolf: -1 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['trust_gain', 'gossip_seed'],
  }),
  behavior({
    id: 'spread_rumor', displayName: 'Spread rumor', category: 'social', visibility: 'semi-private', severity: 'major',
    description: 'Passes around an unverified, damaging story about someone.',
    context: ['target_employee', 'break_room'],
    pressures: { jealousy: 3, resentment: 3, spite: 2, envy: 2, boredom: 1 },
    traits: { gossip: 3, instigator: 2, drama_magnet: 2, spin_doctor: 2, diplomat: -2, private: -1, straight_shooter: -2 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['gossip_seed', 'reputation_loss', 'trust_loss', 'conflict_escalation'],
  }),
  behavior({
    id: 'defend_coworker', displayName: 'Defend coworker', category: 'social', visibility: 'public', severity: 'moderate',
    description: 'Steps in to back up a colleague who is being criticized.',
    context: ['target_employee', 'audience_present'],
    pressures: { anger: 2, loneliness: 1, pride: 1 },
    traits: { loyalist: 3, team_player: 2, straight_shooter: 1, office_mom: 1, opportunist: -1 },
    rel: { requiresTarget: true, targetKnown: true, relationshipTypeAnyOf: ['friend', 'close-friend', 'ally', 'protege', 'mentor'] },
    outcomes: ['trust_gain', 'alliance_formed', 'conflict_escalation'],
  }),
  behavior({
    id: 'exclude_coworker', displayName: 'Exclude coworker', category: 'social', visibility: 'semi-private', severity: 'moderate',
    description: 'Deliberately leaves someone out of a lunch, thread, or huddle.',
    context: ['target_employee', 'audience_present'],
    pressures: { resentment: 3, jealousy: 2, contempt: 2, spite: 2 },
    traits: { prickly: 2, instigator: 1, drama_magnet: 1, grudge_holder: 2, office_mom: -2, peacemaker: -2 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['morale_drop', 'trust_loss', 'gossip_seed'],
  }),
  behavior({
    id: 'take_credit', displayName: 'Take credit', category: 'social', visibility: 'public', severity: 'major',
    description: 'Claims someone else’s work or idea as their own.',
    context: ['target_employee', 'meeting', 'audience_present'],
    pressures: { ambition: 3, insecurity: 2, envy: 2 },
    traits: { opportunist: 3, climber: 2, ambitious: 2, brown_noser: 1, spin_doctor: 1, loyalist: -2, straight_shooter: -2 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['reputation_gain', 'trust_loss', 'conflict_escalation', 'gossip_seed'],
  }),
  // --- Territorial ----------------------------------------------------------
  behavior({
    id: 'take_preferred_seat', displayName: 'Take preferred seat', category: 'territorial', visibility: 'public', severity: 'trivial',
    description: 'Claims the good desk or chair before anyone else can.',
    context: ['open_floor', 'shared_space'], affordances: ['preferred_seat'],
    pressures: { insecurity: 1, pride: 2, spite: 1 }, traits: { competitive: 2, prickly: 1, status_conscious: 2, easygoing: -2 },
    outcomes: ['target_annoyed'],
  }),
  behavior({
    id: 'reserve_meeting_room', displayName: 'Reserve meeting room', category: 'territorial', visibility: 'semi-private', severity: 'minor',
    description: 'Block-books a room they may not need, denying it to others.',
    affordances: ['meeting_room', 'shared_calendar'],
    pressures: { insecurity: 2, pride: 1, contempt: 1 }, traits: { status_conscious: 2, micromanager: 1, competitive: 1, team_player: -1 },
    outcomes: ['target_annoyed', 'reputation_loss'],
  }),
  behavior({
    id: 'hide_supplies', displayName: 'Hide supplies', category: 'territorial', visibility: 'private', severity: 'moderate',
    description: 'Squirrels away shared supplies so only they can use them.',
    context: ['shared_space'], affordances: ['supplies'],
    pressures: { insecurity: 3, resentment: 2, spite: 2, anxiety: 1 }, traits: { frugal: 2, prickly: 2, suspicious: 1, generous: -2, team_player: -2 },
    outcomes: ['target_annoyed', 'gossip_seed'],
  }),
  behavior({
    id: 'take_parking_spot', displayName: 'Take parking spot', category: 'territorial', visibility: 'public', severity: 'minor',
    description: 'Grabs someone’s usual parking spot.',
    affordances: ['parking_spot'],
    pressures: { spite: 2, resentment: 2, contempt: 1, pride: 1 }, traits: { competitive: 2, prickly: 2, grudge_holder: 1, easygoing: -2 },
    rel: { requiresTarget: true },
    outcomes: ['target_annoyed', 'conflict_escalation'],
  }),
  behavior({
    id: 'steal_lunch', displayName: 'Steal lunch', category: 'territorial', visibility: 'private', severity: 'major',
    description: 'Takes another employee’s lunch from the break room.',
    context: ['break_room', 'target_employee', 'manager_absent'], affordances: ['lunch'],
    pressures: { resentment: 3, jealousy: 2, spite: 2, boredom: 1, contempt: 1 },
    traits: { rule_bender: 2, prickly: 2, opportunist: 1, grudge_holder: 1, rule_follower: -3, reliable: -2 },
    rel: { requiresTarget: true },
    outcomes: ['target_annoyed', 'trust_loss', 'gossip_seed'],
  }),
  // --- Coping ---------------------------------------------------------------
  behavior({
    id: 'eat_lunch_alone', displayName: 'Eat lunch alone', category: 'coping', visibility: 'public', severity: 'trivial',
    description: 'Withdraws to eat by themselves rather than with the group.',
    context: ['break_room', 'private_space'], affordances: ['lunch'],
    pressures: { loneliness: 2, anxiety: 2, overwhelm: 2, resentment: 1 }, traits: { lone_wolf: 3, wallflower: 2, private: 2, social: -2, office_mom: -1 },
    outcomes: ['stress_relief', 'morale_drop'],
  }),
  behavior({
    id: 'browse_job_boards', displayName: 'Browse job boards', category: 'coping', visibility: 'private', severity: 'moderate',
    description: 'Quietly looks at other jobs during the workday.',
    context: ['own_desk', 'manager_absent'], affordances: ['computer'],
    pressures: { resentment: 3, frustration: 3, overwhelm: 2, contempt: 1 }, traits: { cynical: 2, opportunist: 2, loyalist: -3 },
    outcomes: ['morale_drop'],
  }),
  behavior({
    id: 'take_long_walk', displayName: 'Take long walk', category: 'coping', visibility: 'semi-private', severity: 'trivial',
    description: 'Steps out for an extended break to cool off.',
    context: ['after_hours', 'manager_absent'],
    pressures: { overwhelm: 3, anger: 2, anxiety: 2, frustration: 2 }, traits: { even_keeled: 1, worrier: 1, high_strung: 1 },
    outcomes: ['stress_relief'],
  }),
  behavior({
    id: 'vent_to_friend', displayName: 'Vent to friend', category: 'coping', visibility: 'semi-private', severity: 'minor',
    description: 'Unloads frustrations to a trusted colleague.',
    context: ['target_employee', 'break_room', 'one_on_one'],
    pressures: { frustration: 3, resentment: 2, anger: 2, loneliness: 1 }, traits: { social: 1, oversharer: 1, private: -1, lone_wolf: -2 },
    rel: { requiresTarget: true, targetKnown: true, relationshipTypeAnyOf: ['friend', 'close-friend', 'confidant', 'work-spouse'] },
    outcomes: ['stress_relief', 'gossip_seed', 'trust_gain'],
  }),
  behavior({
    id: 'excessive_coffee', displayName: 'Excessive coffee', category: 'coping', visibility: 'public', severity: 'trivial',
    description: 'Makes repeated trips to the coffee machine to self-soothe and stall.',
    context: ['break_room'], affordances: ['coffee_machine'],
    pressures: { anxiety: 3, overwhelm: 2, boredom: 2 }, traits: { high_strung: 2, worrier: 1 },
    outcomes: ['stress_relief'],
  }),
  // --- Escalation -----------------------------------------------------------
  behavior({
    id: 'direct_confrontation', displayName: 'Direct confrontation', category: 'escalation', visibility: 'public', severity: 'major',
    description: 'Confronts someone face to face about a grievance.',
    context: ['target_employee', 'one_on_one'],
    pressures: { anger: 3, resentment: 3, frustration: 2, pride: 1 },
    traits: { hot_headed: 3, blunt: 2, straight_shooter: 2, contrarian: 1, competitive: 1, peacemaker: -3, people_pleaser: -2, even_keeled: -2 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['conflict_escalation', 'trust_loss', 'stress_relief'],
  }),
  behavior({
    id: 'meeting_outburst', displayName: 'Meeting outburst', category: 'escalation', visibility: 'public', severity: 'severe',
    description: 'Loses their composure in front of the room.',
    context: ['meeting', 'audience_present'],
    pressures: { anger: 3, frustration: 3, resentment: 2, overwhelm: 2 },
    traits: { hot_headed: 3, high_strung: 2, drama_magnet: 2, blunt: 1, even_keeled: -3, thick_skinned: -2, diplomat: -2 },
    outcomes: ['conflict_escalation', 'reputation_loss', 'gossip_seed', 'manager_notices'],
  }),
  behavior({
    id: 'public_complaint', displayName: 'Public complaint', category: 'escalation', visibility: 'public', severity: 'major',
    description: 'Airs a grievance loudly where everyone can hear.',
    context: ['open_floor', 'audience_present'],
    pressures: { frustration: 3, resentment: 3, anger: 2, contempt: 1 },
    traits: { blunt: 2, contrarian: 2, drama_magnet: 2, instigator: 1, diplomat: -2, private: -2 },
    outcomes: ['gossip_seed', 'conflict_escalation', 'reputation_loss'],
  }),
  behavior({
    id: 'passive_aggressive_note', displayName: 'Passive-aggressive note', category: 'escalation', visibility: 'semi-private', severity: 'moderate',
    description: 'Leaves a pointed note or message instead of saying it directly.',
    context: ['shared_space'], affordances: ['document'],
    pressures: { resentment: 3, spite: 2, frustration: 2, contempt: 2 },
    traits: { grudge_holder: 2, prickly: 2, spin_doctor: 1, straight_shooter: -2, blunt: -1, diplomat: -1 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['target_annoyed', 'gossip_seed', 'conflict_escalation'],
  }),
  behavior({
    id: 'anonymous_report', displayName: 'Anonymous report', category: 'escalation', visibility: 'private', severity: 'major',
    description: 'Reports someone without attaching their own name.',
    context: ['manager_absent'], affordances: ['computer'],
    pressures: { resentment: 3, spite: 3, fear: 2, contempt: 2, guilt: 1 },
    traits: { whistleblower: 2, cynical: 2, grudge_holder: 2, opportunist: 1, straight_shooter: -2, loyalist: -2 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['hr_attention', 'reputation_loss', 'conflict_escalation'],
  }),
  behavior({
    id: 'hr_complaint', displayName: 'HR complaint', category: 'escalation', visibility: 'semi-private', severity: 'severe',
    description: 'Files a formal complaint through official channels.',
    context: ['one_on_one', 'private_space'], affordances: ['document'],
    pressures: { anger: 2, resentment: 3, fear: 2, frustration: 2 },
    traits: { whistleblower: 3, rule_follower: 2, straight_shooter: 2, idealist: 1, people_pleaser: -2, loyalist: -1 },
    rel: { requiresTarget: true, targetKnown: true },
    outcomes: ['hr_attention', 'conflict_escalation', 'reputation_loss'],
  }),
];

/**
 * The seed department catalog (Epic 2 F2.1 / S2.1.2) — the existing office
 * department-name set (profile.ts DEPARTMENTS + the Office Population Generator
 * profiles) promoted to structured entries with stable kebab-case ids, so authors
 * don't re-author them. Free-text `department` values map onto these via
 * mapDepartmentNameToId (label/id match). Category is the coarse functional group.
 * Each entry is seeded with its category's default capability/medium grant (F2.4),
 * overridable per department.
 */
const SEED_DEPARTMENTS: Array<Pick<DepartmentDefinition, 'id' | 'label' | 'category'>> = [
  { id: 'executive', label: 'Executive', category: 'leadership' },
  { id: 'management', label: 'Management', category: 'leadership' },
  { id: 'accounting', label: 'Accounting', category: 'finance' },
  { id: 'finance', label: 'Finance', category: 'finance' },
  { id: 'sales', label: 'Sales', category: 'commercial' },
  { id: 'marketing', label: 'Marketing', category: 'commercial' },
  { id: 'customer-support', label: 'Customer Support', category: 'commercial' },
  { id: 'it', label: 'IT', category: 'technical' },
  { id: 'engineering', label: 'Engineering', category: 'technical' },
  { id: 'operations', label: 'Operations', category: 'operations' },
  { id: 'facilities', label: 'Facilities', category: 'operations' },
  { id: 'hr', label: 'HR', category: 'administrative' },
  { id: 'legal', label: 'Legal', category: 'administrative' },
];
export const DEFAULT_DEPARTMENTS: DepartmentDefinition[] = SEED_DEPARTMENTS.map((d) => ({
  ...d,
  capabilities: defaultCapabilitiesForCategory(d.category),
  theme: defaultThemeForCategory(d.category),
}));

/** Everything in the default project except the baseline office scene. */
function baseDefaultProject(): ProjectState {
  return {
    version: CURRENT_SCHEMA_VERSION,
    style: structuredClone(DEFAULT_STYLE),
    stylePresets: structuredClone(DEFAULT_STYLE_PRESETS),
    characters: structuredClone(DEFAULT_CAST),
    props: structuredClone(DEFAULT_PROPS),
    walls: structuredClone(DEFAULT_WALLS),
    floors: structuredClone(DEFAULT_FLOORS),
    ground: structuredClone(DEFAULT_GROUND),
    profiles: structuredClone(DEFAULT_PROFILES),
    scenarios: structuredClone(DEFAULT_SCENARIOS),
    drives: structuredClone(DEFAULT_DRIVES),
    traits: structuredClone(DEFAULT_TRAITS),
    relationshipTypes: structuredClone(DEFAULT_RELATIONSHIP_TYPES),
    departments: structuredClone(DEFAULT_DEPARTMENTS),
    behaviors: structuredClone(DEFAULT_BEHAVIORS),
    // The default project is a complete company package: MERIDIAN_DYNAMICS (the
    // reference declining-incumbent, exercising every Company field) is the org
    // the hero cast works at, so a plain export emits company.json and the full
    // bundle is testable in the sim without running the cascade. The 4-person
    // hero cast stays the sim-bound fixture (see tests/contract.test.ts); the
    // generated multi-department baseline lives behind `export company:<seed>`.
    company: structuredClone(MERIDIAN_DYNAMICS),
  };
}

/** Deterministic seed for the baseline office, matching the headless `default` export. */

/**
 * The baseline office, generated once at module load so a Reset-all restores the
 * same wing-tagged hero office the export ships (Epic 1 wings: the bullpen is the
 * operations wing, the manager office is the management wing, everything else is
 * common). Hero cast only (no throwaway coworkers) — populate via the Office tab.
 * Cloned per `defaultProject()` call so callers can mutate freely.
 */
const DEFAULT_SCENE = defaultSceneJson as unknown as SceneState;

export function defaultProject(): ProjectState {
  return { ...baseDefaultProject(), scene: structuredClone(DEFAULT_SCENE) };
}

// --- The golden baseline: a complete, multi-department, populated company -------
// The hero cast (operations + management) anchored inside a generated supporting
// company so a plain Reset / first-load / `export default` yields the full bundle
// the sim consumes — multi-wing populated office + personas + relationships +
// company + scenario(-template) — without anyone running the cascade by hand.

const GOLDEN_SEED = 1;
/** How many department wings the golden office shows (kept usable, not all 13). */
const GOLDEN_WING_COUNT = 5;
/** Generated coworkers per non-operations wing (operations is the hero cast). */
const GOLDEN_PER_DEPT = 2;

/** The department wings the golden office populates: derived from MERIDIAN, capped,
 *  operations guaranteed (the hero cast), management excluded (it's the manager office). */
function goldenWingDepartments(base: ProjectState): string[] {
  const derived = deriveDepartments(MERIDIAN_DYNAMICS, base.departments, String(GOLDEN_SEED))
    .map((d) => d.id)
    .filter((id) => id !== 'management');
  const ordered = ['operations', ...derived.filter((id) => id !== 'operations')];
  return [...new Set(ordered)].slice(0, GOLDEN_WING_COUNT);
}

function buildDefaultGoldenProject(): ProjectState {
  const base = baseDefaultProject();
  const wingDepartmentIds = goldenWingDepartments(base);
  const characters = [...base.characters];
  const profiles = [...(base.profiles ?? [])];

  // Generate a supporting population for every wing except operations (the hero
  // cast fills that). Each coworker gets a full persona (F3.2). Ids are stable and
  // un-prefixed so they count as seated population, not throwaway filler.
  for (const dept of wingDepartmentIds) {
    if (dept === 'operations') continue;
    const visualProfile = getProfile(dept).id;
    const pop = generatePopulation(GOLDEN_PER_DEPT, visualProfile, base.style, `golden:${dept}`);
    pop.employees.forEach((emp, i) => {
      emp.metadata.department = dept;
      const recipe = { ...employeeRecipe(emp), id: `golden-${dept}-${i + 1}` };
      characters.push(recipe);
      profiles.push(generateEmployeePersona(emp, recipe));
    });
  }

  // Wire relationships across the whole cohort (appends — the hero cast's authored
  // edges are preserved); gives the generated population intra/inter-dept ties.
  generateRelationshipGraph(profiles, { seed: 'golden', relationshipTypes: base.relationshipTypes });

  const project: ProjectState = { ...base, characters, profiles };
  // The populated multi-department office is a baked snapshot (ADR-0001) — the sim owns
  // office generation now. The population above stays deterministic, so the baked scene's
  // desks/spawns still match this cast; re-bake if the population inputs change.
  const office = structuredClone(goldenSceneJson) as unknown as SceneState;
  // Bake in the non-playable building surround (the "floor in a tower" border) so the
  // golden baseline ships it: a plain Reset / first-load / `export default` carries the
  // ring + tenantRect, per the "every system contributes a default" principle. This is a
  // deterministic tool-side transform we own (core/buildingSurround.ts), applied on top
  // of the baked office rather than baked into the JSON, so it tracks the surround logic.
  project.scene = addBuildingSurround(office, project);
  return project;
}

/** Built once at module load; structuredClone'd per call so callers can mutate. */
const DEFAULT_GOLDEN_PROJECT = buildDefaultGoldenProject();

/**
 * The complete golden baseline used by Reset-all, first-load, and `export default`:
 * the hero cast inside a generated multi-department company with a populated,
 * wing-tagged office. `defaultProject()` stays the minimal hero-only base.
 */
export function defaultGoldenProject(): ProjectState {
  return structuredClone(DEFAULT_GOLDEN_PROJECT);
}
