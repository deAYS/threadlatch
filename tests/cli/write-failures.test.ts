import { expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArchive } from '../../src/core/schema.js';
import { runCli, type CliIO } from '../../src/cli/commands.js';
import { proposal } from '../helpers.js';

const fault = vi.hoisted(() => ({ canonicalTarget: '' }));
vi.mock('node:fs/promises', async (original) => {
  const fs = await original<typeof import('node:fs/promises')>();
  return {
    ...fs,
    rename: async (...args: Parameters<typeof fs.rename>) => {
      if (String(args[1]) === fault.canonicalTarget) {
        fault.canonicalTarget = '';
        throw Object.assign(new Error('Synthetic disk full'), { code: 'ENOSPC' });
      }
      return fs.rename(...args);
    },
  };
});

it('canonical disk failure leaves generation and pending state unchanged and allows a single retry', async () => {
  const root = await mkdtemp(join(tmpdir(), 'canonical-fault-'));
  let output = '',
    error = '';
  const io: CliIO = {
    cwd: root,
    stdout: (s) => {
      output += s;
    },
    stderr: (s) => {
      error += s;
    },
  };
  const run = async (...args: string[]) => {
    output = '';
    error = '';
    return runCli(args, io);
  };
  await run('init');
  await writeFile(join(root, 'source.txt'), 'User: Use SQLite.');
  const path = join(root, '.threadlatch/project.json');
  const before = await readFile(path, 'utf8');
  fault.canonicalTarget = path;
  expect(await run('request', '--input', 'source.txt', '--format', 'role-tagged')).toBe(3);
  expect(error).toContain('ENOSPC');
  expect(output).toBe('');
  expect(await readFile(path, 'utf8')).toBe(before);
  expect(await run('request', '--input', 'source.txt', '--format', 'role-tagged')).toBe(0);
  const prepared = parseArchive(await readFile(path, 'utf8'));
  expect(prepared.requests).toHaveLength(1);
  await writeFile(join(root, 'reply.json'), JSON.stringify(proposal(prepared.requests[0])));
  const canonical = await readFile(path, 'utf8');
  fault.canonicalTarget = path;
  expect(
    await run('import', '--request', prepared.requests[0].requestId, '--input', 'reply.json'),
  ).toBe(3);
  expect(await readFile(path, 'utf8')).toBe(canonical);
  expect(
    await run('import', '--request', prepared.requests[0].requestId, '--input', 'reply.json'),
  ).toBe(0);
  expect(parseArchive(await readFile(path, 'utf8')).proposals).toHaveLength(1);
});
