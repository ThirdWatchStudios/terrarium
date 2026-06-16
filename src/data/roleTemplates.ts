/**
 * Role-slotted scenario templates — cast-agnostic scenarios authored against role
 * slots, NOT names (see src/core/scenarioTemplate.ts and the design note in
 * docs/scenario-template-model.md). These are the full-game shape: the engine casts
 * a template onto whoever in the current cast best fits the roles' preconditions.
 *
 * "The Office Romance" is the reference template — two agents with latent mutual
 * attraction and high proximity, plus an optional witness who can leak it. Cast onto
 * the default four it resolves the lovers to the strongest-attraction pair and leaves
 * the witness unfilled (a deliberate coverage gap: the only leaky, low-discretion
 * agents are the lovers themselves).
 */
import type { ScenarioTemplate } from '../core/scenarioTemplate';

export const THE_OFFICE_ROMANCE: ScenarioTemplate = {
  templateId: 'the_office_romance',
  family: 'attraction',
  title: 'The Office Romance',
  summary:
    'Two coworkers carry a latent mutual attraction and sit close enough to act on it. Surfaced, it produces infatuation; exposed or separated, jealousy and heartbreak.',
  triggering: 'emerge',
  emotionalPayload: {
    targetEmotions: ['infatuation', 'jealousy', 'heartbreak'],
    description:
      "Two coworkers' latent mutual attraction, surfaced and steered toward infatuation — or, exposed to the office / separated by seating, toward jealousy and heartbreak.",
  },
  roles: [
    {
      roleId: 'loverA',
      label: 'Lover A',
      description: 'One half of the pair; carries mutual attraction toward Lover B and sits close to them.',
      required: true,
      preconditions: [
        { kind: 'relationship', toRole: 'loverB', direction: 'mutual', axis: 'affinity', op: 'gte', value: 30 },
        // proximity == the familiarity axis at authoring time (sim refines spatially).
        { kind: 'relationship', toRole: 'loverB', direction: 'mutual', axis: 'familiarity', op: 'gte', value: 50 },
      ],
    },
    {
      roleId: 'loverB',
      label: 'Lover B',
      description: 'The other half of the pair; the attraction is mutual.',
      required: true,
      preconditions: [
        { kind: 'relationship', toRole: 'loverA', direction: 'mutual', axis: 'affinity', op: 'gte', value: 30 },
      ],
    },
    {
      roleId: 'witness',
      label: 'Witness',
      description: 'A leaky coworker (low discretion) who can spot and spread the romance.',
      required: false,
      preconditions: [{ kind: 'axis', axis: 'discretion', op: 'lte', value: 35 }],
    },
  ],
  roleSeeds: [
    {
      roleId: 'loverA',
      beliefSeeds: [{ topic: 'office_romance', claim: "There's something real between us.", stance: 'accepts', confidence: 65 }],
      knowledgeSeeds: [],
      // the situation surfacing the latent attraction — a run-specific bump.
      relationshipOverrides: [{ toRole: 'loverB', affinity: 90, familiarity: 95 }],
    },
    {
      roleId: 'loverB',
      beliefSeeds: [{ topic: 'office_romance', claim: "I can't stop thinking about them.", stance: 'accepts', confidence: 60 }],
      knowledgeSeeds: [],
      relationshipOverrides: [{ toRole: 'loverA', affinity: 90, familiarity: 95 }],
    },
    {
      roleId: 'witness',
      beliefSeeds: [{ topic: 'office_romance', claim: 'I think those two are a thing.', stance: 'suspects', confidence: 40 }],
      knowledgeSeeds: ['spotted_together'],
      relationshipOverrides: [],
    },
  ],
  locations: [
    { locationId: 'loverA_desk', displayName: "Lover A's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindRoomId: 'cubicle-farm', bindDeskOfRole: 'loverA' },
    { locationId: 'loverB_desk', displayName: "Lover B's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindRoomId: 'cubicle-farm', bindDeskOfRole: 'loverB' },
    { locationId: 'witness_desk', displayName: "Witness's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindRoomId: 'cubicle-farm', bindDeskOfRole: 'witness' },
    { locationId: 'break_room', displayName: 'Break Room', tags: ['break_area'], accessState: 'open', fallbackLocationId: 'hallway', bindRoomId: 'break-room' },
    { locationId: 'hallway', displayName: 'Hallway', tags: ['transit'], accessState: 'open', fallbackLocationId: '', bindRoomId: 'hallway' },
  ],
  roleSpawns: [
    { roleId: 'loverA', locationId: 'loverA_desk' },
    { roleId: 'loverB', locationId: 'loverB_desk' },
    { roleId: 'witness', locationId: 'witness_desk' },
  ],
  truthFacts: [
    {
      truthId: 'romance_is_real',
      topic: 'office_romance',
      statement: 'Lover A and Lover B are secretly involved.',
      subjectRoles: ['loverA', 'loverB'],
      objectiveValue: true,
      sourceRole: 'loverA',
    },
  ],
  informationItems: [
    {
      informationId: 'love_note',
      topic: 'office_romance',
      claim: 'A note passed quietly between two desks.',
      originType: 'observation',
      truthId: 'romance_is_real',
      truthAlignment: 'true',
      sourceRole: 'loverA',
      initialHolderRoles: ['loverA', 'loverB'],
    },
    {
      informationId: 'spotted_together',
      topic: 'office_romance',
      claim: 'I saw the two of them leave together after hours.',
      originType: 'observation',
      truthId: 'romance_is_real',
      truthAlignment: 'true',
      sourceRole: 'witness',
      initialHolderRoles: ['witness'],
    },
  ],
  interventionTypes: [
    { type: 'exposure', values: ['discreet', 'public'] },
    { type: 'seating', values: ['adjacent', 'separated'] },
  ],
  variants: [
    { variantId: 'discreet_adjacent', selections: { exposure: 'discreet', seating: 'adjacent' } },
    { variantId: 'exposed', selections: { exposure: 'public', seating: 'adjacent' } },
    { variantId: 'separated', selections: { exposure: 'discreet', seating: 'separated' } },
  ],
  defaultVariantId: 'discreet_adjacent',
  objective: {
    objectiveId: 'harvest_office_romance',
    label: 'Harvest the emotional payload of a latent office romance.',
    category: 'culture',
    desiredPressure: 'attraction',
    intendedObservableBehavior: 'Infatuation surfaces; under exposure or separation, jealousy or heartbreak emerges.',
    kpi: 'emotional_response_capture',
    expectedEvidence: ['affinity changes', 'jealousy events', 'relationship changes'],
  },
};

/**
 * The Contested Promotion — the cast-agnostic generalization of the bound
 * `promotion_rumor_001` (data/defaults.ts), and the worked example that a bound
 * scenario is just a fully-cast template. Cast onto the default four it resolves
 * advanced→janice, passed_over→carl, amplifier→linda, authority→manager, producing
 * a scenario structurally equivalent to the prototype. The bound scenario is left
 * exactly as-is; this is the additive full-game shape beside it.
 *
 * Roles, not names: `advanced` = an ambitious high-integrity earner; `passed_over`
 * = the ambitious, grudge-holding rival who resents them; `amplifier` = a leaky
 * (low-discretion) spreader; `authority` = the discreet, high-integrity source of
 * truth. Topic is the generic `the_promotion`, not anyone's name.
 */
export const THE_CONTESTED_PROMOTION: ScenarioTemplate = {
  templateId: 'the_contested_promotion',
  family: 'rumor',
  title: 'The Contested Promotion',
  summary: 'An ambiguous promotion seeds a rumor — does the passed-over rival amplify it, or does it stay contained?',
  triggering: 'provoke',
  emotionalPayload: {
    targetEmotions: ['resentment', 'paranoia', 'vindication'],
    description: 'A contested advancement: the passed-over rival stews (resentment), the office wonders if it was rigged (paranoia), and someone is proven right either way (vindication).',
  },
  roles: [
    {
      roleId: 'advanced',
      label: 'Promotion Recipient',
      description: 'The ambitious, high-integrity employee the promotion was given to.',
      required: true,
      preconditions: [
        { kind: 'axis', axis: 'ambition', op: 'gte', value: 70 },
        { kind: 'axis', axis: 'integrity', op: 'gte', value: 60 },
      ],
    },
    {
      roleId: 'passed_over',
      label: 'Promotion Skeptic',
      description: 'The ambitious, grudge-holding rival who feels the role should have been theirs.',
      required: true,
      preconditions: [
        { kind: 'axis', axis: 'ambition', op: 'gte', value: 70 },
        { kind: 'axis', axis: 'grudgeHolding', op: 'gte', value: 55 },
        // resents the one who got it.
        { kind: 'relationship', toRole: 'advanced', direction: 'outgoing', axis: 'affinity', op: 'lte', value: 0 },
      ],
    },
    {
      roleId: 'amplifier',
      label: 'Information Amplifier',
      description: 'A leaky, well-connected coworker who spreads what they hear.',
      required: false,
      preconditions: [{ kind: 'axis', axis: 'discretion', op: 'lte', value: 35 }],
    },
    {
      roleId: 'authority',
      label: 'Source Of Truth',
      description: 'The discreet, high-integrity manager who made the call.',
      required: true,
      preconditions: [
        { kind: 'axis', axis: 'discretion', op: 'gte', value: 75 },
        { kind: 'axis', axis: 'integrity', op: 'gte', value: 70 },
      ],
    },
  ],
  roleSeeds: [
    {
      roleId: 'advanced',
      beliefSeeds: [{ topic: 'the_promotion', claim: 'I earned the promotion legitimately.', stance: 'accepts', confidence: 90 }],
      knowledgeSeeds: ['official_promotion_notice'],
      relationshipOverrides: [],
    },
    {
      roleId: 'passed_over',
      // the promotion-driven suspicion spike, layered on the persona baseline.
      relationshipOverrides: [{ toRole: 'advanced', suspicion: 100, affinity: -50 }],
      beliefSeeds: [{ topic: 'the_promotion', claim: 'The promotion was probably rigged.', stance: 'suspects', confidence: 33 }],
      knowledgeSeeds: ['official_promotion_notice', 'private_meeting_observation'],
    },
    {
      roleId: 'amplifier',
      beliefSeeds: [{ topic: 'the_promotion', claim: 'Someone got promoted.', stance: 'unknown', confidence: 0 }],
      knowledgeSeeds: [],
      relationshipOverrides: [],
    },
    {
      roleId: 'authority',
      beliefSeeds: [{ topic: 'the_promotion', claim: 'They earned the promotion legitimately.', stance: 'accepts', confidence: 100 }],
      knowledgeSeeds: ['official_promotion_notice'],
      relationshipOverrides: [],
    },
  ],
  locations: [
    { locationId: 'advanced_desk', displayName: "Recipient's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindRoomId: 'cubicle-farm', bindDeskOfRole: 'advanced' },
    { locationId: 'passed_over_desk', displayName: "Skeptic's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindRoomId: 'cubicle-farm', bindDeskOfRole: 'passed_over' },
    { locationId: 'amplifier_desk', displayName: "Amplifier's Desk", tags: ['work_area'], accessState: 'open', fallbackLocationId: 'hallway', bindRoomId: 'cubicle-farm', bindDeskOfRole: 'amplifier' },
    { locationId: 'manager_office', displayName: 'Manager Office', tags: ['management'], accessState: 'open', fallbackLocationId: '', bindRoomId: 'manager-office' },
    { locationId: 'break_room', displayName: 'Break Room', tags: ['break_area'], accessState: 'open', fallbackLocationId: 'hallway', bindRoomId: 'break-room' },
    { locationId: 'hallway', displayName: 'Hallway', tags: ['transit'], accessState: 'open', fallbackLocationId: '', bindRoomId: 'hallway' },
  ],
  roleSpawns: [
    { roleId: 'advanced', locationId: 'advanced_desk' },
    { roleId: 'passed_over', locationId: 'passed_over_desk' },
    { roleId: 'amplifier', locationId: 'amplifier_desk' },
    { roleId: 'authority', locationId: 'manager_office' },
  ],
  truthFacts: [
    {
      truthId: 'promotion_legitimate',
      topic: 'the_promotion',
      statement: 'The recipient earned the promotion legitimately.',
      subjectRoles: ['advanced', 'authority'],
      objectiveValue: true,
      sourceRole: 'authority',
    },
  ],
  informationItems: [
    { informationId: 'official_promotion_notice', topic: 'the_promotion', claim: 'The promotion was announced.', originType: 'official', truthId: 'promotion_legitimate', truthAlignment: 'true', sourceRole: 'authority', initialHolderRoles: ['authority', 'advanced'] },
    { informationId: 'private_meeting_observation', topic: 'the_promotion', claim: 'The recipient had a private meeting with the manager.', originType: 'observation', truthId: 'promotion_legitimate', truthAlignment: 'misleading', sourceRole: 'passed_over', initialHolderRoles: ['passed_over'] },
    { informationId: 'rigged_promotion_claim', topic: 'the_promotion', claim: 'The promotion was rigged.', originType: 'rumor', truthId: 'promotion_legitimate', truthAlignment: 'false', sourceRole: 'passed_over', initialHolderRoles: ['passed_over'] },
  ],
  interventionTypes: [
    { type: 'promotion_information_entry', values: ['public_announcement', 'private_notification'] },
    { type: 'break_room_access', values: ['open', 'locked'] },
  ],
  variants: [
    { variantId: 'public_announcement', selections: { promotion_information_entry: 'public_announcement', break_room_access: 'open' } },
    { variantId: 'private_notification', selections: { promotion_information_entry: 'private_notification', break_room_access: 'open' } },
    { variantId: 'private_notification_break_room_locked', selections: { promotion_information_entry: 'private_notification', break_room_access: 'locked' } },
  ],
  defaultVariantId: 'public_announcement',
  objective: {
    objectiveId: 'maintain_rumor_resistance',
    label: 'Maintain leadership confidence by testing rumor resistance after an ambiguous promotion.',
    category: 'stability',
    desiredPressure: 'management_trust',
    intendedObservableBehavior: "The skeptic's suspicion stays low OR the amplifier does not spread the rumor.",
    kpi: 'rumor_containment_or_amplification_assessment',
    expectedEvidence: ['belief changes', 'rumor reach count', 'trust metrics'],
  },
};

export const ROLE_TEMPLATES: ScenarioTemplate[] = [THE_OFFICE_ROMANCE, THE_CONTESTED_PROMOTION];
