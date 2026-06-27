/**
 * The reusable workplace-behavior catalog editor (Cast → Behaviors). Behaviors are
 * project-level, structured definitions of observable office actions (Steal Lunch,
 * Spread Rumor, …). The tool authors *what exists* and the constraints/couplings;
 * the sim owns *which behavior happens now* (selection, scoring, outcomes). Each
 * carries pressure pulls, trait modifiers (ids into the trait catalog), context /
 * affordance requirements, relationship requirements, and expected outcomes.
 * Exported verbatim as behaviors.json — see CONTRACT.md §3.14.
 */
import { store } from '../state';
import { button, clear, el, labeled, select, slider } from './dom';
import { listItem, textArea, textField, uid } from './controls';
import {
  AFFORDANCE_SUGGESTIONS,
  BEHAVIOR_CATEGORIES,
  BEHAVIOR_CATEGORY_LABELS,
  BEHAVIOR_SEVERITY,
  BEHAVIOR_VISIBILITY,
  CONTEXT_SUGGESTIONS,
  OUTCOME_SUGGESTIONS,
  PRESSURE_SUGGESTIONS,
  createDefaultBehavior,
  type BehaviorCategory,
  type BehaviorDefinition,
  type BehaviorSeverity,
  type BehaviorVisibility,
} from '../core/behavior';

function catalog(): BehaviorDefinition[] {
  return store.state.behaviors;
}

function selectedBehavior(): BehaviorDefinition | undefined {
  return catalog().find((b) => b.id === store.ui.selectedBehaviorId) ?? catalog()[0];
}

/** Rename a behavior id (uniqueness-checked). Nothing references behavior ids — the
 *  sim selects behaviors at runtime — so there are no project references to repoint. */
function renameBehavior(b: BehaviorDefinition, raw: string): void {
  const next = raw.trim();
  if (!next || next === b.id) return;
  store.mutate((s) => {
    if (s.behaviors.some((x) => x !== b && x.id === next)) return; // id taken — ignore
    b.id = next;
    store.ui.selectedBehaviorId = next;
  }, 'structure');
}

/** Trait-catalog ids, the suggestion set for `traitModifiers` keys. */
function traitIds(): string[] {
  return (store.state.traits ?? []).map((t) => t.id);
}

/** Relationship-type-catalog ids, the suggestion set for `relationshipTypeAnyOf`. */
function relationshipTypeIds(): string[] {
  return (store.state.relationshipTypes ?? []).map((t) => t.id);
}

/**
 * An editor for an open string→number map (pressure pulls, trait modifiers). Each
 * existing key is a labeled slider with a remove button; a datalist-backed input
 * adds a new key. Hitting the low end (or removing) drops the key — only non-zero
 * weights are kept, matching the export shape.
 */
function weightedMapEditor(
  map: Record<string, number>,
  suggestions: readonly string[],
  range: { min: number; max: number },
): HTMLElement {
  const wrap = el('div', { className: 'weighted-map' });
  for (const key of Object.keys(map)) {
    const row = el(
      'div',
      { className: 'weighted-row' },
      slider(map[key], range.min, range.max, 1, (v) =>
        store.mutate(() => {
          if (v === 0) delete map[key];
          else map[key] = v;
        }, v === 0 ? 'structure' : 'data'),
      ),
      el('span', { className: 'weighted-value' }, `${map[key] > 0 ? '+' : ''}${map[key]}`),
      button('×', () => store.mutate(() => delete map[key], 'structure'), 'tag-remove'),
    );
    wrap.append(labeled(key, row));
  }
  const listId = uid('dl');
  const input = el('input', {
    type: 'text',
    placeholder: '+ add…',
    list: listId,
    onKeydown: (e: Event) => {
      if ((e as KeyboardEvent).key !== 'Enter') return;
      const v = (e.target as HTMLInputElement).value.trim();
      if (v && map[v] === undefined) store.mutate(() => (map[v] = 1), 'structure');
    },
  });
  const datalist = el('datalist', { id: listId }, ...suggestions.map((s) => el('option', { value: s })));
  wrap.append(el('div', { className: 'tag-add' }, input, datalist));
  return wrap;
}

