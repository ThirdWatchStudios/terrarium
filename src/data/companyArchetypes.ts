/**
 * Company archetypes — the starter set of new-game presets (F0.2). Each is an
 * internally-coherent bundle of culture ranges + identity pools + economy + likely
 * history, expressed as ranges over the {@link Company} model and sampled per seed
 * by {@link generateCompany} (so two Declining Incumbents differ). The company-scale
 * analog of the 13 persona archetypes in personaArchetypes.ts.
 *
 * Culture ranges name only the *characteristic* axes; unnamed axes sample neutral
 * (40–60). 100 is the charged pole on every axis (see CULTURE_AXIS_POLES).
 */
import type { CompanyArchetype } from '../core/companyTemplate';

export const DECLINING_INCUMBENT: CompanyArchetype = {
  id: 'declining_incumbent',
  label: 'Declining Incumbent',
  description: 'A once-dominant enterprise managing decline — defensive, political, and fearful.',
  archetypeTags: ['legacy', 'defensive'],
  identity: {
    industries: ['Manufacturing', 'Finance', 'Media', 'Energy'],
    ownership: ['public', 'pe-owned'],
    sizeBands: ['large', 'enterprise'],
    headcount: [1200, 6000],
    foundedYear: [1965, 1995],
    reputation: [35, 55],
  },
  culture: {
    hierarchy: [70, 90],
    secrecy: [60, 80],
    volatility: [55, 75],
    cutthroat: [55, 75],
    mercenary: [50, 70],
    pace: [40, 60],
    fear: [65, 85],
  },
  economy: {
    financialHealth: [28, 48],
    morale: [25, 45],
    trajectoryWeights: { declining: 4, 'in-crisis': 1, flat: 1 },
    runwayMonths: [9, 24],
  },
  mission: {
    statedMissions: [
      'Leading our industry into the next century.',
      'Trusted quality, built to last.',
    ],
    actualPriorities: [
      'Protect the quarterly number and the legacy product line.',
      'Avoid blame and survive the next reorg.',
    ],
    hypocrisyGap: [55, 80],
  },
  narrative: {
    officialStories: ['A storied market leader executing a disciplined turnaround.'],
    realStories: ['A risk-averse incumbent managing decline, where the safe move always wins.'],
    openSecretsPool: [
      'The turnaround plan is the third one in four years.',
      'Revenue leans on one shrinking legacy contract.',
      'The new CEO is interviewing elsewhere.',
      'The best engineers already left.',
      'Two divisions are quietly on the block.',
    ],
    openSecretCount: [2, 4],
  },
  socialClimate: {
    orgTrust: [22, 42],
    rivalryPool: [
      { a: 'Engineering', b: 'Sales', note: 'Roadmap promises Sales makes and Engineering cannot keep.' },
      { a: 'Finance', b: 'Operations', note: 'Budget freezes vs. keeping the lights on.' },
      { a: 'The old guard', b: 'The new hires', note: 'Who gets blamed when targets slip.' },
    ],
    rivalryCount: [2, 3],
    powerCenterPool: ['Finance', 'The legacy-product GM', 'The board'],
    powerCenterCount: [1, 2],
  },
  history: {
    library: [
      { id: 'layoff_round', title: 'The Layoff Round', description: 'A surprise reduction in force hit the hardest-working teams.', kind: 'layoff', when: 'recent', magnitude: [70, 90], visibility: 'public', involvedDepartments: ['Engineering', 'Customer Support'] },
      { id: 'founder_exit', title: "The Founder's Quiet Exit", description: 'The founding CEO stepped down amid a board dispute over strategy.', kind: 'founder_exit', when: 'two_years_ago', magnitude: [55, 75], visibility: 'open_secret', involvedDepartments: ['Executive'] },
      { id: 'product_shelved', title: 'The Shelved Bet', description: 'A promising next-gen platform was quietly defunded and nobody talks about it.', kind: 'failed_product', when: 'last_year', magnitude: [45, 65], visibility: 'buried', involvedDepartments: ['Engineering'] },
      { id: 'reorg', title: 'The Annual Reorg', description: 'Boxes moved, reporting lines changed, nothing improved.', kind: 'reorg', when: 'recent', magnitude: [40, 60], visibility: 'public', involvedDepartments: [] },
    ],
    kindWeights: { layoff: 4, founder_exit: 3, failed_product: 3, reorg: 3 },
    count: [2, 3],
  },
};

