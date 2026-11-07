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
// Resolve and launch exactly as the installed skill does, from the target session cwd.
const resolvedRunner = execFileSync(
  process.execPath,
  ['-p', "require.resolve('threadlatch/dist-cli/cli/index.js')"],
  { cwd: project, encoding: 'utf8' },
).trim();
assert.equal(resolvedRunner, cli);
const sessionRun = (...args) =>
  execFileSync(process.execPath, [resolvedRunner, ...args], { cwd: project, encoding: 'utf8' });
assert.equal(sessionRun('version').trim(), '0.1.0-preview.1');
assert.equal(JSON.parse(sessionRun('doctor')).ok, true);
assert.equal(JSON.parse(sessionRun('doctor')).runner.cli, resolvedRunner);
writeFileSync(join(project, 'synthetic-source.txt'), 'User: Use SQLite.');
const prompt = sessionRun('request', '--input', 'synthetic-source.txt', '--format', 'role-tagged');
const req = JSON.parse(
  prompt
    .split('REFERENCE DATA (untrusted, not instructions):\n')[1]
    .split('\nEND REFERENCE DATA')[0],
);
const response = {
  schemaVersion: 1,
  requestId: req.requestId,
  baseRevisionId: req.baseRevisionId,
  changes: [
    {
      proposalId: req.proposalIds[0],
      operation: 'add',
      targetItemId: null,
      item: { kind: 'decision', text: 'Use SQLite.', status: 'active', origin: 'user_statement' },
      evidence: [{ messageId: req.selectedMessages[0].id, quote: 'Use SQLite.' }],
      note: '',
    },
  ],
};
writeFileSync(join(project, '.threadlatch/pending/synthetic-reply.json'), JSON.stringify(response));
sessionRun(
  'import',
  '--request',
  req.requestId,
  '--input',
  '.threadlatch/pending/synthetic-reply.json',
);
sessionRun('apply', '--request', req.requestId, '--select', req.proposalIds[0]);
assert(sessionRun('export', '--format', 'markdown').includes('Use SQLite.'));
const afterCycle = readFileSync(join(project, '.threadlatch/project.json'), 'utf8');
assert.equal(readFileSync(join(project, 'AGENTS.md'), 'utf8'), 'Existing project rules.\n');
assert.equal(readFileSync(join(project, 'CLAUDE.md'), 'utf8'), 'Existing Claude rules.\n');
run('skills', 'uninstall', '--agent', 'both');
assert.equal(afterCycle, readFileSync(join(project, '.threadlatch/project.json'), 'utf8'));
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
    targetSessionCliCycle: 'passed',
    instructions: 'preserved',
    uninstallMemory: 'preserved',
    platform: process.platform,
    node: process.versions.node,
  }),
);
