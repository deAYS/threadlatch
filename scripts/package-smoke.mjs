import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run test:package.');
const scratch = resolve('.superpowers/package-check');
mkdirSync(scratch, { recursive: true });
const packed = JSON.parse(
  execFileSync(process.execPath, [npm, 'pack', '--json', '--pack-destination', scratch], {
    encoding: 'utf8',
  }),
)[0];
assert(packed.files.some((f) => f.path === 'skills/threadlatch/SKILL.md'));
assert(packed.files.some((f) => f.path === 'dist-cli/cli/index.js'));
assert(
  packed.files.every((f) =>
    /^(dist-cli\/|skills\/threadlatch\/|README(?:\.tr)?\.md$|LICENSE$|package\.json$)/.test(f.path),
  ),
);
assert(
  !packed.files.some((f) =>
    /(?:^|\/)\.threadlatch(?:\/|$)|install-manifest|\.env|progress\.md/.test(f.path),
  ),
);
const sandbox = mkdtempSync(join(scratch, 'installed-'));
execFileSync(
  process.execPath,
  [
    npm,
    'install',
    '--prefix',
    sandbox,
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    join(scratch, packed.filename),
  ],
  { stdio: 'pipe' },
);
const cli = join(sandbox, 'node_modules/threadlatch/dist-cli/cli/index.js'),
  project = join(sandbox, 'Türkçe project with spaces');
mkdirSync(project);
writeFileSync(join(project, 'AGENTS.md'), 'Existing project rules.\n');
writeFileSync(join(project, 'CLAUDE.md'), 'Existing Claude rules.\n');
const run = (...args) =>
  execFileSync(process.execPath, [cli, ...args, '--project', project], { encoding: 'utf8' });
run('setup', '--agent', 'both');
const before = readFileSync(join(project, '.threadlatch/project.json'), 'utf8');
run('setup', '--agent', 'both');
assert.equal(before, readFileSync(join(project, '.threadlatch/project.json'), 'utf8'));
run('doctor');
assert.equal(readFileSync(join(project, 'AGENTS.md'), 'utf8'), 'Existing project rules.\n');
assert.equal(readFileSync(join(project, 'CLAUDE.md'), 'utf8'), 'Existing Claude rules.\n');
run('skills', 'uninstall', '--agent', 'both');
assert.equal(before, readFileSync(join(project, '.threadlatch/project.json'), 'utf8'));
writeFileSync(
  join(scratch, 'latest.json'),
  JSON.stringify({ tarball: join(scratch, packed.filename), cli, project }, null, 2),
);
console.log(
  JSON.stringify({
    package: packed.filename,
    files: packed.files.length,
    setup: 'passed',
    repeat: 'passed',
    doctor: 'passed',
    instructions: 'preserved',
    uninstallMemory: 'preserved',
    platform: process.platform,
    node: process.versions.node,
  }),
);
