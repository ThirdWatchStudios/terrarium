import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  compileDepartmentMachineArt,
  emitDepartmentMachineArt,
} from './props/departmentMachineImporter';

interface Options {
  readonly check: boolean;
  readonly input: string;
  readonly output: string;
}

function parseArgs(argv: readonly string[]): Options {
  let check = false;
  let input = path.resolve('assets/props/quota-co-department-machines-v1');
  let output = path.resolve('src/props/generated/quotaCoDepartmentMachineArt.ts');
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') check = true;
    else if (argument === '--write') check = false;
    else if (argument === '--input' || argument === '--out') {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} requires a path`);
      if (argument === '--input') input = path.resolve(value);
      else output = path.resolve(value);
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write('Usage: tsx scripts/importQuotaCoDepartmentMachines.ts [--check|--write] [--input <dir>] [--out <file>]\n');
      process.exit(0);
    } else throw new Error(`Unknown argument ${argument}`);
  }
  return { check, input, output };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const prefix = path.relative(process.cwd(), options.input).replaceAll(path.sep, '/');
  const result = await compileDepartmentMachineArt(options.input, prefix);
  const expected = emitDepartmentMachineArt(result);
  const current = await readFile(options.output, 'utf8').catch(() => undefined);
  if (options.check) {
    if (current !== expected) {
      throw new Error(`${path.relative(process.cwd(), options.output)} is stale; run npm run department-machines:import`);
    }
    process.stdout.write(`Department-machine import is current (${result.art.length} templates, ${result.overlays.length} overlays).\n`);
    return;
  }
  if (current === expected) {
    process.stdout.write(`Department-machine import unchanged (${result.art.length} templates).\n`);
    return;
  }
  await mkdir(path.dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp-${process.pid}`;
  await writeFile(temporary, expected, 'utf8');
  await rename(temporary, options.output);
  process.stdout.write(`Imported ${result.art.length} department-machine templates into ${path.relative(process.cwd(), options.output)}.\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