export const HYPERGROWTH_STARTUP: CompanyArchetype = {
  id: 'hypergrowth_startup',
  label: 'Hypergrowth Startup',
  description: 'A scrappy, fast-scaling startup — flat, mission-loud, chaotic, and burning hot.',
  archetypeTags: ['startup', 'growth'],
  identity: {
    industries: ['Software', 'Media', 'Healthcare'],
    ownership: ['vc-backed', 'bootstrapped'],
    sizeBands: ['startup', 'small', 'midmarket'],
    headcount: [25, 320],
    foundedYear: [2017, 2023],
    reputation: [55, 80],
  },
  culture: {
    hierarchy: [10, 30],
    secrecy: [20, 45],
    volatility: [60, 85],
    cutthroat: [30, 55],
    mercenary: [15, 35],
    pace: [75, 95],
    fear: [25, 50],
  },
  economy: {
    financialHealth: [45, 75],
    morale: [60, 85],
    trajectoryWeights: { growing: 5, flat: 1, 'in-crisis': 1 },
    runwayMonths: [6, 18],
  },
  mission: {
    statedMissions: [
      'Reinventing how the world works, one ship at a time.',
      'Democratizing access for everyone, everywhere.',
    ],
    actualPriorities: [
      'Hit the metrics that unlock the next funding round.',
      'Grow now, fix the foundations later.',
    ],
    hypocrisyGap: [25, 50],
  },
  narrative: {
    officialStories: ['A rocketship redefining its category.'],
    realStories: ['A talented, exhausted team outrunning its own technical debt and runway.'],
    openSecretsPool: [
      'The next round is not closed yet.',
      'Half of engineering is quietly burning out.',
      'The flagship metric is generously defined.',
      'Two founders are no longer speaking.',
      'A bigger competitor just copied the roadmap.',
    ],
    openSecretCount: [1, 3],
  },
  socialClimate: {
    orgTrust: [55, 78],
    rivalryPool: [
      { a: 'Product', b: 'Engineering', note: 'Ship faster vs. stop accruing debt.' },
      { a: 'Growth', b: 'Finance', note: 'Spend to grow vs. extend the runway.' },
      { a: 'Early employees', b: 'New execs', note: 'Founding culture vs. "adult supervision."' },
    ],
    rivalryCount: [1, 2],
    powerCenterPool: ['The founders', 'The lead investor', 'The head of Growth'],
    powerCenterCount: [1, 2],
  },
  history: {
    library: [
      { id: 'big_round', title: 'The Big Round', description: 'A headline funding round doubled the team in a quarter.', kind: 'funding_round', when: 'last_year', magnitude: [55, 75], visibility: 'public', involvedDepartments: [] },
      { id: 'pivot', title: 'The Pivot', description: 'The whole company changed direction after the first product stalled.', kind: 'pivot', when: 'two_years_ago', magnitude: [60, 80], visibility: 'open_secret', involvedDepartments: ['Product', 'Engineering'] },
      { id: 'exec_hire', title: 'The First Real Exec', description: 'A seasoned outside leader arrived and the founding team felt it.', kind: 'new_ceo', when: 'recent', magnitude: [40, 60], visibility: 'open_secret', involvedDepartments: ['Executive'] },
      { id: 'launch', title: 'The Launch That Worked', description: 'A breakout launch put the company on the map overnight.', kind: 'record_quarter', when: 'last_year', magnitude: [50, 70], visibility: 'public', involvedDepartments: ['Sales', 'Marketing'] },
    ],
    kindWeights: { funding_round: 4, pivot: 3, new_ceo: 2, record_quarter: 3 },
    count: [2, 3],
  },
};

