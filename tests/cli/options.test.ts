import { expect, it } from 'vitest';
import { runCli } from '../../src/cli/commands.js';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
it('rejects unknown flags before creating files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'options-'));
  let error = '';
  expect(
    await runCli(['init', '--titel', 'typo'], {
      cwd: root,
      stdout: () => {},
      stderr: (s) => {
        error += s;
      },
    }),
  ).toBe(2);
  expect(error).toMatch(/option/i);
  expect(await readdir(root)).toEqual([]);
});
