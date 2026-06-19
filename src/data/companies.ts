/**
 * Hand-authored reference companies (F0.1, story S0.1.3). The golden examples
 * that exercise every field of the {@link Company} model and serve as fixtures
 * for the round-trip / derived-aggregate tests. Authored by hand — the *generated*
 * companies come from the archetype library (src/data/companyArchetypes.ts).
 *
 * MERIDIAN_DYNAMICS is a declining incumbent: a once-dominant enterprise sliding
 * into a defensive, political, fearful culture after a layoff round and a founder's
 * exit — chosen because a tense, history-charged org lights up every section.
 */
import { applyCompanyDerived, type Company } from '../core/company';

/** A declining incumbent — every section populated with coherent values. */
export const MERIDIAN_DYNAMICS: Company = applyCompanyDerived({
  companyId: 'meridian_dynamics',
  identity: {
    name: 'Meridian Dynamics',
    industry: 'Manufacturing',
    foundedYear: 1986,
    sizeBand: 'enterprise',
    headcount: 2400,
    ownership: 'public',
    reputation: 42,
  },
  culture: {
    hierarchy: 82,
    secrecy: 70,
    volatility: 65,
    cutthroat: 68,
    mercenary: 60,
    pace: 55,
    fear: 74,
  },
  economy: {
    financialHealth: 38,
    trajectory: 'declining',
    morale: 34,
    runwayMonths: 18,
  },
  mission: {
    statedMission: 'Engineering the future of industrial automation.',
    actualPriority: 'Protect the quarterly number and the legacy product line.',
    hypocrisyGap: 72,
  },
  history: [
    {
      id: 'layoff_2024',
      title: 'The 12% Layoff',
      description: 'A surprise reduction in force hit Engineering and Support hardest the week before the holidays.',
      kind: 'layoff',
      when: 'recent',
      magnitude: 85,
      visibility: 'public',
      involvedDepartments: ['Engineering', 'Customer Support'],
    },
    {
      id: 'founder_exit',
      title: "The Founder's Quiet Exit",
      description: 'The founding CEO stepped down "to spend time with family" amid a board dispute over strategy.',
      kind: 'founder_exit',
      when: 'two_years_ago',
      magnitude: 70,
      visibility: 'open_secret',
      involvedDepartments: ['Executive'],
    },
    {
      id: 'skunkworks_killed',
      title: 'Project Helios, Shelved',
      description: 'A promising next-gen platform was quietly defunded; the team was reabsorbed and nobody talks about it.',
      kind: 'failed_product',
      when: 'last_year',
      magnitude: 55,
      visibility: 'buried',
      involvedDepartments: ['Engineering'],
    },
  ],
  narrative: {
    officialStory: 'A storied market leader executing a disciplined turnaround.',
    realStory: 'A risk-averse incumbent managing decline, where the safe move always wins.',
    openSecrets: [
      'The turnaround plan is the third one in four years.',
      'Sales numbers are propped up by one shrinking legacy contract.',
      'The new CEO is interviewing elsewhere.',
    ],
  },
  socialClimate: {
    orgTrust: 31,
    rivalries: [
      { a: 'Engineering', b: 'Sales', note: 'Roadmap promises Sales makes and Engineering cannot keep.' },
      { a: 'Finance', b: 'Operations', note: 'Budget freezes vs. keeping the plants running.' },
    ],
    powerCenters: ['Finance', 'The legacy-product GM'],
  },
  // Derived climate is computed by applyCompanyDerived; no authored override here
  // (MERIDIAN exercises the pure-derivation path). The default flags are `false`.
  climate: {
    factionalism: { value: 0, authored: false },
    fear: { value: 0, authored: false },
    volatility: { value: 0, authored: false },
  },
});

export const REFERENCE_COMPANIES: Company[] = [MERIDIAN_DYNAMICS];