export const FAMILY_BUSINESS: CompanyArchetype = {
  id: 'family_business',
  label: 'Family Business',
  description: 'A multi-generation family-owned firm — loyal, paternalistic, slow, and personal.',
  archetypeTags: ['family', 'traditional'],
  identity: {
    industries: ['Manufacturing', 'Retail', 'Logistics', 'Consulting'],
    ownership: ['family'],
    sizeBands: ['small', 'midmarket'],
    headcount: [40, 400],
    foundedYear: [1955, 1990],
    reputation: [55, 75],
  },
  culture: {
    hierarchy: [60, 80],
    secrecy: [45, 65],
    volatility: [25, 45],
    cutthroat: [20, 40],
    mercenary: [25, 45],
    pace: [30, 50],
    fear: [30, 50],
  },
  economy: {
    financialHealth: [50, 70],
    morale: [55, 75],
    trajectoryWeights: { flat: 4, growing: 2, declining: 2 },
  },
  mission: {
    statedMissions: ['Treating our people like family since day one.', 'Honest work, lasting relationships.'],
    actualPriorities: ['Keep the family in control and the peace at the table.', 'Protect the legacy, avoid hard changes.'],
    hypocrisyGap: [35, 60],
  },
  narrative: {
    officialStories: ['A trusted family name built on loyalty and craft.'],
    realStories: ['A comfortable firm where bloodline beats merit and succession is the unspoken question.'],
    openSecretsPool: [
      "The founder's kids do not get along.",
      'The most capable manager will never be made a partner.',
      'Succession has no real plan.',
      'A long-tenured employee is quietly coasting.',
    ],
    openSecretCount: [1, 3],
  },
  socialClimate: {
    orgTrust: [50, 70],
    rivalryPool: [
      { a: 'The family', b: 'The professionals', note: 'Bloodline vs. merit in who gets promoted.' },
      { a: 'The old plant', b: 'The new office', note: 'How things have always been done vs. modernizing.' },
    ],
    rivalryCount: [1, 2],
    powerCenterPool: ['The founder', 'The eldest child', 'The long-tenured COO'],
    powerCenterCount: [1, 2],
  },
  history: {
    library: [
      { id: 'succession', title: 'The Succession Question', description: 'The founder handed day-to-day control to a child, and not everyone agreed.', kind: 'new_ceo', when: 'two_years_ago', magnitude: [45, 70], visibility: 'open_secret', involvedDepartments: ['Executive'] },
      { id: 'near_sale', title: 'The Offer They Refused', description: 'A buyer came calling; the family chose pride over the payout.', kind: 'merger', when: 'last_year', magnitude: [40, 60], visibility: 'buried', involvedDepartments: [] },
      { id: 'expansion', title: 'The Second Location', description: 'A slow, careful expansion stretched the firm thin.', kind: 'reorg', when: 'recent', magnitude: [30, 50], visibility: 'public', involvedDepartments: ['Operations'] },
    ],
    kindWeights: { new_ceo: 3, merger: 2, reorg: 2 },
    count: [1, 2],
  },
};

export const PE_ROLLUP: CompanyArchetype = {
  id: 'pe_rollup',
  label: 'PE Cost-Cutting Rollup',
  description: 'A private-equity rollup squeezing margin — mercenary, secretive, metric-driven, fearful.',
  archetypeTags: ['pe', 'efficiency'],
  identity: {
    industries: ['Healthcare', 'Logistics', 'Consulting', 'Retail'],
    ownership: ['pe-owned'],
    sizeBands: ['midmarket', 'large'],
    headcount: [300, 2500],
    foundedYear: [1990, 2015],
    reputation: [30, 50],
  },
  culture: {
    hierarchy: [65, 85],
    secrecy: [65, 85],
    volatility: [55, 75],
    cutthroat: [65, 85],
    mercenary: [75, 95],
    pace: [60, 80],
    fear: [60, 80],
  },
  economy: {
    financialHealth: [45, 65],
    morale: [25, 45],
    trajectoryWeights: { flat: 3, growing: 2, declining: 2 },
    runwayMonths: [12, 30],
  },
  mission: {
    statedMissions: ['Operational excellence at scale.', 'Unlocking value for our stakeholders.'],
    actualPriorities: ['Hit the margin target before the exit.', 'Cut cost, consolidate, flip in five years.'],
    hypocrisyGap: [60, 85],
  },
  narrative: {
    officialStories: ['A disciplined platform building a category leader through acquisition.'],
    realStories: ['A cost-cutting machine optimizing for a five-year exit, not the next decade.'],
    openSecretsPool: [
      'The acquired teams are next to be "rationalized."',
      'Everyone is managing to the metric, not the mission.',
      'The exit timeline is the only real deadline.',
      'Two recent acquisitions still have not been integrated.',
      'Headcount targets come down from people no one has met.',
    ],
    openSecretCount: [2, 4],
  },
  socialClimate: {
    orgTrust: [20, 40],
    rivalryPool: [
      { a: 'Acquired Co A', b: 'Acquired Co B', note: 'Whose systems and people survive the merge.' },
      { a: 'The PE operating partners', b: 'The legacy management', note: 'The model vs. how the business actually works.' },
      { a: 'Finance', b: 'Operations', note: 'Margin targets vs. service quality.' },
    ],
    rivalryCount: [2, 3],
    powerCenterPool: ['The PE operating partners', 'The CFO', 'The integration office'],
    powerCenterCount: [1, 2],
  },
  history: {
    library: [
      { id: 'acquisition', title: 'The Bolt-On Acquisition', description: 'Another competitor was absorbed; two cultures were told to become one overnight.', kind: 'acquisition', when: 'recent', magnitude: [55, 75], visibility: 'public', involvedDepartments: [] },
      { id: 'cost_cut', title: 'The Synergy Layoff', description: '"Duplicate" roles were eliminated after the deal closed.', kind: 'layoff', when: 'recent', magnitude: [60, 85], visibility: 'public', involvedDepartments: ['HR', 'Operations'] },
      { id: 'new_ceo', title: 'The Installed CEO', description: 'The sponsors parachuted in a turnaround executive with a mandate.', kind: 'new_ceo', when: 'two_years_ago', magnitude: [45, 65], visibility: 'open_secret', involvedDepartments: ['Executive'] },
      { id: 'scandal', title: 'The Quiet Settlement', description: 'A compliance problem from a target company was settled and sealed.', kind: 'scandal', when: 'last_year', magnitude: [40, 60], visibility: 'buried', involvedDepartments: ['Legal'] },
    ],
    kindWeights: { acquisition: 4, layoff: 4, new_ceo: 2, scandal: 2 },
    count: [2, 4],
  },
};

