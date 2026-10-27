import { expect, it } from 'vitest';
import { mkdtemp, writeFile, readFile, mkdir, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installSkills, removeSkills } from '../../src/agents/install-skills.js';
import { FileProjectRepository } from '../../src/storage/file-projects.js';
it('installs both agents repeatably and preserves edited skills and memory on removal', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skills-ü space-')); await new FileProjectRepository().init(root, 'Synthetic');
  expect((await installSkills(root, ['codex', 'claude-code'])).changed).toHaveLength(4);
  expect((await installSkills(root, ['codex', 'claude-code'])).changed).toEqual([]);
  const path = join(root, '.agents/skills/threadlatch/SKILL.md'); await writeFile(path, 'user customization');
  expect((await installSkills(root, ['codex'])).conflicts).toHaveLength(1);
  const removed = await removeSkills(root, ['codex', 'claude-code']); expect(removed.conflicts).toContain('.agents/skills/threadlatch/SKILL.md');
  expect(await readFile(path, 'utf8')).toBe('user customization');
  expect(JSON.parse(await readFile(join(root, '.threadlatch/project.json'), 'utf8')).project.title).toBe('Synthetic');
});
it('never overwrites an unowned same-name skill or follows an agent directory symlink', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skills-')), outside = await mkdtemp(join(tmpdir(), 'skills-outside-'));
  await new FileProjectRepository().init(root, 'Synthetic'); await mkdir(join(root, '.agents/skills/threadlatch'), { recursive: true });
  await writeFile(join(root, '.agents/skills/threadlatch/SKILL.md'), 'existing');
  expect((await installSkills(root, ['codex'])).conflicts).toHaveLength(1);
  await symlink(outside, join(root, '.claude'), process.platform === 'win32' ? 'junction' : 'dir');
  await expect(installSkills(root, ['claude-code'])).rejects.toThrow(/symlink/i);
});
