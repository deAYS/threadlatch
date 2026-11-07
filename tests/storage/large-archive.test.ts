import { expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProject } from '../../src/core/schema.js';
import { FileProjectRepository } from '../../src/storage/file-projects.js';
import { runCli } from '../../src/cli/commands.js';
it('does not turn an accepted near-limit archive into an unreadable file or backup', async () => {
  const a = createProject('Synthetic large archive'),
    first = a.revisions[0];
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: 'item-' + i,
    kind: 'context' as const,
    text: 'Synthetic context',
    status: 'proposed' as const,
    origin: 'manual' as const,
    evidence: [],
    supersedesItemId: null,
    pinned: false,
  }));
  a.revisions = Array.from({ length: 45 }, (_, i) => ({
    ...first,
    id: 'rev-' + i,
    parentRevisionId: i ? 'rev-' + (i - 1) : null,
    items,
  }));
  a.project.currentRevisionId = 'rev-44';
  expect(Buffer.byteLength(JSON.stringify(a))).toBeLessThan(10 * 1_048_576);
  expect(Buffer.byteLength(JSON.stringify(a, null, 2))).toBeGreaterThan(10 * 1_048_576);
  const root = await mkdtemp(join(tmpdir(), 'large-archive-')),
    repo = new FileProjectRepository();
  await repo.init(root, a.project.title, a);
  expect((await repo.load(root)).revisions).toHaveLength(45);
  let output = '';
  expect(
    await runCli(['export', '--format', 'json'], {
      cwd: root,
      stdout: (s) => {
        output += s;
      },
      stderr: () => {},
    }),
  ).toBe(0);
  expect(Buffer.byteLength(output)).toBeLessThanOrEqual(10 * 1_048_576);
  expect(JSON.parse(output).revisions).toHaveLength(45);
}, 20_000);
