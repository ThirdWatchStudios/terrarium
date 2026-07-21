import { describe, expect, it } from 'vitest';

import {
  ACCEPTED_SYSTEM_GATE,
  ARCHIVED_WORKBENCH_BOARDS,
  CURRENT_WORKBENCH_BOARDS,
  NEXT_SYSTEM_GATE,
  renderStyleWorkbenchPage,
} from '../scripts/highOblique/styleWorkbenchPage';
import { EQUAL_HEIGHT_CORRIDOR_GATE } from '../scripts/highOblique/equalHeightCorridorGate';

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

  it('keeps the corridor accepted while the 47-mask ledger remains proof-only next work', () => {
    expect(ACCEPTED_SYSTEM_GATE).toEqual({
      stem: EQUAL_HEIGHT_CORRIDOR_GATE.stem,
      state: 'accepted',
      title: '3×8 narrow-corridor closure',
      summary: 'Accepted equal-height enclosure baseline at 90 and 40 pixels per cell.',
      alt: 'accepted equal-height wall family narrow-corridor closure gate',
    });
    expect(NEXT_SYSTEM_GATE).toEqual({
      state: 'next',
      title: '47-mask mapping ledger',
      summary: 'Map existing connectivity masks to accepted source reuse and facing rules before a synthetic atlas or production registration.',
    });
    expect(NEXT_SYSTEM_GATE).not.toHaveProperty('stem');
    expect(NEXT_SYSTEM_GATE).not.toHaveProperty('productionRegistration');
    expect(CURRENT_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_SYSTEM_GATE.stem }),
    );
    expect(ARCHIVED_WORKBENCH_BOARDS).not.toContainEqual(
      expect.objectContaining({ stem: ACCEPTED_SYSTEM_GATE.stem }),
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
    expect(occurrences(primary!, `data-stem="${ACCEPTED_SYSTEM_GATE.stem}"`)).toBe(1);
    expect(primary).toContain(
      `data-stem="${ACCEPTED_SYSTEM_GATE.stem}" data-refresh="corridor"`,
    );
    expect(primary).toContain('data-state="system-accepted" data-gate="accepted"');
    expect(primary).toContain('Accepted system proof');
    expect(primary).toContain('Accepted · System gate');
    expect(page).toContain('3×8 narrow-corridor closure');
    expect(page).toContain('Accepted equal-height enclosure baseline at 90 and 40 pixels per cell');
    expect(page).toContain('Next system gate · Proof only');
    expect(occurrences(page, '47-mask mapping ledger')).toBe(1);
    expect(page).toContain('before a synthetic atlas or production registration');
    expect(page.indexOf(`data-stem="${ACCEPTED_SYSTEM_GATE.stem}"`))
      .toBeLessThan(page.indexOf('id="accepted-title"'));
    expect(page).not.toContain('Review now');
    expect(page).not.toContain('system-review');
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
    expect(page).toContain('corridor:s.corridorRenderedAt');
    expect(page).not.toContain('querySelector("figure.gate")');
    expect(page).not.toContain('querySelector("figure.proofs")');
  });
});
