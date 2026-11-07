import { FileProjectRepository, safePath } from '../storage/file-projects.js';
import { lstat } from 'node:fs/promises';
import { installSkills, type Agent } from './install-skills.js';
export async function setup(root: string, agents: Agent[], title = 'Project memory') {
  const repo = new FileProjectRepository();
  let present = false;
  try {
    await lstat(await safePath(root, '.threadlatch/project.json'));
    present = true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  if (present) await repo.load(root, false);
  else await repo.init(root, title);
  return installSkills(root, agents);
}
