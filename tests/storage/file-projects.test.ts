import { mkdtemp, readFile, writeFile, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { FileProjectRepository } from '../../src/storage/file-projects.js';
import { createProject, currentRevision } from '../../src/core/schema.js';
import { restoreSnapshot } from '../../src/core/apply-changes.js';
it('preserves instructions and ignore rules and regenerates a damaged projection', async () => {
  const root = await mkdtemp(join(tmpdir(), 'threadlatch-ç space-')); const repo = new FileProjectRepository();
  await writeFile(join(root, '.gitignore'), 'node_modules/\n'); await writeFile(join(root, 'AGENTS.md'), 'existing instructions');
  await repo.init(root, 'Synthetic'); await expect(repo.init(root, 'Again')).rejects.toThrow(/exists/i);
  expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toBe('existing instructions');
  expect(await readFile(join(root, '.gitignore'), 'utf8')).toBe('node_modules/\n.threadlatch/\n');
  await writeFile(join(root, '.threadlatch/current.md'), 'damaged'); await repo.load(root);
  expect(await readFile(join(root, '.threadlatch/current.md'), 'utf8')).toContain('revision:');
});
it('rejects stale writes and lock collisions without altering canonical bytes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'threadlatch-')); const repo = new FileProjectRepository(); const a = await repo.init(root, 'Synthetic');
  const next = structuredClone(a), revision = restoreSnapshot(currentRevision(a), currentRevision(a)); next.revisions.push(revision); next.project.currentRevisionId = revision.id;
  await repo.save(root, a.project.currentRevisionId, next);
  const path = join(root, '.threadlatch/project.json'), before = await readFile(path, 'utf8');
  await expect(repo.save(root, a.project.currentRevisionId, a)).rejects.toThrow(/revision/i);
  await writeFile(join(root, '.threadlatch/write.lock'), 'occupied');
  await expect(repo.save(root, revision.id, next)).rejects.toThrow(/lock/i);
  expect(await readFile(path, 'utf8')).toBe(before);
});
it('rejects symlink escapes and corrupted archives without replacing data', async () => {
  const root = await mkdtemp(join(tmpdir(), 'threadlatch-')), outside = await mkdtemp(join(tmpdir(), 'outside-'));
  await symlink(outside, join(root, '.threadlatch'), process.platform === 'win32' ? 'junction' : 'dir');
  const repo = new FileProjectRepository(); await expect(repo.init(root, 'Synthetic')).rejects.toThrow(/symlink|path/i);
  expect(createProject('Synthetic').schemaVersion).toBe(1);
  const safe = await mkdtemp(join(tmpdir(), 'threadlatch-')); await mkdir(join(safe, '.threadlatch')); await writeFile(join(safe, '.threadlatch/project.json'), '{broken');
  await expect(repo.load(safe)).rejects.toThrow(/JSON/i); expect(await readFile(join(safe, '.threadlatch/project.json'), 'utf8')).toBe('{broken');
});
