import { describe, expect, it } from 'vitest';

import {
  ACCEPTED_CORRIDOR_GATE,
  ACCEPTED_MAPPING_GATE,
  ARCHIVED_WORKBENCH_BOARDS,
  CURRENT_WORKBENCH_BOARDS,
  NEXT_SYSTEM_GATE,
  renderStyleWorkbenchPage,
} from '../scripts/highOblique/styleWorkbenchPage';
import { EQUAL_HEIGHT_CORRIDOR_GATE } from '../scripts/highOblique/equalHeightCorridorGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';

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

  it('keeps the corridor and mapping structure accepted while naming one bounded next proof', () => {
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
      summary: 'Accepted topology map: 3 direct reuses, 3 approved derivations, 36 synthetic candidates, and 5 explicit authored-geometry gaps.',
      alt: 'owner-accepted equal-height 47-mask mapping ledger with unaccepted synthetic candidates',
    });
    expect(NEXT_SYSTEM_GATE).toEqual({
      state: 'next',
      title: 'Horizontal terminus pair',
      summary: 'Prove mask_8 as direct source reuse and mask_2 as its whole-cell X mirror before designing either vertical end.',
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
    expect(primary).toContain('data-state="system-review" data-gate="next"');
    expect(primary).toContain('Next proof-only decision');
    expect(primary).toContain('Next · Proof only');
    expect(primary).toContain('Horizontal terminus pair');
    expect(primary).toContain('mask_8 as direct source reuse');
    expect(page).toContain('3×8 narrow-corridor closure');
    expect(page).toContain('Accepted equal-height enclosure baseline at 90 and 40 pixels per cell');
    expect(page).toContain('Accepted system mapping');
    expect(occurrences(page, '47-mask mapping ledger')).toBe(3);
    expect(page).toContain('36 synthetic candidates remain proof-only');
    expect(page.indexOf('data-gate="next"'))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_MAPPING_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_MAPPING_GATE.stem}"`))
      .toBeLessThan(page.indexOf(`data-stem="${ACCEPTED_CORRIDOR_GATE.stem}"`));
    expect(page.indexOf(`data-stem="${ACCEPTED_CORRIDOR_GATE.stem}"`))
      .toBeLessThan(page.indexOf('id="accepted-title"'));
    expect(page).not.toContain('Review next ·');
    expect(page).not.toContain('current-section review');
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
    expect(page).toContain('mapping:s.mappingRenderedAt');
    expect(page).toContain('corridor:s.corridorRenderedAt');
    expect(page).not.toContain('querySelector("figure.gate")');
    expect(page).not.toContain('querySelector("figure.proofs")');
  });
});
