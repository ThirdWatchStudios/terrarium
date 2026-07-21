import { describe, expect, it } from 'vitest';

import {
  ARCHIVED_WORKBENCH_BOARDS,
  CURRENT_WORKBENCH_BOARDS,
  renderStyleWorkbenchPage,
} from '../scripts/highOblique/styleWorkbenchPage';

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
    expect(page).toContain('Next system gate');
    expect(page).toContain('Equal-height room · Corridor · Autotiling joins');
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
    expect(page).not.toContain('querySelector("figure.gate")');
    expect(page).not.toContain('querySelector("figure.proofs")');
  });
});
