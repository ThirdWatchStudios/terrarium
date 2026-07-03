import { describe, it, expect } from 'vitest';
import { POSES, POSE_DEFS, getPose, poseCatalogJson } from '../src/parts/poses';
import { composeCharacter, poseRigAnchors } from '../src/core/compositor';
import { posesAtlas } from '../src/core/exporter';
import { defaultGoldenProject } from '../src/data/defaults';

/**
 * Pose + beat data model guard (social-theater-presentation-experiment.md
 * Appendix B/C, CONTRACT §3.16). The vocabulary is the contract: eight held
 * states, full facing coverage, presence couplings that resolve to real
 * channels, and NO sequencing tool-side (beats belong to the sim's Director).
 */

const PRESENCE_CHANNELS = [
  'gaitSpeed',
  'proximityRange',
  'restlessness',
  'expressiveness',
  'commitment',
  'latency',
  'attentiveness',
  'postureSlump',
];

const APPENDIX_B_POSES = [
  'neutral',
  'walk-approach',
  'notice',
  'arms-crossed',
  'hands-on-hips',
  'point',
  'slump',
  'walk-away',
];

// Composition set added on top of the Appendix-B confrontation vocabulary.
const COMPOSITION_POSES = ['lean-in', 'glance-back', 'laugh', 'shrug', 'recoil', 'celebrate', 'console'];
const ALL_POSES = [...APPENDIX_B_POSES, ...COMPOSITION_POSES];

function baseline() {
  const project = defaultGoldenProject();
  return { recipe: project.characters[0], style: project.style };
}

describe('pose catalog (Appendix B)', () => {
  it('ships the Appendix B confrontation set first, then the composition set', () => {
    expect([...POSES]).toEqual(ALL_POSES);
    // The confrontation set stays the canonical first 8 (the reprimand ordering).
    expect(POSES.slice(0, APPENDIX_B_POSES.length)).toEqual(APPENDIX_B_POSES);
  });

  it('every pose covers every authored facing with a non-empty front layer', () => {
    for (const pose of POSES) {
      const def = POSE_DEFS[pose];
      for (const facing of ['south', 'east', 'north'] as const) {
        expect(def.facings[facing], `${pose} missing ${facing}`).toBeTruthy();
        expect(def.facings[facing].front.length, `${pose}/${facing} has an empty front layer`).toBeGreaterThan(0);
      }
    }
  });

  it('presence couplings resolve to real presence channels (CONTRACT §5.8)', () => {
    for (const pose of POSES) {
      for (const channel of POSE_DEFS[pose].presenceChannels) {
        expect(PRESENCE_CHANNELS, `${pose} couples unknown channel "${channel}"`).toContain(channel);
      }
    }
  });

  it('unknown pose ids resolve to nothing (free-text-with-fallback)', () => {
    expect(getPose('moonwalk')).toBeUndefined();
  });

  it('the exported catalog carries vocabulary but no sequencing', () => {
    const catalog = poseCatalogJson();
    expect(catalog.kind).toBe('pose-catalog');
    expect(catalog.poses.map((p) => p.id)).toEqual(ALL_POSES);
    expect(catalog.boundary.director).toContain('sim-side');
    const text = JSON.stringify(catalog);
    for (const simWord of ['dwell', 'beat', 'schedule']) {
      // The boundary NOTE may name them; pose entries may not carry them as fields.
      for (const pose of catalog.poses) {
        expect(Object.keys(pose), `pose ${pose.id} carries sim-side field "${simWord}"`).not.toContain(simWord);
      }
    }
    expect(text).toContain('presenceChannels');
  });
});

describe('pose composition', () => {
  it('a posed compose differs from the base compose (the arms exist)', () => {
    const { recipe, style } = baseline();
    const base = composeCharacter(recipe, style, 'south', 128, 'normal', { badge: false });
    const pointed = composeCharacter(recipe, style, 'south', 128, 'normal', { badge: false, pose: 'point' });
    expect(pointed).not.toBe(base);
    expect(pointed.length).toBeGreaterThan(base.length);
  });

  it('slump applies the head-drop group transform; neutral does not', () => {
    const { recipe, style } = baseline();
    const slumped = composeCharacter(recipe, style, 'south', 128, 'normal', { badge: false, pose: 'slump' });
    const neutral = composeCharacter(recipe, style, 'south', 128, 'normal', { badge: false, pose: 'neutral' });
    expect(slumped).toContain('translate(0 7)');
    expect(neutral).not.toContain('translate(0 7)');
  });

  it('body lean renders on east only (a profile lean, not a sideways topple)', () => {
    const { recipe, style } = baseline();
    const east = composeCharacter(recipe, style, 'east', 128, 'normal', { badge: false, pose: 'walk-approach' });
    const south = composeCharacter(recipe, style, 'south', 128, 'normal', { badge: false, pose: 'walk-approach' });
    expect(east).toContain('rotate(6)');
    expect(south).not.toContain('rotate(6)');
  });

  it('west rig anchors mirror east and swap shoulder sides', () => {
    const east = poseRigAnchors('east');
    const west = poseRigAnchors('west');
    expect(west.shoulderLeft.x).toBe(128 - east.shoulderRight.x);
    expect(west.shoulderRight.x).toBe(128 - east.shoulderLeft.x);
    expect(west.hip.y).toBe(east.hip.y);
  });
});

describe('poses atlas', () => {
  it('keys every <pose>_<facing> frame and ships the rig anchors', () => {
    const { recipe, style } = baseline();
    const atlas = posesAtlas(recipe, style, 1);
    for (const pose of POSES) {
      for (const facing of ['south', 'east', 'north', 'west']) {
        expect(atlas.frames[`${pose}_${facing}`], `missing frame ${pose}_${facing}`).toBeTruthy();
      }
    }
    for (const facing of ['south', 'east', 'north', 'west']) {
      for (const anchor of ['shoulderLeft', 'shoulderRight', 'hip']) {
        const a = atlas.anchors[facing][anchor];
        expect(a, `missing anchor ${facing}/${anchor}`).toBeTruthy();
        expect(a.x).toBeGreaterThanOrEqual(0);
        expect(a.x).toBeLessThanOrEqual(1);
      }
    }
    expect(atlas.meta.register).toBe('truth');
    expect(atlas.meta.westIsMirroredEast).toBe(true);
  });
});
