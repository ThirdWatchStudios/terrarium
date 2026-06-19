/**
 * The Company tab (Epic 0 / F0.9, Pass 1) — drive and inspect the cascade root.
 * Pick an archetype + seed + a couple of dials, Generate, and read the resulting
 * company back: identity, the culture spine, the derived climate, economy,
 * mission-vs-reality, history, narrative/open-secrets, and social climate.
 *
 * Pass 1 scope is the company *alone* (read-only inspector); the full cascade
 * (departments → people → relationships → scenarios) and per-field overrides are
 * Pass 2. The generated company lives in transient UI state — like the Employee
 * generator — so this tab needs no project-schema change yet.
 */
import {
  CULTURE_AXES,
  CULTURE_AXIS_POLES,
  SIZE_BANDS,
  serializeCompany,
  type Company,
  type CultureAxis,
} from '../core/company';
import { generateCompany, type CompanyDials } from '../core/companyTemplate';
import { COMPANY_ARCHETYPES } from '../data/companyArchetypes';
import { randomSeed } from '../core/employee';
import { downloadJson } from '../core/exporter';
import { store } from '../state';
import { button, clear, el, labeled, select, slider } from './dom';

// --- generation glue --------------------------------------------------------

function currentArchetype() {
  return COMPANY_ARCHETYPES.find((a) => a.id === store.ui.companyArchetypeId) ?? COMPANY_ARCHETYPES[0];
}

function dials(): CompanyDials {
  const d: CompanyDials = {};
  if (store.ui.companyDialSize) d.sizeBand = store.ui.companyDialSize;
  if (store.ui.companyDialHealth) d.financialHealthAdj = store.ui.companyDialHealth;
  return d;
}

/** Lazily generate (and cache) the company for the current archetype + seed + dials. */
function currentCompany(): Company {
  if (!store.ui.company) {
    const seed = store.ui.companySeed || randomSeed();
    store.ui.companySeed = seed;
    store.ui.company = generateCompany(currentArchetype(), seed, { dials: dials() });
  }
  return store.ui.company;
}

function regenerate(seed: string): void {
  store.mutateUi((ui) => {
    ui.companySeed = seed;
    ui.company = generateCompany(currentArchetype(), seed, { dials: dials() });
  });
}

// --- inspector building blocks ----------------------------------------------

/** A labeled 0–100 meter (the high-pole name on the right for culture axes). */
function bar(label: string, value: number, opts: { hi?: string; tone?: 'culture' | 'climate' } = {}): HTMLElement {
  const fill = el('span', { className: 'company-bar-fill' });
  fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
  return el(
    'div',
    { className: `company-bar-row ${opts.tone ?? ''}`.trim() },
    el('span', { className: 'company-bar-label' }, label),
    el('span', { className: 'company-bar-track' }, fill),
    el('span', { className: 'company-bar-value' }, opts.hi ? `${value} · ${opts.hi}` : String(value)),
  );
}

function kv(key: string, value: string): HTMLElement {
  return el('div', { className: 'company-kv' }, el('span', { className: 'company-kv-key' }, key), el('span', { className: 'company-kv-val' }, value));
}

function block(title: string, ...children: (Node | null)[]): HTMLElement {
  return el('div', { className: 'company-block' }, el('h4', {}, title), ...children.filter((c): c is Node => c != null));
}

// --- the three render slots --------------------------------------------------

/** Sidebar: the archetype presets (the new-game presets) as a pick list. */
export function renderCompanyList(container: HTMLElement): void {
  clear(container);
  const active = currentArchetype();
  const list = el('div', { className: 'entity-list' });
  list.append(el('div', { className: 'list-heading' }, 'Archetypes'));
  for (const a of COMPANY_ARCHETYPES) {
    list.append(
      el(
        'button',
        {
          className: `entity-item ${a.id === active.id ? 'selected' : ''}`,
          onClick: () =>
            store.mutateUi((ui) => {
              ui.companyArchetypeId = a.id;
              ui.company = generateCompany(a, ui.companySeed || randomSeed(), { dials: dials() });
              ui.companySeed = ui.companySeed || store.ui.companySeed;
            }),
        },
        el('span', { className: 'entity-name' }, a.label),
        el('span', { className: 'entity-sub' }, a.description),
      ),
    );
  }
  container.append(list);
}

