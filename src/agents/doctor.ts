import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FileProjectRepository, safePath } from '../storage/file-projects.js';
import { readInstallManifest, digest, VERSION } from './install-skills.js';
export function supportedRuntime(version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number);
  return major === 22 && minor >= 12;
}
export type SetupReport = {
  ok: boolean;
  version: string;
  checks: Array<{ name: string; ok: boolean; action: string }>;
  nextAction: string;
};
export async function inspectSetup(root: string): Promise<SetupReport> {
  const checks: SetupReport['checks'] = [
    {
      name: 'Node.js 22.12+',
      ok: supportedRuntime(),
      action: 'Use Node.js 22 (at least 22.12.0).',
    },
  ];
  try {
    await access(fileURLToPath(new URL('../cli/index.js', import.meta.url)));
    checks.push({ name: 'CLI build', ok: true, action: '' });
  } catch {
    checks.push({
      name: 'CLI build',
      ok: false,
      action: 'Build the source package with npm run build:cli, or reinstall the tested tarball.',
    });
  }
  try {
    await access(root, constants.W_OK);
    checks.push({ name: 'Project writable', ok: true, action: '' });
  } catch {
    checks.push({
      name: 'Project writable',
      ok: false,
      action: 'Choose an existing writable project directory.',
    });
  }
  try {
    await new FileProjectRepository().load(root, false);
    checks.push({ name: 'Project archive', ok: true, action: '' });
  } catch {
    checks.push({
      name: 'Project archive',
      ok: false,
      action:
        'Run threadlatch setup --agent codex (or claude-code/both); preserve a corrupt archive before recovery.',
    });
  }
  try {
    const manifest = await readInstallManifest(root);
    if (!manifest.files.length)
      checks.push({
        name: 'Project skills',
        ok: false,
        action: 'Run threadlatch skills install --agent codex (or claude-code/both).',
      });
    for (const f of manifest.files) {
      let ok = false;
      try {
        ok =
          digest(await readFile(await safePath(root, f.path), 'utf8')) === f.digest &&
          f.version === VERSION;
      } catch {
        /* actionable result below */
      }
      checks.push({
        name: f.path,
        ok,
        action: ok
          ? ''
          : 'Preserve edited files; reconcile them before running skills install to update.',
      });
    }
  } catch {
    checks.push({
      name: 'Install manifest',
      ok: false,
      action: 'Inspect .threadlatch/install-manifest.json and preserve edited skill files.',
    });
  }
  return {
    ok: checks.every((c) => c.ok),
    version: VERSION,
    checks,
    nextAction:
      checks.find((c) => !c.ok)?.action ??
      'Continue with $threadlatch in Codex or /threadlatch in Claude Code. If discovery has not refreshed, start a new session.',
  };
}
