/**
 * The reusable drive catalog editor (Cast → Drives). Drives are project-level,
 * structured motivations personas reference by id; this tab authors the catalog.
 * Editing a drive id cascades to every persona reference so links never break.
 */
import { store } from '../state';
import { button, clear, el, labeled, select } from './dom';
import { listItem, textArea, textField, uid } from './controls';
import { DRIVE_CATEGORIES, NEEDS, NEED_LABELS, type DriveCategory, type DriveDefinition } from '../core/profile';

function catalog(): DriveDefinition[] {
  return store.state.drives;
}

function selectedDrive(): DriveDefinition | undefined {
  return catalog().find((d) => d.id === store.ui.selectedDriveId) ?? catalog()[0];
}

/** Which personas reference a drive id, for the usage panel. */
function usageOf(id: string): { primary: string[]; secondary: string[]; objectives: number } {
  const primary: string[] = [];
  const secondary: string[] = [];
  let objectives = 0;
  for (const p of store.state.profiles ?? []) {
    const who = p.identity.displayName || p.agentId;
    if (p.drives.primary === id) primary.push(who);
    if (p.drives.secondary === id) secondary.push(who);
    objectives += p.drives.objectives.filter((o) => o.sourceDrive === id).length;
  }
  return { primary, secondary, objectives };
}

/** Rename a drive and repoint every persona reference (primary/secondary/sourceDrive). */
function renameDrive(d: DriveDefinition, raw: string): void {
  const next = raw.trim();
  if (!next || next === d.id) return;
  store.mutate((s) => {
    if (s.drives.some((x) => x !== d && x.id === next)) return; // id taken — ignore
    const old = d.id;
    d.id = next;
    for (const p of s.profiles ?? []) {
      if (p.drives.primary === old) p.drives.primary = next;
      if (p.drives.secondary === old) p.drives.secondary = next;
      for (const o of p.drives.objectives) if (o.sourceDrive === old) o.sourceDrive = next;
    }
    store.ui.selectedDriveId = next;
  }, 'structure');
}

export function renderDriveList(container: HTMLElement): void {
  clear(container);
  const current = selectedDrive();
  const list = el('div', { className: 'entity-list' });
  for (const d of catalog()) {
    list.append(
      listItem({
        selected: d.id === current?.id,
        name: d.label || d.id,
        onClick: () => store.mutateUi((ui) => (ui.selectedDriveId = d.id)),
      }),
    );
  }
  container.append(
    list,
    el(
      'div',
      { className: 'list-actions' },
      button(
        '+ New drive',
        () => {
          const def: DriveDefinition = { id: uid('drive'), label: 'New drive', description: '', category: 'status', amplifiesNeeds: [] };
          store.mutate((s) => {
            s.drives.push(def);
            store.ui.selectedDriveId = def.id;
          }, 'structure');
        },
        'primary',
      ),
    ),
  );
}

export function renderDriveControls(container: HTMLElement): void {
  clear(container);
  const d = selectedDrive();
  if (!d) {
    container.append(el('p', { className: 'hint' }, 'No drives in the catalog. Create one to start.'));
    return;
  }

  container.append(
    labeled(
      'Id',
      el('input', {
        type: 'text',
        value: d.id,
        // onChange (blur) so the cascade rename runs once, not per keystroke.
        onChange: (e: Event) => renameDrive(d, (e.target as HTMLInputElement).value),
      }),
    ),
    textField('Label', d.label, (v) => store.mutate(() => (d.label = v), 'data')),
    labeled(
      'Category',
      select(DRIVE_CATEGORIES.map((c) => ({ value: c, label: c })), d.category, (v) =>
        store.mutate(() => (d.category = v as DriveCategory), 'data'),
      ),
    ),
    textArea('Description', d.description, (v) => store.mutate(() => (d.description = v), 'data')),
  );

  const box = el('div', { className: 'check-grid' });
  for (const n of NEEDS) {
    box.append(
      el(
        'label',
        { className: 'check-item' },
        el('input', {
          type: 'checkbox',
          ...(d.amplifiesNeeds.includes(n) ? { checked: true } : {}),
          onChange: () =>
            store.mutate(() => {
              d.amplifiesNeeds = d.amplifiesNeeds.includes(n)
                ? d.amplifiesNeeds.filter((x) => x !== n)
                : [...d.amplifiesNeeds, n];
            }, 'data'),
        }),
        NEED_LABELS[n],
      ),
    );
  }
  container.append(labeled('Amplifies needs', box));

  container.append(
    el(
      'div',
      { className: 'btn-row' },
      button(
        'Delete drive',
        () => {
          const u = usageOf(d.id);
          const used = u.primary.length + u.secondary.length + u.objectives;
          const msg = used
            ? `"${d.label || d.id}" is referenced ${used} time(s). Delete anyway? Those references will become custom/unknown.`
            : `Delete "${d.label || d.id}"?`;
          if (!confirm(msg)) return;
          store.mutate((s) => {
            s.drives = s.drives.filter((x) => x.id !== d.id);
            store.ui.selectedDriveId = s.drives[0]?.id ?? '';
          }, 'structure');
        },
        'danger',
      ),
    ),
  );
}

export function renderDrivePreview(container: HTMLElement): void {
  clear(container);
  const d = selectedDrive();
  if (!d) {
    container.append(el('p', { className: 'hint' }, 'No drives in the catalog.'));
    return;
  }
  const u = usageOf(d.id);
  container.append(
    el(
      'div',
      { className: 'persona-summary' },
      el('div', {}, el('strong', {}, d.label || d.id), ` · ${d.category}`),
      d.description ? el('div', {}, d.description) : null,
      el(
        'div',
        { className: 'tag-chips' },
        ...(d.amplifiesNeeds.length
          ? d.amplifiesNeeds.map((n) => el('span', { className: 'tag-chip' }, NEED_LABELS[n]))
          : [el('span', { className: 'hint' }, 'No need coupling')]),
      ),
    ),
    el('h3', {}, 'Used by'),
    el('p', { className: 'hint' }, `Primary: ${u.primary.join(', ') || '—'}`),
    el('p', { className: 'hint' }, `Secondary: ${u.secondary.join(', ') || '—'}`),
    el('p', { className: 'hint' }, `Objectives sourcing this drive: ${u.objectives}`),
  );
}