/** Preview: the read-only cascade-root inspector. */
export function renderCompanyPreview(container: HTMLElement): void {
  clear(container);
  const c = currentCompany();
  const id = c.identity;

  const cultureBars = CULTURE_AXES.map((axis: CultureAxis) =>
    bar(CULTURE_AXIS_POLES[axis][0], c.culture[axis], { hi: CULTURE_AXIS_POLES[axis][1], tone: 'culture' }),
  );

  const climateBars = [
    bar('Factionalism', c.climate.factionalism.value, { tone: 'climate' }),
    bar('Fear', c.climate.fear.value, { tone: 'climate' }),
    bar('Volatility', c.climate.volatility.value, { tone: 'climate' }),
  ];

  const historyRows = c.history.length
    ? c.history.map((e) =>
        el(
          'div',
          { className: 'company-event' },
          el('div', { className: 'company-event-head' },
            el('span', { className: 'company-event-title' }, e.title),
            el('span', { className: `company-tag vis-${e.visibility}` }, e.visibility.replace('_', ' ')),
            el('span', { className: 'company-event-mag' }, `${e.kind} · ${e.magnitude}`),
          ),
          el('p', { className: 'company-event-desc' }, e.description),
          e.involvedDepartments.length ? el('p', { className: 'company-event-depts' }, `touches: ${e.involvedDepartments.join(', ')}`) : null,
        ),
      )
    : [el('p', { className: 'hint' }, 'No history events for this seed.')];

  const secretRows = c.narrative.openSecrets.map((s) => el('li', {}, s));
  const rivalryRows = c.socialClimate.rivalries.map((r) =>
    el('li', {}, `${r.a} ⚔ ${r.b}${r.note ? ` — ${r.note}` : ''}`),
  );

  container.append(
    el('div', { className: 'company-inspector' },
      el('div', { className: 'company-identity' },
        el('h3', {}, id.name),
        el('p', { className: 'preview-caption' },
          `${id.industry} · ${id.sizeBand} · ${id.ownership} · founded ${id.foundedYear} · ~${id.headcount.toLocaleString()} staff · seed ${c.companyId.replace(/^company_/, '') || store.ui.companySeed}`),
      ),

      block('Culture spine', ...cultureBars),
      block('Climate (derived)', ...climateBars),

      block('Economy',
        kv('Financial health', String(c.economy.financialHealth)),
        kv('Trajectory', c.economy.trajectory),
        kv('Morale', String(c.economy.morale)),
        kv('Runway', c.economy.runwayMonths == null ? '—' : `${c.economy.runwayMonths} mo`),
        kv('Reputation', String(id.reputation)),
      ),

      block('Mission vs. reality',
        kv('Stated', c.mission.statedMission),
        kv('Actually', c.mission.actualPriority),
        kv('Hypocrisy gap', String(c.mission.hypocrisyGap)),
      ),

      block('History', ...historyRows),

      block('Narrative',
        kv('Official story', c.narrative.officialStory),
        kv('Real story', c.narrative.realStory),
        secretRows.length ? el('div', {}, el('span', { className: 'company-kv-key' }, 'Open secrets'), el('ul', { className: 'company-list' }, ...secretRows)) : null,
      ),

      block('Social climate',
        kv('Org trust', String(c.socialClimate.orgTrust)),
        kv('Power centers', c.socialClimate.powerCenters.join(', ') || '—'),
        rivalryRows.length ? el('div', {}, el('span', { className: 'company-kv-key' }, 'Rivalries'), el('ul', { className: 'company-list' }, ...rivalryRows)) : null,
      ),
    ),
  );
}

/** Controls: archetype/seed/dials + Generate + export. */
export function renderCompanyControls(container: HTMLElement): void {
  clear(container);
  const c = currentCompany();

  container.append(
    el('h3', {}, 'Generate'),
    labeled(
      'Archetype',
      select(
        COMPANY_ARCHETYPES.map((a) => ({ value: a.id, label: a.label })),
        currentArchetype().id,
        (value) => store.mutateUi((ui) => { ui.companyArchetypeId = value; ui.company = generateCompany(currentArchetype(), ui.companySeed || randomSeed(), { dials: dials() }); }),
      ),
    ),
  );

  const seedInput = el('input', {
    type: 'text',
    value: store.ui.companySeed,
    placeholder: 'A9F7C2',
    onInput: (e: Event) => { store.ui.companySeed = (e.target as HTMLInputElement).value.trim().toUpperCase(); },
  });
  container.append(
    labeled('Seed', seedInput),
    el(
      'div',
      { className: 'btn-row' },
      button('Generate from seed', () => regenerate(store.ui.companySeed || randomSeed()), 'primary'),
      button('Randomize seed', () => regenerate(randomSeed())),
      button('Copy seed', () => navigator.clipboard?.writeText(store.ui.companySeed)),
    ),
  );

  // Dials — steer without authoring a new archetype.
  container.append(
    el('h3', {}, 'Dials'),
    labeled(
      'Size band',
      select(
        [{ value: '', label: 'From archetype' }, ...SIZE_BANDS.map((s) => ({ value: s, label: s }))],
        store.ui.companyDialSize,
        (value) => store.mutateUi((ui) => { ui.companyDialSize = value; ui.company = generateCompany(currentArchetype(), ui.companySeed || randomSeed(), { dials: dials() }); }),
      ),
    ),
    labeled(
      'Financial health nudge',
      slider(store.ui.companyDialHealth, -40, 40, 1, (v) =>
        store.mutateUi((ui) => { ui.companyDialHealth = v; ui.company = generateCompany(currentArchetype(), ui.companySeed || randomSeed(), { dials: dials() }); }),
      ),
    ),
  );

  // Export — the F0.8 company.json root (the cascade children come in Pass 2).
  container.append(
    el('h3', {}, 'Export'),
    el(
      'div',
      { className: 'btn-row' },
      button('Export company.json', () => downloadJson(`company-${store.ui.companySeed || c.companyId}.json`, serializeCompany(c)), 'primary'),
    ),
    el('p', { className: 'hint' }, 'Pass 1: the company root. The cascade (departments, people, relationships, scenarios) and the full company package land in Pass 2.'),
  );
}
