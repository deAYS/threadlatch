import { expect, it } from 'vitest';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectSetup } from '../../src/agents/doctor.js';
it('reports a missing project with a useful next action and never writes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'doctor-')); const report = await inspectSetup(root);
  expect(report.ok).toBe(false); expect(report.nextAction.length).toBeGreaterThan(10); expect(report.checks.find(c => c.name === 'Project archive')?.action).toContain('setup'); expect(await readdir(root)).toEqual([]);
});
