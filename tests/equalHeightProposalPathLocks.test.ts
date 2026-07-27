import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { reconcileEqualHeightProposalPathLocks } from '../scripts/highOblique/equalHeightProposalPathLocks';

const MODULE = `const EXACT_PATHS = {
  'object-source': [
    ['object-path', 'M0 0H1'],
  ],
};

const SPECIAL_EXACT_PATHS = [
  ['special-path', 'M0 0V1'],
];

const UNRELATED = 'M0 0H1';
`;

async function fixture(): Promise<{
  readonly rootDir: string;
  readonly sourceDir: string;
  readonly moduleFile: string;
}> {
  const rootDir = await mkdtemp(
    path.join(tmpdir(), 'equal-height-path-locks-'),
  );
  const sourceDir = path.join(rootDir, 'proofs');
  const moduleFile = path.join(rootDir, 'proposal.ts');
  await mkdir(path.join(sourceDir, 'object-family'), { recursive: true });
  await mkdir(path.join(sourceDir, 'special-family'), { recursive: true });
  await writeFile(
    path.join(sourceDir, 'object-family/object-source.svg'),
    '<svg><path id="object-path" d="M0 0H2" fill="#000"/></svg>',
    'utf8',
  );
  await writeFile(
    path.join(sourceDir, 'special-family/special-source.svg'),
    '<svg><path d="M0 0V2" id="special-path" fill="#000"/></svg>',
    'utf8',
  );
  await writeFile(moduleFile, MODULE, 'utf8');
  return { rootDir, sourceDir, moduleFile };
}

describe('equal-height proposal exact-path lock reconciliation', () => {
  it('plans changes without writing, then updates only locked d literals', async () => {
    const { rootDir, sourceDir, moduleFile } = await fixture();
    const options = {
      rootDir,
      sourceDir,
      modules: [
        {
          moduleFile,
          arraySourceIds: {
            SPECIAL_EXACT_PATHS: 'special-source',
          },
        },
      ],
    } as const;

    const dryRun = await reconcileEqualHeightProposalPathLocks(options);
    expect(dryRun.lockCount).toBe(2);
    expect(dryRun.changes.map(({ sourceId, pathId }) => [sourceId, pathId]))
      .toEqual([
        ['object-source', 'object-path'],
        ['special-source', 'special-path'],
      ]);
    expect(await readFile(moduleFile, 'utf8')).toBe(MODULE);

    const written = await reconcileEqualHeightProposalPathLocks({
      ...options,
      write: true,
    });
    expect(written.changes).toHaveLength(2);
    expect(await readFile(moduleFile, 'utf8')).toBe(
      MODULE
        .replace("'M0 0H1'", "'M0 0H2'")
        .replace("'M0 0V1'", "'M0 0V2'"),
    );

    const current = await reconcileEqualHeightProposalPathLocks(options);
    expect(current.changes).toEqual([]);
  });

  it('rejects ambiguous SVG basenames before touching a module', async () => {
    const { rootDir, sourceDir, moduleFile } = await fixture();
    await mkdir(path.join(sourceDir, 'duplicate-family'), { recursive: true });
    await writeFile(
      path.join(sourceDir, 'duplicate-family/object-source.svg'),
      '<svg><path id="object-path" d="M0 0H3"/></svg>',
      'utf8',
    );

    await expect(
      reconcileEqualHeightProposalPathLocks({
        rootDir,
        sourceDir,
        modules: [{ moduleFile }],
        write: true,
      }),
    ).rejects.toThrow('Duplicate proof source id object-source');
    expect(await readFile(moduleFile, 'utf8')).toBe(MODULE);
  });
});
