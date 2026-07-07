import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  NB,
  BLOB_TABLE,
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  canonicalize,
  blobIndex,
  configForIndex,
  blobContract,
} from '../src/tiles/blob';

describe('wall blob index (8-neighbor autotile contract)', () => {
  it('collapses 256 raw configs to exactly 47 tiles', () => {
    expect(BLOB_CONFIGS.length).toBe(BLOB_TILE_COUNT);
    expect(new Set(BLOB_TABLE).size).toBe(47);
    expect(BLOB_TABLE.length).toBe(256);
  });

  it('only counts a corner when both its edges are set', () => {
    // NE bit present but E edge missing → NE must be stripped.
    expect(canonicalize(NB.N | NB.NE)).toBe(NB.N);
    // both edges present → NE kept.
    expect(canonicalize(NB.N | NB.E | NB.NE)).toBe(NB.N | NB.E | NB.NE);
    // canonicalize is idempotent
    for (let raw = 0; raw < 256; raw++) {
      expect(canonicalize(canonicalize(raw))).toBe(canonicalize(raw));
    }
  });

  it('blobIndex is stable under non-counting-corner noise', () => {
    // A straight EW run (E+W) has no counting corners, so any diagonal bits are noise.
    const base = NB.E | NB.W;
    const idx = blobIndex(base);
    for (const diag of [NB.NE, NB.SE, NB.SW, NB.NW]) {
      expect(blobIndex(base | diag)).toBe(idx);
    }
  });

  it('round-trips index → config → index', () => {
    for (let i = 0; i < BLOB_TILE_COUNT; i++) {
      const c = configForIndex(i);
      let raw = 0;
      if (c.n) raw |= NB.N;
      if (c.e) raw |= NB.E;
      if (c.s) raw |= NB.S;
      if (c.w) raw |= NB.W;
      if (c.ne === 'solid') raw |= NB.NE;
      if (c.se === 'solid') raw |= NB.SE;
      if (c.sw === 'solid') raw |= NB.SW;
      if (c.nw === 'solid') raw |= NB.NW;
      expect(blobIndex(raw)).toBe(i);
    }
  });

  it('classifies corners: exposed / solid / concave', () => {
    // Hollow-room inner corner: S+E connected, SE diagonal is FLOOR → concave.
    const inner = configForIndex(blobIndex(NB.S | NB.E));
    expect(inner.se).toBe('concave');
    // Same edges but SE diagonal is wall → solid (interior).
    const solid = configForIndex(blobIndex(NB.S | NB.E | NB.SE));
    expect(solid.se).toBe('solid');
    // A north edge open → the NE/NW corners are exposed.
    const openN = configForIndex(blobIndex(NB.E | NB.S | NB.W)); // tee, N open
    expect(openN.ne).toBe('exposed');
    expect(openN.nw).toBe('exposed');
  });

  it('matches the committed golden contract (parity referee)', () => {
    const golden = JSON.parse(
      readFileSync(resolve(__dirname, '../src/tiles/blob-index-table.json'), 'utf8'),
    );
    const computed = blobContract();
    expect(golden.table).toEqual(computed.table);
    expect(golden.configs).toEqual(computed.configs);
    expect(golden.tileCount).toBe(computed.tileCount);
    expect(golden.bits).toEqual(computed.bits);
  });
});
