/**
 * Generate the shared wall-blob index contract (src/tiles/blob-index-table.json).
 * Terrarium is the source of truth; commit an identical copy into the Unity repo
 * (Tools/ParityHarness/blob-index-table.json). Re-run only if the blob model changes.
 *
 *   npx tsx scripts/genBlobTable.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { blobContract, BLOB_TILE_COUNT } from '../src/tiles/blob';

const contract = blobContract();
if (contract.configs.length !== BLOB_TILE_COUNT) {
  throw new Error(`expected ${BLOB_TILE_COUNT} tiles, got ${contract.configs.length}`);
}
const out = resolve(process.cwd(), 'src/tiles/blob-index-table.json');
writeFileSync(out, JSON.stringify(contract, null, 2) + '\n');
console.log(`wrote ${out} (${contract.configs.length} tiles)`);
