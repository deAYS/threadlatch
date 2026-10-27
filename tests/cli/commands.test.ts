import { expect, it } from 'vitest';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli, type CliIO } from '../../src/cli/commands.js';
import { proposal } from '../helpers.js';
it('runs init → request → import → explicit apply → exports without a browser', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cli-ç space-'));
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
    const code = await runCli(args, io);
    return { code, output, error };
  };
  expect((await run('init')).code).toBe(0);
  await writeFile(join(root, 'source.txt'), 'User: Use SQLite.');
  expect((await run('request', '--input', 'source.txt', '--format', 'role-tagged')).code).toBe(0);
  let archive = JSON.parse(await readFile(join(root, '.threadlatch/project.json'), 'utf8'));
  const request = archive.requests[0],
    b = proposal(request);
  await writeFile(join(root, 'proposal.json'), JSON.stringify(b));
  expect(
    (await run('import', '--request', request.requestId, '--input', 'proposal.json')).code,
  ).toBe(0);
  expect((await run('apply', '--request', request.requestId)).code).toBe(2);
  expect(
    (await run('apply', '--request', request.requestId, '--select', b.changes[0].proposalId)).code,
  ).toBe(0);
  expect((await run('export', '--format', 'markdown')).output).toContain('Use SQLite.');
  archive = JSON.parse((await run('export', '--format', 'json')).output);
  expect(archive.revisions).toHaveLength(2);
  const before = await readFile(join(root, '.threadlatch/current.md'), 'utf8');
  await run('status');
  expect(await readFile(join(root, '.threadlatch/current.md'), 'utf8')).toBe(before);
  expect((await run('request', '--input', '../escape.txt')).code).toBe(2);
});
it('setup without an agent in noninteractive mode makes no memory changes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'setup-'));
  let error = '';
  const code = await runCli(['setup'], {
    cwd: root,
    stdout: () => {},
    stderr: (s) => {
      error += s;
    },
  });
  expect(code).toBe(2);
  expect(error).toContain('--agent');
  await expect(readFile(join(root, '.threadlatch/project.json'))).rejects.toThrow();
});