/** A removable-chip + datalist add box bound to a string-list field on the behavior. */
function listEditor(values: string[], suggestions: readonly string[], set: (next: string[]) => void): HTMLElement {
  const wrap = el('div', { className: 'tag-editor' });
  const chips = el('div', { className: 'tag-chips' });
  for (const v of values) {
    chips.append(el('span', { className: 'tag-chip' }, v, button('×', () => set(values.filter((x) => x !== v)), 'tag-remove')));
  }
  const listId = uid('dl');
  const input = el('input', {
    type: 'text',
    placeholder: '+ add…',
    list: listId,
    onKeydown: (e: Event) => {
      if ((e as KeyboardEvent).key !== 'Enter') return;
      const v = (e.target as HTMLInputElement).value.trim();
      if (v && !values.includes(v)) set([...values, v]);
    },
  });
  const datalist = el('datalist', { id: listId }, ...suggestions.map((s) => el('option', { value: s })));
  wrap.append(chips, el('div', { className: 'tag-add' }, input, datalist));
  return wrap;
}

export function renderBehaviorList(container: HTMLElement): void {
  clear(container);
  const current = selectedBehavior();
  // Group the list by category so the five families read as families.
  const list = el('div', { className: 'entity-list' });
  for (const cat of BEHAVIOR_CATEGORIES) {
    const inCat = catalog().filter((b) => b.category === cat);
    if (!inCat.length) continue;
    list.append(el('div', { className: 'dry-key' }, BEHAVIOR_CATEGORY_LABELS[cat]));
    for (const b of inCat) {
      list.append(
        listItem({
          selected: b.id === current?.id,
          name: b.displayName || b.id,
          onClick: () => store.mutateUi((ui) => (ui.selectedBehaviorId = b.id)),
        }),
      );
    }
  }
  container.append(
    list,
    el(
      'div',
      { className: 'list-actions' },
      button(
        '+ New behavior',
        () => {
          const def = createDefaultBehavior(uid('behavior'));
          store.mutate((s) => {
            s.behaviors.push(def);
            store.ui.selectedBehaviorId = def.id;
          }, 'structure');
        },
        'primary',
      ),
    ),
  );
}

export function renderBehaviorControls(container: HTMLElement): void {
  clear(container);
  const b = selectedBehavior();
  if (!b) {
    container.append(el('p', { className: 'hint' }, 'No behaviors in the catalog. Create one to start.'));
    return;
  }

  container.append(
    labeled(
      'Id',
      el('input', {
        type: 'text',
        value: b.id,
        onChange: (e: Event) => renameBehavior(b, (e.target as HTMLInputElement).value),
      }),
    ),
    textField('Display name', b.displayName, (v) => store.mutate(() => (b.displayName = v), 'data')),
    labeled(
      'Category',
      select(
        BEHAVIOR_CATEGORIES.map((c) => ({ value: c, label: BEHAVIOR_CATEGORY_LABELS[c] })),
        b.category,
        (v) => store.mutate(() => (b.category = v as BehaviorCategory), 'structure'),
      ),
    ),
    textArea('Description', b.description, (v) => store.mutate(() => (b.description = v), 'data')),
    labeled(
      'Visibility',
      select(BEHAVIOR_VISIBILITY.map((v) => ({ value: v, label: v })), b.visibility, (v) =>
        store.mutate(() => (b.visibility = v as BehaviorVisibility), 'data'),
      ),
    ),
    labeled(
      'Severity',
      select(BEHAVIOR_SEVERITY.map((v) => ({ value: v, label: v })), b.severity, (v) =>
        store.mutate(() => (b.severity = v as BehaviorSeverity), 'data'),
      ),
    ),
  );

  container.append(
    el('h4', {}, 'Pressure pulls'),
    el('p', { className: 'hint' }, 'How strongly each felt pressure pulls toward this behavior. The sim weights selection by these.'),
    weightedMapEditor(b.pressureWeights, PRESSURE_SUGGESTIONS, { min: 0, max: 5 }),
  );

  container.append(
    el('h4', {}, 'Trait modifiers'),
    el('p', { className: 'hint' }, 'Signed nudges to likelihood, keyed by trait id (−3..+3).'),
    weightedMapEditor(b.traitModifiers, traitIds(), { min: -3, max: 3 }),
  );

  container.append(
    el('h4', {}, 'Required context'),
    listEditor(b.requiredContext, CONTEXT_SUGGESTIONS, (next) => store.mutate(() => (b.requiredContext = next), 'structure')),
    el('h4', {}, 'Required affordances'),
    listEditor(b.requiredAffordances, AFFORDANCE_SUGGESTIONS, (next) =>
      store.mutate(() => (b.requiredAffordances = next), 'structure'),
    ),
  );

  // --- relationship requirements ---
  const rr = b.relationshipRequirements;
  container.append(
    el('h4', {}, 'Relationship requirements'),
    labeled(
      'Requires a target',
      el('input', {
        type: 'checkbox',
        checked: rr.requiresTarget,
        onChange: (e: Event) => store.mutate(() => (rr.requiresTarget = (e.target as HTMLInputElement).checked), 'structure'),
      }),
    ),
  );
  if (rr.requiresTarget) {
    container.append(
      labeled(
        'Target must be known',
        el('input', {
          type: 'checkbox',
          checked: rr.targetKnown,
          onChange: (e: Event) => store.mutate(() => (rr.targetKnown = (e.target as HTMLInputElement).checked), 'data'),
        }),
      ),
      labeled('Only toward bond types', listEditor(rr.relationshipTypeAnyOf, relationshipTypeIds(), (next) =>
        store.mutate(() => (rr.relationshipTypeAnyOf = next), 'structure'),
      )),
    );
  }

  container.append(
    el('h4', {}, 'Expected outcomes'),
    listEditor(b.outcomes, OUTCOME_SUGGESTIONS, (next) => store.mutate(() => (b.outcomes = next), 'structure')),
  );

  container.append(
    el('h4', {}, ''),
    el(
      'div',
      { className: 'btn-row' },
      button(
        'Delete behavior',
        () => {
          if (!confirm(`Delete "${b.displayName || b.id}"?`)) return;
          store.mutate((s) => {
            s.behaviors = s.behaviors.filter((x) => x.id !== b.id);
            store.ui.selectedBehaviorId = s.behaviors[0]?.id ?? '';
          }, 'structure');
        },
        'danger',
      ),
    ),
  );
}

