import 'fake-indexeddb/auto';
import { beforeAll, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { proposal } from '../helpers.js';
import { parseArchive } from '../../src/core/schema.js';
import { BrowserProjectRepository } from '../../src/storage/projects.js';
const exec = promisify(execFile),
  cli = resolve('dist-cli/cli/index.js');
beforeAll(async () => {
  await exec(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.cli.json']);
});
async function run(root: string, ...args: string[]) {
  try {
    const r = await exec(process.execPath, [cli, ...args], { cwd: root });
    return { code: 0, ...r };
  } catch (e) {
    const r = e as { code: number; stdout: string; stderr: string };
    return r;
  }
}
it('uses spawned Node processes for setup, source review, competing saves, and browser round-trip', async () => {
  const root = await mkdtemp(join(tmpdir(), 'roundtrip-ü space-'));
  expect((await run(root, 'setup', '--agent', 'both')).code).toBe(0);
  expect((await run(root, 'doctor')).code).toBe(0);
  await writeFile(join(root, 'source.txt'), 'User: Use SQLite.');
  expect(
    (await run(root, 'request', '--input', 'source.txt', '--format', 'role-tagged')).code,
  ).toBe(0);
  const a = parseArchive(await readFile(join(root, '.threadlatch/project.json'), 'utf8')),
    req = a.requests[0],
    batch = proposal(req);
  await writeFile(join(root, 'proposal.json'), JSON.stringify(batch));
  expect(
    (await run(root, 'import', '--request', req.requestId, '--input', 'proposal.json')).code,
  ).toBe(0);
  const args = ['apply', '--request', req.requestId, '--select', batch.changes[0].proposalId];
  const race = await Promise.all([run(root, ...args), run(root, ...args)]);
  expect(race.filter((r) => r.code === 0)).toHaveLength(1);
  expect(race.filter((r) => r.code === 2 || r.code === 3)).toHaveLength(1);
  const saved = parseArchive((await run(root, 'export', '--format', 'json')).stdout);
  const browser = new BrowserProjectRepository('roundtrip-' + crypto.randomUUID());
  await browser.create(saved);
  const restored = parseArchive(JSON.stringify(await browser.load(saved.project.id)));
  expect(restored.project.currentRevisionId).toBe(saved.project.currentRevisionId);
  expect(restored.revisions.at(-1)?.items[0].text).toBe('Use SQLite.');
  browser.db.close();
  expect((await run(root, 'skills', 'uninstall', '--agent', 'both')).code).toBe(0);
  expect(
    parseArchive(await readFile(join(root, '.threadlatch/project.json'), 'utf8')).project
      .currentRevisionId,
  ).toBe(saved.project.currentRevisionId);
}, 20_000);