export const MISSION_NONPROFIT: CompanyArchetype = {
  id: 'mission_nonprofit',
  label: 'Mission-Driven Nonprofit',
  description: 'An idealistic, under-resourced nonprofit — flat, earnest, collaborative, and stretched thin.',
  archetypeTags: ['nonprofit', 'mission'],
  identity: {
    industries: ['Nonprofit', 'Healthcare', 'Government'],
    ownership: ['nonprofit'],
    sizeBands: ['small', 'midmarket'],
    headcount: [20, 250],
    foundedYear: [1995, 2015],
    reputation: [60, 85],
  },
  culture: {
    hierarchy: [25, 45],
    secrecy: [25, 45],
    volatility: [40, 60],
    cutthroat: [15, 35],
    mercenary: [5, 25],
    pace: [55, 75],
    fear: [30, 50],
  },
  economy: {
    financialHealth: [25, 50],
    morale: [55, 80],
    trajectoryWeights: { flat: 3, declining: 2, growing: 2, 'in-crisis': 1 },
    runwayMonths: [4, 14],
  },
  mission: {
    statedMissions: ['Real change for the communities we serve.', 'A more just world, one program at a time.'],
    actualPriorities: ['Keep the grant funders happy and the lights on.', 'Do the mission with half the budget it needs.'],
    hypocrisyGap: [20, 45],
  },
  narrative: {
    officialStories: ['A trusted advocate delivering measurable impact.'],
    realStories: ['A devoted, overstretched team papering over chronic underfunding with goodwill.'],
    openSecretsPool: [
      'A major grant is not getting renewed.',
      'The best program lead is leaving for a salary that pays rent.',
      'The board and the ED disagree about scope.',
      'Two programs are kept alive mostly for the optics.',
    ],
    openSecretCount: [1, 3],
  },
  socialClimate: {
    orgTrust: [55, 78],
    rivalryPool: [
      { a: 'Programs', b: 'Development', note: 'Serve the mission vs. chase the funding.' },
      { a: 'The founders', b: 'The professionalizers', note: 'Scrappy passion vs. operational rigor.' },
    ],
    rivalryCount: [1, 2],
    powerCenterPool: ['The Executive Director', 'The board chair', 'The biggest funder'],
    powerCenterCount: [1, 2],
  },
  history: {
    library: [
      { id: 'grant_lost', title: 'The Grant That Lapsed', description: 'A cornerstone grant was not renewed and a program scrambled to survive.', kind: 'failed_product', when: 'recent', magnitude: [50, 70], visibility: 'open_secret', involvedDepartments: ['Operations'] },
      { id: 'ed_change', title: 'The New Executive Director', description: 'A new ED arrived promising professionalization, unsettling the founding team.', kind: 'new_ceo', when: 'two_years_ago', magnitude: [40, 60], visibility: 'public', involvedDepartments: ['Executive'] },
      { id: 'expansion', title: 'The Overreach', description: 'The org took on more programs than its budget could carry.', kind: 'reorg', when: 'last_year', magnitude: [35, 55], visibility: 'open_secret', involvedDepartments: [] },
    ],
    kindWeights: { failed_product: 3, new_ceo: 2, reorg: 2 },
    count: [1, 2],
  },
};

/** The starter library — the new-game presets shown in the Company tab picker. */
export const COMPANY_ARCHETYPES: CompanyArchetype[] = [
  DECLINING_INCUMBENT,
  HYPERGROWTH_STARTUP,
  FAMILY_BUSINESS,
  PE_ROLLUP,
  MISSION_NONPROFIT,
];
