import { readFile, lstat, mkdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { safePath, withProjectLock, atomicWrite } from '../storage/file-projects.js';
import { parseJson } from '../core/schema.js';
export type Agent = 'codex' | 'claude-code';
export type InstallReport = { changed: string[]; preserved: string[]; conflicts: string[] };
export const VERSION = '0.1.0-preview.1';
export const assetRoot = fileURLToPath(new URL('../../skills/threadlatch/', import.meta.url));
const assets = ['SKILL.md', 'agents/openai.yaml'];
const destination = (agent: Agent) => agent === 'codex' ? '.agents/skills/threadlatch' : '.claude/skills/threadlatch';
const allowedPaths = ['codex', 'claude-code'].flatMap(a => assets.map(f => destination(a as Agent) + '/' + f));
const Manifest = z.strictObject({ files: z.array(z.strictObject({ path: z.string().refine(p => allowedPaths.includes(p)), version: z.string().max(80), digest: z.string().regex(/^[a-f0-9]{64}$/) })).max(4) });
type ManifestType = z.infer<typeof Manifest>;
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
async function optionalRead(path: string) { try { const stat = await lstat(path); if (!stat.isFile() || stat.size > 1_048_576) throw new Error('Unsupported skill file size or type.'); return await readFile(path, 'utf8'); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; } }
export async function readInstallManifest(root: string): Promise<ManifestType> {
  const raw = await optionalRead(await safePath(root, '.threadlatch/install-manifest.json'));
  if (raw === null) return { files: [] };
  const parsed = Manifest.safeParse(parseJson(raw)); if (!parsed.success || new Set(parsed.data.files.map(f => f.path)).size !== parsed.data.files.length) throw new Error('Invalid install manifest. Preserve it and inspect owned files before recovery.'); return parsed.data;
}
async function changeSkills(root: string, agents: Agent[], remove: boolean): Promise<InstallReport> {
  if (!agents.length || agents.some(a => !['codex', 'claude-code'].includes(a))) throw new Error('Select codex or claude-code.');
  return withProjectLock(root, async () => {
    const manifest = await readInstallManifest(root), report: InstallReport = { changed: [], preserved: [], conflicts: [] };
    const plan: Array<{ relative: string; path: string; before: string | null; after: string | null }> = [];
    for (const agent of [...new Set(agents)]) for (const file of assets) {
      const rel = destination(agent) + '/' + file, path = await safePath(root, rel), before = await optionalRead(path), owned = manifest.files.find(f => f.path === rel);
      if (before !== null && (!owned || owned.digest !== digest(before))) { report.conflicts.push(rel); continue; }
      if (remove) { if (owned) plan.push({ relative: rel, path, before, after: null }); else report.preserved.push(rel); }
      else {
        const after = await readFile(join(assetRoot, file), 'utf8');
        if (before === after && owned?.version === VERSION) report.preserved.push(rel);
        else plan.push({ relative: rel, path, before, after });
      }
    }
    if (!remove && report.conflicts.length) return report;
    const completed: typeof plan = [];
    try {
      for (const p of plan) {
        if (p.after === null) { if (p.before !== null) await unlink(p.path); }
        else { await mkdir(dirname(p.path), { recursive: true }); await safePath(root, p.relative); await atomicWrite(p.path, p.after); }
        completed.push(p);
      }
      manifest.files = manifest.files.filter(f => !plan.some(p => p.relative === f.path));
      for (const p of plan) if (p.after !== null) manifest.files.push({ path: p.relative, digest: digest(p.after), version: VERSION });
      await atomicWrite(await safePath(root, '.threadlatch/install-manifest.json'), JSON.stringify(manifest, null, 2));
    } catch (e) {
      for (const p of completed.reverse()) { if (p.before === null) await unlink(p.path).catch(() => {}); else await atomicWrite(p.path, p.before); }
      throw e;
    }
    report.changed = plan.map(p => p.relative); return report;
  });
}
export const installSkills = (root: string, agents: Agent[]) => changeSkills(root, agents, false);
export const removeSkills = (root: string, agents: Agent[]) => changeSkills(root, agents, true);
