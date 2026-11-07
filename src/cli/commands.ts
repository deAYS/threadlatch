import { basename } from 'node:path';
import { mkdir } from 'node:fs/promises';
import {
  FileProjectRepository,
  projectDirectory,
  readProjectInput,
  safePath,
  atomicWrite,
  withProjectLock,
} from '../storage/file-projects.js';
import { currentRevision, parseArchive, serializeArchive } from '../core/schema.js';
import { parseTranscript, finalizeImport } from '../import/parse-transcript.js';
import { buildAnalysisPrompt } from '../analysis/prompt.js';
import {
  addConversationRequest,
  reanalyzeRequest,
  importProposals,
  applyProposals,
  appendRevision,
} from '../core/workflow.js';
import { proposeDiff } from '../core/propose-diff.js';
import { buildHandoff } from '../export/handoff.js';
import { manualEdit, restoreSnapshot, resolveConflict } from '../core/apply-changes.js';
import { installSkills, removeSkills, VERSION, type Agent } from '../agents/install-skills.js';
import { inspectSetup, supportedRuntime } from '../agents/doctor.js';
import { setup } from '../agents/setup.js';
import { instructionHint } from '../agents/instruction-hints.js';
import { WorkflowError } from '../core/errors.js';
export type CliIO = {
  cwd: string;
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  stdin?: () => Promise<string>;
  ask?: (question: string) => Promise<string>;
};
const help = `ThreadLatch ${VERSION} (preview)\nsetup --agent codex|claude-code|both [--project DIR]\ndoctor | status | init [--title TITLE]\nrequest --input FILE|- --format plain|role-tagged [--items ID,ID]\nrequest --retry REQUEST-ID [--items ID,ID]\nimport --request ID --input FILE|-\napply --request ID --select ID,ID\nexport --format markdown|json [--budget 8000|24000]\nrestore --input BACKUP.json (empty memory directory only)\nhistory | restore-revision --revision ID\nresolve-conflict --conflict ID --note TEXT\nedit --item ID [--text TEXT] [--pinned true|false] [--status active|proposed|rejected|resolved]\nskills install|uninstall --agent codex|claude-code|both\nAll commands accept --project DIR. Source files must be inside the selected project. No network calls.\n`;
export async function runCli(argv: string[], io: CliIO): Promise<number> {
  const out = (s: string) => io.stdout(s + (s.endsWith('\n') ? '' : '\n'));
  try {
    const args = [...argv],
      command = args.shift() ?? 'help',
      sub = command === 'skills' ? args.shift() : undefined;
    const flags = new Map<string, string>();
    while (args.length) {
      const key = args.shift()!,
        value = args.shift();
      if (!key.startsWith('--') || !value || value.startsWith('--') || flags.has(key))
        throw new Error('Invalid options. Run threadlatch help.');
      flags.set(key, value);
    }
    const options: Record<string, string[]> = {
      init: ['--title'],
      setup: ['--title', '--agent', '--output'],
      skills: ['--agent', '--output'],
      request: ['--input', '--format', '--items', '--retry'],
      import: ['--request', '--input'],
      apply: ['--request', '--select'],
      export: ['--format', '--budget', '--items'],
      restore: ['--input'],
      'restore-revision': ['--revision'],
      edit: ['--item', '--text', '--pinned', '--status'],
      'resolve-conflict': ['--conflict', '--note'],
      history: [],
      status: [],
      doctor: ['--output'],
      repair: ['--request'],
      help: [],
      version: [],
      '--help': [],
      '--version': [],
    };
    if (
      !options[command] ||
      [...flags.keys()].some((key) => key !== '--project' && !options[command].includes(key))
    )
      throw new Error('Unknown command or option. Run threadlatch help.');
    if (command === 'help' || command === '--help') {
      out(
        help +
          'repair [--request ID] (rebuild auxiliary files from canonical memory)\ndoctor | setup | skills accept --output json|human (default json)\n',
      );
      return 0;
    }
    if (command === '--version' || command === 'version') {
      out(VERSION);
      return 0;
    }
    const root = projectDirectory(io.cwd, flags.get('--project')),
      repo = new FileProjectRepository();
    const outputFormat = flags.get('--output') ?? 'json';
    if (!['json', 'human'].includes(outputFormat)) throw new Error('Use --output json|human.');
    const readInput = async (limit = 1_048_576) => {
      const input = flags.get('--input');
      if (!input) throw new Error('Specify --input FILE or --input - for stdin.');
      const raw =
        input === '-' && io.stdin ? await io.stdin() : await readProjectInput(root, input, limit);
      if (new TextEncoder().encode(raw).length > limit)
        throw new Error('Input size limit exceeded.');
      return raw;
    };
    const agents = async (): Promise<Agent[]> => {
      let value = flags.get('--agent');
      if (!value && io.ask)
        value = (await io.ask('Choose an agent: codex, claude-code, or both: ')).trim();
      if (!value || !['codex', 'claude-code', 'both'].includes(value))
        throw new Error('Specify --agent codex|claude-code|both. No setup changes made.');
      return value === 'both' ? ['codex', 'claude-code'] : [value as Agent];
    };
    if (command === 'doctor') {
      const report = await inspectSetup(root);
      out(
        outputFormat === 'json'
          ? JSON.stringify(report, null, 2)
          : `${report.ok ? 'Ready' : 'Needs attention'} · ThreadLatch ${report.version}\n${report.checks.map((c) => `${c.ok ? 'OK' : 'CHECK'} ${c.name}`).join('\n')}\nNext: ${report.nextAction}`,
      );
      return report.ok ? 0 : 2;
    }
    const targets = command === 'setup' || command === 'skills' ? await agents() : [];
    if (!supportedRuntime())
      throw new Error('Use Node.js 22.x, at least 22.12.0. No memory changes made.');
    if (command === 'setup' || command === 'skills') {
      const report =
        command === 'setup'
          ? await setup(root, targets, flags.get('--title') ?? basename(root))
          : sub === 'install'
            ? await installSkills(root, targets)
            : sub === 'uninstall'
              ? await removeSkills(root, targets)
              : (() => {
                  throw new Error('Use skills install or skills uninstall.');
                })();
      const inspection = command === 'setup' || sub === 'install' ? await inspectSetup(root) : null;
      const nextAction = report.conflicts.length
        ? 'Preserve and reconcile the conflicting skill files listed above, then rerun setup or skills install.'
        : (inspection?.nextAction ?? 'Skills removed; project memory is preserved.');
      const ready = !report.conflicts.length && (!inspection || inspection.ok);
      out(
        outputFormat === 'json'
          ? JSON.stringify({ ...report, nextAction }, null, 2)
          : `${ready ? 'Completed' : 'Needs attention'} · ${report.changed.length} files changed, ${report.conflicts.length} conflicts\nNext: ${nextAction}`,
      );
      // Install success retains its exit contract; readiness is reported by doctor.
      return report.conflicts.length ? 2 : 0;
    }
    if (command === 'init') {
      const a = await repo.init(root, flags.get('--title') ?? basename(root));
      out(`Initialized ${a.project.id}\n${instructionHint}`);
      return 0;
    }
    if (command === 'restore') {
      const a = parseArchive(await readInput(10 * 1_048_576));
      await repo.init(root, a.project.title, a);
      out('Restored full archive. Existing project memory is never replaced.');
      return 0;
    }
    const a = await repo.load(root, command !== 'status'),
      current = currentRevision(a);
    const writePending = async (
      requestId: string,
      kind: 'request' | 'proposal',
      value: unknown,
    ) => {
      await mkdir(await safePath(root, '.threadlatch/pending'), { recursive: true, mode: 0o700 });
      await atomicWrite(
        await safePath(root, `.threadlatch/pending/${requestId}.${kind}.json`),
        JSON.stringify(value, null, 2),
      );
    };
    const auxiliaryAfterCommit = async (
      requestId: string,
      kind: 'request' | 'proposal',
      value: unknown,
    ) => {
      try {
        await writePending(requestId, kind, value);
      } catch {
        io.stderr(
          `Warning: ${kind} committed to .threadlatch/project.json; auxiliary file could not be written. Do not repeat the operation. Preserve and clear any obstruction, then run threadlatch repair --project ${JSON.stringify(root)} --request ${requestId}. Canonical memory is intact.\n`,
        );
      }
    };
    if (command === 'repair') {
      const requestedId = flags.get('--request');
      await withProjectLock(root, async () => {
        const fresh = await repo.load(root, false);
        if (requestedId && !fresh.requests.some((r) => r.requestId === requestedId))
          throw new Error('Unknown request.');
        for (const req of fresh.requests.filter(
          (r) => !requestedId || r.requestId === requestedId,
        )) {
          await writePending(req.requestId, 'request', req);
          const batch = fresh.proposals.find((b) => b.requestId === req.requestId);
          if (batch) await writePending(req.requestId, 'proposal', batch);
          if (requestedId) out(buildAnalysisPrompt(req));
        }
      });
      out(
        'Repaired auxiliary files from canonical memory. No new request, proposal or revision was created.',
      );
      return 0;
    }
    if (command === 'status') {
      out(
        JSON.stringify(
          {
            version: VERSION,
            projectId: a.project.id,
            revision: current.id,
            generation: a.project.generation,
            items: current.items.length,
            conversations: a.conversations.length,
            requests: a.requests.length,
          },
          null,
          2,
        ),
      );
      return 0;
    }
    if (command === 'history') {
      out(
        JSON.stringify(
          a.revisions.map((r) => ({
            id: r.id,
            parent: r.parentRevisionId,
            actor: r.actor,
            createdAt: r.createdAt,
          })),
          null,
          2,
        ),
      );
      return 0;
    }
    if (command === 'export') {
      const format = flags.get('--format');
      if (format === 'json') out(serializeArchive(a));
      else if (format === 'markdown') {
        const budget = Number(flags.get('--budget') ?? 8000);
        if (budget !== 8000 && budget !== 24000) throw new Error('Budget must be 8000 or 24000.');
        const result = buildHandoff(current, {
          maxCodePoints: budget,
          includeEvidence: true,
          itemIds: flags.has('--items')
            ? flags.get('--items')!.split(',').filter(Boolean)
            : undefined,
        });
        if (!result.ok) throw new Error(result.error);
        out(result.text);
      } else throw new Error('Specify --format markdown|json.');
      return 0;
    }
    if (command === 'request') {
      const format = flags.get('--format') ?? 'plain';
      if (format !== 'plain' && format !== 'role-tagged')
        throw new Error('Unknown transcript format.');
      const items = flags.has('--items')
        ? flags.get('--items')!.split(',').filter(Boolean)
        : undefined;
      if (flags.has('--retry') && flags.has('--input'))
        throw new Error('Use --retry or --input, not both.');
      const prepared = flags.has('--retry')
        ? reanalyzeRequest(a, flags.get('--retry')!, items)
        : addConversationRequest(
            a,
            await finalizeImport(
              parseTranscript(await readInput(), format),
              a.project.id,
              current.id,
            ),
            undefined,
            items,
          );
      await repo.save(root, current.id, prepared.archive);
      await auxiliaryAfterCommit(prepared.request.requestId, 'request', prepared.request);
      out(buildAnalysisPrompt(prepared.request));
      return 0;
    }
    const requestId = flags.get('--request');
    if (command === 'import') {
      if (!requestId) throw new Error('Specify --request ID.');
      const result = importProposals(a, requestId, await readInput());
      await repo.save(root, current.id, result.archive);
      await auxiliaryAfterCommit(requestId, 'proposal', result.result.batch);
      out(JSON.stringify(proposeDiff(current, result.result.batch), null, 2));
      out('Source matched only; review meaning before saving.');
      return 0;
    }
    if (command === 'apply') {
      if (!requestId || !flags.get('--select'))
        throw new Error('Specify --request ID and explicit --select ID,ID.');
      const next = applyProposals(a, requestId, flags.get('--select')!.split(','));
      await repo.save(root, current.id, next);
      out(`Saved revision ${next.project.currentRevisionId}`);
      return 0;
    }
    if (command === 'restore-revision') {
      const selected = a.revisions.find((r) => r.id === flags.get('--revision'));
      if (!selected) throw new Error('Unknown revision.');
      const next = appendRevision(a, restoreSnapshot(current, selected));
      await repo.save(root, current.id, next);
      out(`Restored as new revision ${next.project.currentRevisionId}`);
      return 0;
    }
    if (command === 'resolve-conflict') {
      const next = appendRevision(
        a,
        resolveConflict(current, flags.get('--conflict') ?? '', flags.get('--note') ?? ''),
      );
      await repo.save(root, current.id, next);
      out(`Reconciled in manual revision ${next.project.currentRevisionId}`);
      return 0;
    }
    if (command === 'edit') {
      const itemId = flags.get('--item');
      if (!itemId) throw new Error('Specify --item ID.');
      const pinned = flags.get('--pinned'),
        status = flags.get('--status');
      if (
        (pinned && !['true', 'false'].includes(pinned)) ||
        (status && !['active', 'proposed', 'rejected', 'resolved'].includes(status))
      )
        throw new Error('Invalid manual edit.');
      if (!flags.has('--text') && !pinned && !status) throw new Error('Select an explicit edit.');
      const next = appendRevision(
        a,
        manualEdit(current, itemId, {
          text: flags.get('--text'),
          pinned: pinned ? pinned === 'true' : undefined,
          status: status as 'active' | 'proposed' | 'rejected' | 'resolved' | undefined,
        }),
      );
      await repo.save(root, current.id, next);
      out(`Saved manual revision ${next.project.currentRevisionId}`);
      return 0;
    }
    throw new Error('Unknown command. Run threadlatch help.');
  } catch (e) {
    const err = e as NodeJS.ErrnoException,
      ioFailure = e instanceof WorkflowError ? e.code === 'project_lock' : Boolean(err.code);
    io.stderr(
      (ioFailure && err.code && !(e instanceof WorkflowError)
        ? `File operation failed (${err.code}). Check project paths and permissions.`
        : err.message || 'Operation failed.') + '\n',
    );
    return ioFailure ? 3 : 2;
  }
}
