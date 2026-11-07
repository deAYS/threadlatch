import { expect, it } from 'vitest';
import { mkdtemp, readdir, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectSetup } from '../../src/agents/doctor.js';
it('reports a missing project with a useful next action and never writes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'doctor-'));
  const report = await inspectSetup(root);
  expect(report.ok).toBe(false);
  expect(report.nextAction.length).toBeGreaterThan(10);
  expect(report.checks.find((c) => c.name === 'Project archive')?.action).toContain('setup');
  expect(await readdir(root)).toEqual([]);
});

it('never executes a project-local command shim during doctor', async () => {
  if (process.platform !== 'win32') return;
  const root = await mkdtemp(join(tmpdir(), 'doctor-shim-'));
  const marker = join(root, 'unexpected-execution.txt');
  await writeFile(
    join(root, 'threadlatch.cmd'),
    '@echo off\r\necho executed>unexpected-execution.txt\r\necho 0.1.0-preview.1\r\n',
  );
  const report = await inspectSetup(root);
  await expect(access(marker)).rejects.toThrow();
  expect(report.checks.find((c) => c.name === 'CLI access from project')?.ok).toBe(false);
});
