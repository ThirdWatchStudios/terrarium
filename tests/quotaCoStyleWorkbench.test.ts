import { describe, expect, it } from 'vitest';

import {
  ACCEPTED_CORRIDOR_GATE,
  ACCEPTED_HORIZONTAL_TERMINUS_GATE,
  ACCEPTED_MAPPING_GATE,
  ACCEPTED_VERTICAL_TERMINUS_GATE,
  ARCHIVED_WORKBENCH_BOARDS,
  CURRENT_WORKBENCH_BOARDS,
  renderStyleWorkbenchPage,
} from '../scripts/highOblique/styleWorkbenchPage';
import { EQUAL_HEIGHT_CORRIDOR_GATE } from '../scripts/highOblique/equalHeightCorridorGate';
import { EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE } from '../scripts/highOblique/equalHeightHorizontalTerminusGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE } from '../scripts/highOblique/equalHeightVerticalTerminusGate';

const occurrences = (source: string, needle: string): number => source.split(needle).length - 1;

describe('QuotaCo current wall workbench', () => {
  it('keeps the exact owner-facing decisions in explicit acceptance states', () => {
    expect(CURRENT_WORKBENCH_BOARDS.map(({ stem, state }) => ({ stem, state }))).toEqual([
      { stem: 'full-height-east-proof', state: 'accepted' },
      { stem: 'full-height-northeast-proof', state: 'accepted' },
      { stem: 'full-height-south-proof', state: 'accepted' },
      { stem: 'full-height-southwest-proof', state: 'accepted' },
      { stem: 'full-height-southeast-proof', state: 'accepted' },
    ]);
  });

  it('keeps the accepted vertical gate above the accepted horizontal, corridor, and mapping gates', () => {
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
      summary: 'Accepted topology map: 4 direct reuses, 6 approved derivations, 36 synthetic candidates, and 1 explicit authored-geometry gap.',
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
  });

  it('shows only current boards in the open primary surface', () => {
    const page = renderStyleWorkbenchPage(['full_n_straight', 'transition_n_to_e']);
    const primary = page.match(/<main id="current-equal-height-wall-system">([\s\S]*?)<\/main>/)?.[1];

    expect(primary).toBeDefined();
    for (const board of CURRENT_WORKBENCH_BOARDS) {
      expect(occurrences(primary!, `data-stem="${board.stem}"`)).toBe(1);
      expect(primary).toContain(`data-stem="${board.stem}" data-refresh="focus"`);
    }
    for (const board of ARCHIVED_WORKBENCH_BOARDS) {
      expect(primary).not.toContain(`data-stem="${board.stem}"`);
    }
    expect(primary).not.toContain('full_n_straight');
    expect(primary).not.toContain('transition_n_to_e');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_VERTICAL_TERMINUS_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_VERTICAL_TERMINUS_GATE.stem}" data-refresh="vertical-terminus"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="vertical-terminus"');
    expect(primary).not.toContain('Review · Not accepted');
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
    expect(primary).toContain('The mapping structure is locked; synthetic assembly diagrams and unresolved geometry are not accepted art.');
    expect(occurrences(primary!, `data-stem="${ACCEPTED_CORRIDOR_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_CORRIDOR_GATE.stem}" data-refresh="corridor"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="corridor"');
    expect(primary).toContain('Accepted system proof');
    expect(primary).toContain('Accepted · System gate');
    expect(primary).toContain('Horizontal terminus pair');
    expect(primary).toContain('Accepted mask_8 direct source');
    expect(page).toContain('No geometry proposal is currently active');
    expect(page).toContain('isolated mask_0 is the only remaining authored-geometry gap');
    expect(page).toContain('3×8 narrow-corridor closure');
    expect(page).toContain('Accepted equal-height enclosure baseline at 90 and 40 pixels per cell');
    expect(page).toContain('Accepted system mapping');
    expect(occurrences(page, '47-mask mapping ledger')).toBe(3);
    expect(page).toContain('36 synthetic candidates remain proof-only');
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
    expect(page).toContain('"vertical-terminus":s.verticalTerminusRenderedAt');
    expect(page).toContain('terminus:s.terminusRenderedAt');
    expect(page).toContain('mapping:s.mappingRenderedAt');
    expect(page).toContain('corridor:s.corridorRenderedAt');
    expect(page).not.toContain('querySelector("figure.gate")');
    expect(page).not.toContain('querySelector("figure.proofs")');
  });
});
