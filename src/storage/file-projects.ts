import { lstat, realpath, mkdir, readFile, open, rename, unlink, access } from 'node:fs/promises';
import { resolve, relative, join, isAbsolute, sep, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { id, createProject, parseArchive, currentRevision, type ProjectArchive } from '../core/schema.js';
import { buildHandoff } from '../export/handoff.js';
import { assertTransition } from '../core/workflow.js';

const exists = async (path: string) => { try { await access(path); return true; } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false; throw e; } };
export async function safePath(projectDir: string, path: string): Promise<string> {
  const root = await realpath(projectDir), target = resolve(root, path), rel = relative(root, target);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith('..' + sep)) throw new Error('Path escape outside selected project.');
  let cursor = root;
  for (const part of rel.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    try { if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Symlink path rejected. Use real project-local files.'); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
  }
  return target;
}
export async function atomicWrite(path: string, data: string) {
  const temp = path + '.tmp-' + id(); let handle;
  try { handle = await open(temp, 'wx', 0o600); await handle.writeFile(data, 'utf8'); await handle.sync(); await handle.close(); handle = undefined; await rename(temp, path); }
  finally { await handle?.close(); await unlink(temp).catch(() => {}); }
}
export async function withProjectLock<T>(root: string, work: () => Promise<T>): Promise<T> {
  const folder = await safePath(root, '.threadlatch'); await mkdir(folder, { recursive: true, mode: 0o700 });
  const path = await safePath(root, '.threadlatch/write.lock'); let handle;
  try { handle = await open(path, 'wx', 0o600); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('Project lock exists. Close other writers. If no writer is running, inspect and explicitly remove .threadlatch/write.lock; it is never auto-deleted.', { cause: e }); throw e; }
  try { await handle.writeFile(String(process.pid)); return await work(); }
  finally { await handle.close(); await unlink(path); }
}
function projection(a: ProjectArchive): string {
  const result = buildHandoff(currentRevision(a), { maxCodePoints: 24_000, includeEvidence: false });
  const body = result.ok ? result.text : '# ThreadLatch\n\nMemory exceeds the bounded projection. Narrow the scope before export; no content was silently dropped.\n';
  return `<!-- revision: ${a.project.currentRevisionId}; sha256: ${createHash('sha256').update(body).digest('hex')} -->\n${body}`;
}
export class FileProjectRepository {
  async init(root: string, title: string, seed?: ProjectArchive): Promise<ProjectArchive> {
    return withProjectLock(root, async () => {
      const path = await safePath(root, '.threadlatch/project.json'); if (await exists(path)) throw new Error('Project memory already exists. Use status or setup.');
      const ignorePath = await safePath(root, '.gitignore'); const ignore = await exists(ignorePath) ? await readFile(ignorePath, 'utf8') : '';
      if (!ignore.split(/\r?\n/).includes('.threadlatch/')) await atomicWrite(ignorePath, ignore + (ignore && !ignore.endsWith('\n') ? '\n' : '') + '.threadlatch/\n');
      const a = seed ? parseArchive(JSON.stringify(seed)) : createProject(title); await mkdir(await safePath(root, '.threadlatch/pending'), { recursive: true, mode: 0o700 });
      await atomicWrite(path, JSON.stringify(a, null, 2)); await atomicWrite(await safePath(root, '.threadlatch/current.md'), projection(a)); return a;
    });
  }
  async load(root: string, repair = true): Promise<ProjectArchive> {
    const path = await safePath(root, '.threadlatch/project.json'); const stat = await lstat(path);
    if (!stat.isFile() || stat.size > 10 * 1_048_576) throw new Error('Invalid archive file size or type.');
    const a = parseArchive(await readFile(path, 'utf8'));
    if (repair) {
      const view = await safePath(root, '.threadlatch/current.md'); const body = projection(a);
      if (!(await exists(view)) || await readFile(view, 'utf8') !== body) await withProjectLock(root, async () => {
        const fresh = await this.load(root, false); await atomicWrite(view, projection(fresh));
      });
    }
    return a;
  }
  async save(root: string, expectedRevisionId: string, archive: ProjectArchive): Promise<void> {
    await withProjectLock(root, () => this.saveLocked(root, expectedRevisionId, archive));
  }
  async saveLocked(root: string, expectedRevisionId: string, archive: ProjectArchive): Promise<void> {
    const valid = parseArchive(JSON.stringify(archive)), current = await this.load(root, false);
    if (current.project.currentRevisionId !== expectedRevisionId || valid.project.generation !== current.project.generation || valid.project.id !== current.project.id) throw new Error('Revision conflict. Reload current memory and reanalyze.');
    assertTransition(current, valid);
    valid.project.generation++;
    await atomicWrite(await safePath(root, '.threadlatch/project.json'), JSON.stringify(valid, null, 2));
    archive.project.generation = valid.project.generation;
    // Canonical commit has succeeded; a projection failure is recoverable on next load.
    try { await atomicWrite(await safePath(root, '.threadlatch/current.md'), projection(valid)); } catch { /* derived view is repaired from canonical state */ }
  }
}
export async function readProjectInput(root: string, input: string, limit = 1_048_576): Promise<string> {
  const path = await safePath(root, input); const stat = await lstat(path);
  if (!stat.isFile() || stat.size > limit) throw new Error('Input size limit or unsupported file type.');
  return readFile(path, 'utf8');
}
export const projectDirectory = (cwd: string, value?: string) => resolve(cwd, value ?? '.');
export const packageRoot = (modulePath: string) => dirname(dirname(dirname(modulePath)));
