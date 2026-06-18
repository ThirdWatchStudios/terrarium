import type { CharacterRecipe, ProjectState } from './types';
import { CANVAS } from './types';
import type { Activity } from '../parts/activities';
import { composeCharacter, overheadAnchor } from './compositor';

/**
 * Conversation visual — the paired half of the visual interaction system. Where
 * an activity badge says what *one* agent is doing, a conversation visual ties
 * two talking agents together so it reads as "these two are talking to *each
 * other*", not two people who happen to both be talking.
 *
 * The connector is drawn between two live world positions, so the tool can't
 * author it (positions are runtime). The split mirrors moods/activities: the
 * tool owns the STYLE vocabulary (exported as conversation-style.json); the sim
 * owns PAIRING + PLACEMENT — at runtime it pairs agents, shows `badge` on both,
 * and draws `link` between their `anchor` points.
 */
export interface ConversationStyle {
  /** Renderer family the sim should use to draw a conversation. */
  style: 'linked-bubbles';
  /** Activity badge shown on each conversant (an id in the activity atlas). */
  badge: Activity;
  /** The per-agent anchor the badge + link attach to. */
  anchor: 'aboveHead';
  link: {
    kind: 'dotted-arc';
    color: string;
    width: number;
    /** SVG stroke-dasharray (round caps make it read as dots). */
    dash: string;
    /** How far (canvas units) the arc bows up over the two badges. */
    bow: number;
  };
}

export const DEFAULT_CONVERSATION_STYLE: ConversationStyle = {
  style: 'linked-bubbles',
  badge: 'talking',
  anchor: 'aboveHead',
  link: { kind: 'dotted-arc', color: '#46C07A', width: 2.4, dash: '0.5 5', bow: 24 },
};

/** Exported descriptor — the sim reads this to draw conversations at runtime. */
export function conversationStyleJson(style: ConversationStyle = DEFAULT_CONVERSATION_STYLE) {
  return {
    kind: 'conversation-style' as const,
    ...style,
    meta: {
      generator: 'sprite-character-creator',
      note:
        'The sim pairs agents at runtime; for each pair it shows `badge` on both and ' +
        'draws `link` between their `anchor` points. Tool owns this style; sim owns ' +
        'pairing + placement. Group chats generalize the connector to N members.',
    },
  };
}

/** The dotted connector between two overhead points, bowing up over both. */
export function conversationLinkMarkup(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  style: ConversationStyle = DEFAULT_CONVERSATION_STYLE,
): string {
  const { color, width, dash, bow } = style.link;
  const mx = (ax + bx) / 2;
  const my = Math.min(ay, by) - bow;
  return (
    `<path d="M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}" fill="none" ` +
    `stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}" stroke-linecap="round"/>`
  );
}

/** Headroom above the cells so the linking arc has room to bow up un-clipped. */
const HEADROOM = 34;

/**
 * A two-agent conversation preview: A and B facing each other, each showing the
 * conversation badge, with the linked-bubble connector arcing between them.
 * Proves the vocabulary the sim reconstructs from conversation-style.json.
 */
export function composeConversation(
  a: CharacterRecipe,
  b: CharacterRecipe,
  project: ProjectState,
  style: ConversationStyle = DEFAULT_CONVERSATION_STYLE,
): string {
  const w = CANVAS * 2;
  const h = CANVAS + HEADROOM;
  // Nest each character's <svg> at an x offset; both keep their 0..128 viewBox.
  const place = (svg: string, ox: number) => svg.replace('<svg ', `<svg x="${ox}" y="0" `);
  const aSvg = place(composeCharacter(a, project.style, 'east', CANVAS, 'normal', { activity: style.badge }), 0);
  const bSvg = place(composeCharacter(b, project.style, 'west', CANVAS, 'normal', { activity: style.badge }), CANVAS);
  const aAnchor = overheadAnchor('east');
  const bAnchor = overheadAnchor('west');
  // Attach near each badge's crown so the arc reads as linking the two bubbles.
  const link = conversationLinkMarkup(aAnchor.x, aAnchor.y - 6, CANVAS + bAnchor.x, bAnchor.y - 6, style);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-HEADROOM} ${w} ${h}" ` +
    `width="${w}" height="${h}">${aSvg}${bSvg}${link}</svg>`
  );
}
