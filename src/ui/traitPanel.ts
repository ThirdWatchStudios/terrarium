/**
 * The reusable trait catalog editor (Cast → Traits). Traits are project-level,
 * structured personality tags personas reference by id (personality.traitTags).
 * Each trait carries signed −2..+2 nudges to the sim's reaction propensities.
 * Editing a trait id cascades to every persona reference so links never break.
 */
import { store } from '../state';
import { button, clear, el, labeled, select } from './dom';
import { listItem, textArea, textField } from './controls';
import { REACTION_CATEGORIES, TRAIT_CATEGORIES, type TraitCategory, type TraitDefinition } from '../core/profile';

const BIAS_OPTIONS = [
  { value: '-2', label: '−− strong down' },
  { value: '-1', label: '− down' },
  { value: '0', label: '· none' },
  { value: '1', label: '+ up' },
  { value: '2', label: '++ strong up' },
];

const reactionLabel = (r: string): string => r.charAt(0).toUpperCase() + r.slice(1);

function catalog(): TraitDefinition[] {
  return store.state.traits;
}

function selectedTrait(): TraitDefinition | undefined {
  return catalog().find((t) => t.id === store.ui.selectedTraitId) ?? catalog()[0];
}

/** Which personas carry a trait, for the usage panel. */
function usageOf(id: string): string[] {
  const who: string[] = [];
  for (const p of store.state.profiles ?? []) {
    if (p.personality.traitTags.includes(id)) who.push(p.identity.displayName || p.agentId);
  }
  return who;
}

/** Rename a trait and repoint every persona that carries it. */
function renameTrait(t: TraitDefinition, raw: string): void {
  const next = raw.trim();
  if (!next || next === t.id) return;
  store.mutate((s) => {
    if (s.traits.some((x) => x !== t && x.id === next)) return; // id taken — ignore
    const old = t.id;
    t.id = next;
    for (const p of s.profiles ?? []) {
      p.personality.traitTags = p.personality.traitTags.map((tag) => (tag === old ? next : tag));
    }
    store.ui.selectedTraitId = next;
  }, 'structure');
}

export function renderTraitList(container: HTMLElement): void {
  clear(container);
  const current = selectedTrait();
  const list = el('div', { className: 'entity-list' });
  for (const t of catalog()) {
    list.append(
      listItem({
        selected: t.id === current?.id,
        name: t.label || t.id,
        onClick: () => store.mutateUi((ui) => (ui.selectedTraitId = t.id)),
      }),
    );
  }
  container.append(
    list,
    el(
      'div',
      { className: 'list-actions' },
      button(
        '+ New trait',
        () => {
          const def: TraitDefinition = { id: `trait-${Math.random().toString(36).slice(2, 8)}`, label: 'New trait', description: '', category: 'social', biasesReactions: {} };
          store.mutate((s) => {
            s.traits.push(def);
            store.ui.selectedTraitId = def.id;
          }, 'structure');
        },
        'primary',
      ),
    ),
  );
}

export function renderTraitControls(container: HTMLElement): void {
  clear(container);
  const t = selectedTrait();
  if (!t) {
    container.append(el('p', { className: 'hint' }, 'No traits in the catalog. Create one to start.'));
    return;
  }

  container.append(
    labeled(
      'Id',
      el('input', {
        type: 'text',
        value: t.id,
        onChange: (e: Event) => renameTrait(t, (e.target as HTMLInputElement).value),
      }),
    ),
    textField('Label', t.label, (v) => store.mutate(() => (t.label = v), 'data')),
    labeled(
      'Category',
      select(TRAIT_CATEGORIES.map((c) => ({ value: c, label: c })), t.category, (v) =>
        store.mutate(() => (t.category = v as TraitCategory), 'data'),
      ),
    ),
    textArea('Description', t.description, (v) => store.mutate(() => (t.description = v), 'data')),
    el('h4', {}, 'Reaction biases'),
  );

  for (const r of REACTION_CATEGORIES) {
    const cur = t.biasesReactions[r] ?? 0;
    container.append(
      labeled(
        reactionLabel(r),
        select(BIAS_OPTIONS, String(cur), (v) =>
          store.mutate(() => {
            const n = Number(v);
            if (n === 0) delete t.biasesReactions[r];
            else t.biasesReactions[r] = n;
          }, 'data'),
        ),
      ),
    );
  }

  container.append(
    el(
      'div',
      { className: 'btn-row' },
      button(
        'Delete trait',
        () => {
          const used = usageOf(t.id);
          const msg = used.length
            ? `"${t.label || t.id}" is on ${used.length} persona(s): ${used.join(', ')}. Delete anyway?`
            : `Delete "${t.label || t.id}"?`;
          if (!confirm(msg)) return;
          store.mutate((s) => {
            s.traits = s.traits.filter((x) => x.id !== t.id);
            store.ui.selectedTraitId = s.traits[0]?.id ?? '';
          }, 'structure');
        },
        'danger',
      ),
    ),
  );
}

export function renderTraitPreview(container: HTMLElement): void {
  clear(container);
  const t = selectedTrait();
  if (!t) {
    container.append(el('p', { className: 'hint' }, 'No traits in the catalog.'));
    return;
  }
  const biases = Object.entries(t.biasesReactions).filter(([, v]) => v);
  const used = usageOf(t.id);
  container.append(
    el(
      'div',
      { className: 'persona-summary' },
      el('div', {}, el('strong', {}, t.label || t.id), ` · ${t.category}`),
      t.description ? el('div', {}, t.description) : null,
      el(
        'div',
        { className: 'tag-chips' },
        ...(biases.length
          ? biases.map(([r, v]) => el('span', { className: 'tag-chip' }, `${reactionLabel(r)} ${v > 0 ? '+' : ''}${v}`))
          : [el('span', { className: 'hint' }, 'No reaction bias')]),
      ),
    ),
    el('h3', {}, 'Worn by'),
    el('p', { className: 'hint' }, used.length ? used.join(', ') : '—'),
  );
}