export function renderBehaviorPreview(container: HTMLElement): void {
  clear(container);
  const b = selectedBehavior();
  if (!b) {
    container.append(el('p', { className: 'hint' }, 'No behaviors in the catalog.'));
    return;
  }
  const pressures = Object.entries(b.pressureWeights).filter(([, v]) => v);
  const traits = Object.entries(b.traitModifiers).filter(([, v]) => v);
  const chips = (entries: Array<[string, number]>) =>
    entries.map(([k, v]) => el('span', { className: 'tag-chip' }, `${k} ${v > 0 ? '+' : ''}${v}`));
  const tags = (xs: string[]) =>
    xs.length ? xs.map((x) => el('span', { className: 'tag-chip' }, x)) : [el('span', { className: 'hint' }, '—')];
  const rr = b.relationshipRequirements;
  const relText = !rr.requiresTarget
    ? 'no target needed'
    : `target${rr.targetKnown ? ' (must be known)' : ''}${rr.relationshipTypeAnyOf.length ? ` · ${rr.relationshipTypeAnyOf.join(', ')}` : ''}`;

  container.append(
    el(
      'div',
      { className: 'persona-summary' },
      el('div', {}, el('strong', {}, b.displayName || b.id), ` · ${BEHAVIOR_CATEGORY_LABELS[b.category]}`),
      el('div', { className: 'hint' }, `${b.visibility} · ${b.severity}`),
      b.description ? el('div', {}, b.description) : null,
      el('div', { className: 'dry-key' }, 'pressure pulls'),
      el('div', { className: 'tag-chips' }, ...(pressures.length ? chips(pressures) : [el('span', { className: 'hint' }, 'none')])),
      el('div', { className: 'dry-key' }, 'trait modifiers'),
      el('div', { className: 'tag-chips' }, ...(traits.length ? chips(traits) : [el('span', { className: 'hint' }, 'none')])),
      el('div', { className: 'dry-key' }, 'required context'),
      el('div', { className: 'tag-chips' }, ...tags(b.requiredContext)),
      el('div', { className: 'dry-key' }, 'required affordances'),
      el('div', { className: 'tag-chips' }, ...tags(b.requiredAffordances)),
      el('div', { className: 'dry-key' }, 'relationship'),
      el('div', { className: 'hint' }, relText),
      el('div', { className: 'dry-key' }, 'expected outcomes'),
      el('div', { className: 'tag-chips' }, ...tags(b.outcomes)),
    ),
  );
}
