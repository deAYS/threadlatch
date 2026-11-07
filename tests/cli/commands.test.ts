import { expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli, type CliIO } from '../../src/cli/commands.js';
import { proposal } from '../helpers.js';
import { parseArchive } from '../../src/core/schema.js';

it('reports committed proposal with a warning when its auxiliary file fails, and repairs without replay', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cli-pending-failure-'));
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
  await run('init');
  await writeFile(join(root, 'source.txt'), 'User: Use SQLite.');
  await run('request', '--input', 'source.txt', '--format', 'role-tagged');
  const archivePath = join(root, '.threadlatch/project.json');
  const before = parseArchive(await readFile(archivePath, 'utf8'));
  const request = before.requests[0];
  const batch = proposal(request);
  await writeFile(join(root, 'proposal.json'), JSON.stringify(batch));
  const auxiliary = join(root, `.threadlatch/pending/${request.requestId}.proposal.json`);
  await mkdir(auxiliary);
  const result = await run('import', '--request', request.requestId, '--input', 'proposal.json');
  const after = parseArchive(await readFile(archivePath, 'utf8'));
  expect(after.project.generation).toBe(before.project.generation + 1);
  expect(after.proposals).toHaveLength(1);
  expect(result.code).toBe(0);
  expect(result.output).toContain('Source matched');
  expect(result.error).toContain('committed');
  expect(result.error).toContain('repair');
  expect(
    (await run('import', '--request', request.requestId, '--input', 'proposal.json')).code,
  ).toBe(2);
  await rmdir(auxiliary);
  const canonical = await readFile(archivePath, 'utf8');
  expect((await run('repair')).code).toBe(0);
  expect(JSON.parse(await readFile(auxiliary, 'utf8')).requestId).toBe(request.requestId);
  expect(await readFile(archivePath, 'utf8')).toBe(canonical);
  expect(
    (await run('apply', '--request', request.requestId, '--select', batch.changes[0].proposalId))
      .code,
  ).toBe(0);
  expect(
    (await run('apply', '--request', request.requestId, '--select', batch.changes[0].proposalId))
      .code,
  ).toBe(2);
});

it('returns the durable request prompt when pending directory writing fails', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cli-request-failure-'));
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
  await runCli(['init'], io);
  await rmdir(join(root, '.threadlatch/pending'));
  await writeFile(join(root, '.threadlatch/pending'), 'synthetic obstruction');
  await writeFile(join(root, 'source.txt'), 'User: Use SQLite.');
  output = '';
  error = '';
  const code = await runCli(['request', '--input', 'source.txt', '--format', 'role-tagged'], io);
  const after = parseArchive(await readFile(join(root, '.threadlatch/project.json'), 'utf8'));
  expect(after.requests).toHaveLength(1);
  expect(code).toBe(0);
  expect(output).toContain(after.requests[0].requestId);
  expect(error).toContain('committed');
});
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

it('setup conflicts give one recovery action without a ready message and doctor has readable output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cli-setup-conflict-'));
  await mkdir(join(root, '.agents/skills/threadlatch'), { recursive: true });
  await writeFile(join(root, '.agents/skills/threadlatch/SKILL.md'), 'User owned rules');
  let output = '';
  const io: CliIO = {
    cwd: root,
    stdout: (s) => {
      output += s;
    },
    stderr: () => {},
  };
  expect(await runCli(['setup', '--agent', 'codex'], io)).toBe(2);
  expect(output).not.toContain('Use $threadlatch');
  expect(output).toContain('nextAction');
  expect(await readFile(join(root, '.agents/skills/threadlatch/SKILL.md'), 'utf8')).toBe(
    'User owned rules',
  );
  output = '';
  expect(await runCli(['doctor', '--output', 'human'], io)).toBe(2);
  expect(output).toContain('Next:');
});
