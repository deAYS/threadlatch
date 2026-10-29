import { useEffect, useRef, useState } from 'react';
import {
  createProject,
  currentRevision,
  parseArchive,
  serializeArchive,
  type ProjectArchive,
  type MemoryItem,
} from '../core/schema.js';
import { BrowserProjectRepository } from '../storage/projects.js';
import { cloneArchive } from '../storage/archive.js';
import { parseTranscript, finalizeImport, type ImportDraft } from '../import/parse-transcript.js';
import {
  addConversationRequest,
  reanalyzeRequest,
  importProposals,
  applyProposals,
  appendRevision,
} from '../core/workflow.js';
import { buildAnalysisPrompt } from '../analysis/prompt.js';
import { proposeDiff } from '../core/propose-diff.js';
import { manualEdit, restoreSnapshot, resolveConflict } from '../core/apply-changes.js';
import { buildHandoff } from '../export/handoff.js';
import { dictionaries, type Language, type TranslationKey } from '../i18n/index.js';
import { createOperationQueue } from './operation-queue.js';
const repo = new BrowserProjectRepository();
type View = 'memory' | 'review' | 'sources' | 'export' | 'import';
function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function exampleProject() {
  const a = createProject('Fieldnotes · synthetic example');
  const c = await finalizeImport(
    parseTranscript(
      'User: Keep all project memory on this device.\nAssistant: We could add cloud sync later.\nUser: Which format should the handoff use?',
      'role-tagged',
    ),
    a.project.id,
    a.project.currentRevisionId,
  );
  const prepared = addConversationRequest(a, c),
    req = prepared.request;
  const changes = [
    {
      kind: 'constraint',
      text: 'Keep project memory on this device.',
      status: 'active',
      origin: 'user_statement',
    },
    {
      kind: 'context',
      text: 'Cloud sync is a suggestion for later.',
      status: 'proposed',
      origin: 'assistant_suggestion',
    },
    {
      kind: 'open_question',
      text: 'Which format should the handoff use?',
      status: 'active',
      origin: 'user_statement',
    },
  ].map((item, i) => ({
    proposalId: req.proposalIds[i],
    operation: 'add',
    targetItemId: null,
    item,
    evidence: [{ messageId: c.messages[i].id, quote: c.messages[i].text }],
    note: '',
  }));
  const imported = importProposals(
    prepared.archive,
    req.requestId,
    JSON.stringify({
      schemaVersion: 1,
      requestId: req.requestId,
      baseRevisionId: req.baseRevisionId,
      changes,
    }),
  );
  return applyProposals(imported.archive, req.requestId, req.proposalIds.slice(0, 3));
}
export function App() {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem('threadlatch-language') === 'tr' ? 'tr' : 'en',
  );
  const t = (key: TranslationKey) => dictionaries[language][key];
  const label = (value: string) => (value in dictionaries.en ? t(value as TranslationKey) : value);
  const [projects, setProjects] = useState<ProjectArchive[]>([]),
    [archive, setArchive] = useState<ProjectArchive | null>(null);
  const [view, setView] = useState<View>('memory'),
    [projectName, setProjectName] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  const [source, setSource] = useState(''),
    [format, setFormat] = useState<ImportDraft['format']>('plain'),
    [draft, setDraft] = useState<ImportDraft | null>(null),
    [base, setBase] = useState('');
  const [included, setIncluded] = useState<number[]>([]),
    [cursors, setCursors] = useState<Record<number, number>>({});
  const [requestId, setRequestId] = useState(''),
    [resultRaw, setResultRaw] = useState(''),
    [selected, setSelected] = useState<string[]>([]),
    [showInactive, setShowInactive] = useState(false);
  const [budget, setBudget] = useState<8000 | 24000>(8000),
    [includeEvidence, setIncludeEvidence] = useState(false),
    [editItem, setEditItem] = useState<MemoryItem | null>(null),
    [editText, setEditText] = useState('');
  const [editStatus, setEditStatus] = useState<MemoryItem['status']>('proposed'),
    [memoryScope, setMemoryScope] = useState<string[] | null>(null);
  const [handoffScope, setHandoffScope] = useState<string[] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [enqueue] = useState(() => createOperationQueue());
  const pendingOperations = useRef(0);
  const revision = archive ? currentRevision(archive) : null;
  const request = archive?.requests.find((r) => r.requestId === requestId),
    batch = archive?.proposals.find((b) => b.requestId === requestId);
  const diff = revision && batch ? proposeDiff(revision, batch) : [];
  const handoff = revision
    ? buildHandoff(revision, {
        maxCodePoints: budget,
        includeEvidence,
        itemIds: handoffScope ?? undefined,
      })
    : null;
  function choose(a: ProjectArchive) {
    setArchive(a);
    localStorage.setItem('threadlatch-project', a.project.id);
    setBase(a.project.currentRevisionId);
    setRequestId(a.requests.at(-1)?.requestId ?? '');
    setSelected([]);
    setResultRaw('');
    setDraft(null);
    setMemoryScope(null);
    setHandoffScope(null);
    setView('memory');
  }
  async function refresh(activeId?: string) {
    const all = await repo.list();
    setProjects(all);
    const active = all.find(
      (a) => a.project.id === (activeId ?? localStorage.getItem('threadlatch-project')),
    );
    if (active) choose(active);
    else if (all.length && activeId === undefined) choose(all[0]);
    else setArchive(null);
  }
  async function perform(work: () => Promise<void>) {
    pendingOperations.current++;
    setBusy(true);
    await enqueue(async () => {
      setError('');
      setNotice('');
      try {
        await work();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Operation failed.');
      } finally {
        pendingOperations.current--;
        if (!pendingOperations.current) setBusy(false);
      }
    });
  }
  async function commit(next: ProjectArchive) {
    if (!archive) return;
    const revisionChanged = next.project.currentRevisionId !== archive.project.currentRevisionId;
    await repo.save(next, archive.project.currentRevisionId);
    setArchive(next);
    setProjects((previous) => previous.map((p) => (p.project.id === next.project.id ? next : p)));
    setNotice(t(revisionChanged ? 'saved' : 'pendingSaved'));
  }
  useEffect(() => {
    void perform(() => refresh());
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('threadlatch-language', language);
  }, [language]);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(t('copied'));
    } catch {
      setNotice(
        language === 'tr'
          ? 'Aşağıdaki metni seçip elle kopyala.'
          : 'Select the text below and copy it manually.',
      );
    }
  }
  async function importBackup(file?: File) {
    if (!file) return;
    await perform(async () => {
      if (file.size > 10 * 1_048_576) throw new Error('Backup exceeds 10 MiB.');
      let a = parseArchive(await file.text());
      if (await repo.load(a.project.id)) a = await cloneArchive(a);
      await repo.create(a);
      await refresh(a.project.id);
      setNotice(t('imported'));
    });
  }
  function startSource() {
    setView('import');
    setDraft(null);
    setSource('');
    setBase(archive!.project.currentRevisionId);
    setResultRaw('');
  }
  const sourceQuotes = (item: MemoryItem) =>
    item.evidence.map((e, n) => (
      <div key={n} className="source-quote">
        <blockquote>{e.quote}</blockquote>
        <button
          className="text-button"
          onClick={() => {
            setView('sources');
            setTimeout(() => document.getElementById('source-' + e.messageId)?.scrollIntoView(), 0);
          }}
        >
          {t('showSource')} · {e.messageId.slice(0, 8)}
        </button>
      </div>
    ));
  const actionable =
    revision?.items.filter((i) => i.status === 'active' || i.status === 'proposed') ?? [];
  const scopePicker = (
    title: TranslationKey,
    scope: string[] | null,
    setScope: (ids: string[] | null) => void,
  ) => (
    <details className="memory-scope">
      <summary>
        {t(title)} · {scope?.length ?? actionable.length}/{actionable.length}
      </summary>
      <button onClick={() => setScope(null)}>{t('allMemory')}</button>
      {actionable.map((item) => (
        <label key={item.id} className="check-line">
          <input
            type="checkbox"
            checked={scope === null || scope.includes(item.id)}
            onChange={(e) => {
              const ids = scope ?? actionable.map((i) => i.id);
              setScope(e.target.checked ? [...ids, item.id] : ids.filter((mid) => mid !== item.id));
            }}
          />
          {item.text}
        </label>
      ))}
    </details>
  );
  const scopeControls = scopePicker('memoryScope', memoryScope, setMemoryScope);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">
        {t('skip')}
      </a>
      <aside className="sidebar" aria-label="ThreadLatch">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ╋
          </span>
          <span>
            ThreadLatch<span className="brand-sub">PROJECT MEMORY</span>
          </span>
        </div>
        <span className="preview-badge">{t('previewBadge')}</span>
        <div className="project-picker">
          <label htmlFor="project-picker">{t('project')}</label>
          <select
            id="project-picker"
            value={archive?.project.id ?? ''}
            onChange={(e) => {
              const a = projects.find((p) => p.project.id === e.target.value);
              if (a) choose(a);
              else {
                setArchive(null);
                setView('memory');
              }
            }}
          >
            <option value="">{t('noProjects')}</option>
            {projects.map((p) => (
              <option key={p.project.id} value={p.project.id}>
                {p.project.title}
              </option>
            ))}
          </select>
        </div>
        <nav aria-label={t('projection')}>
          {(['memory', 'review', 'sources', 'export'] as const).map((v, i) => (
            <button
              type="button"
              key={v}
              disabled={!archive}
              aria-current={view === v ? 'page' : undefined}
              onClick={() => {
                setView(v);
                setError('');
              }}
            >
              <span aria-hidden="true">0{i + 1}</span>
              {t(v)}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p className="local-note">
            <span className="status-dot" />
            {t('local')}
          </p>
          <label htmlFor="language">{t('language')}</label>
          <select
            id="language"
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
          </select>
          <p className="privacy-note">{t('privacy')}</p>
        </div>
      </aside>
      <main id="content" className="workspace" aria-busy={busy}>
        <header className="workspace-top">
          <span>{archive?.project.title ?? 'ThreadLatch / Workspace'}</span>
          <span className="mono">
            {revision ? 'REV ' + revision.id.slice(0, 8) : 'v0.1 preview'}
          </span>
        </header>
        {error && (
          <div className="error-box" role="alert">
            <strong>{t('error')}</strong>
            <p>{error}</p>
            <button onClick={() => void perform(() => refresh(archive?.project.id))}>
              {t('reload')}
            </button>
          </div>
        )}
        <div role="status" className="notice">
          {notice}
        </div>
        {!archive ? (
          <section className="welcome">
            <span className="eyebrow">SOURCE-LINKED / LOCAL / PORTABLE</span>
            <h1>{t('emptyTitle')}</h1>
            <p className="lede">{t('subtitle')}</p>
            <p>{t('welcomeAction')}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void perform(async () => {
                  const a = createProject(projectName.trim());
                  await repo.create(a);
                  await refresh(a.project.id);
                });
              }}
            >
              <label htmlFor="project-name">{t('projectName')}</label>
              <div className="inline-form">
                <input
                  id="project-name"
                  required
                  maxLength={300}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={language === 'tr' ? 'Bir sonraki projem' : 'My next project'}
                />
                <button className="primary" disabled={busy}>
                  {t('create')}
                </button>
              </div>
            </form>
            <div className="welcome-actions">
              <button
                className="secondary"
                onClick={() =>
                  void perform(async () => {
                    const a = await exampleProject();
                    await repo.create(a);
                    await refresh(a.project.id);
                  })
                }
              >
                {t('example')} <span aria-hidden="true">↗</span>
              </button>
              <label className="file-button">
                {t('importBackup')}
                <input
                  type="file"
                  disabled={busy}
                  accept=".json,application/json"
                  aria-label={t('importBackup')}
                  onChange={(e) => void importBackup(e.target.files?.[0])}
                />
              </label>
            </div>
            <div className="welcome-strip">
              <span>01 · {t('addSource')}</span>
              <span>02 · {t('review')}</span>
              <span>03 · {t('export')}</span>
            </div>
          </section>
        ) : (
          <>
            <section className="page-heading">
              <div>
                <span className="eyebrow">{t('projection')}</span>
                <h1>{view === 'import' ? t('addSource') : t(view)}</h1>
              </div>
              <button
                className="primary"
                aria-label={t('addSource')}
                disabled={busy}
                onClick={startSource}
              >
                <span aria-hidden="true">+ </span>
                {t('addSource')}
              </button>
            </section>
            <div className="metrics">
              <span>
                <strong>{revision!.items.filter((i) => i.status === 'active').length}</strong>{' '}
                {t('active')}
              </span>
              <span>
                <strong>{archive.conversations.length}</strong> {t('sourcesCount')}
              </span>
              <span>
                <strong>{archive.revisions.length}</strong> {t('revisionCount')}
              </span>
              <span className="mono subtle">
                {t('latest')} / {revision!.createdAt.slice(0, 10)}
              </span>
            </div>
            {view === 'memory' && (
              <section>
                <label className="check-line">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                  {t('showInactive')}
                </label>
                {!revision!.items.length && (
                  <div className="empty-state">
                    <h2>{t('noMemory')}</h2>
                    <p>{t('firstStep')}</p>
                  </div>
                )}
                <div className="memory-list">
                  {revision!.items
                    .filter((i) => showInactive || ['active', 'proposed'].includes(i.status))
                    .map((item, index) => (
                      <article
                        key={item.id}
                        className={'memory-item ' + item.status}
                        data-testid="memory-item"
                      >
                        <div className="item-number mono">{String(index + 1).padStart(2, '0')}</div>
                        <div className="item-body">
                          <div className="item-meta">
                            <span className="kind">{label(item.kind)}</span>
                            <span className={'pill ' + item.status}>{label(item.status)}</span>
                            <span>{label(item.origin)}</span>
                            {item.pinned && <span>● {t('pin')}</span>}
                          </div>
                          <h2>{item.text}</h2>
                          {item.origin === 'manual' && (
                            <p className="subtle">{t('manualNotice')}</p>
                          )}
                          <details>
                            <summary>
                              {t('sourceDetails')} · {item.evidence.length}
                            </summary>
                            {sourceQuotes(item)}
                          </details>
                          <div className="item-actions">
                            <button
                              onClick={() => {
                                setEditItem(item);
                                setEditText(item.text);
                                setEditStatus(item.status);
                              }}
                            >
                              {t('manualEdit')}
                            </button>
                            <button
                              onClick={() =>
                                void perform(() =>
                                  commit(
                                    appendRevision(
                                      archive,
                                      manualEdit(revision!, item.id, { pinned: !item.pinned }),
                                    ),
                                  ),
                                )
                              }
                            >
                              {item.pinned ? t('unpin') : t('pin')}
                            </button>
                          </div>
                          {editItem?.id === item.id && (
                            <form
                              className="edit-form"
                              onSubmit={(e) => {
                                e.preventDefault();
                                void perform(async () => {
                                  await commit(
                                    appendRevision(
                                      archive,
                                      manualEdit(revision!, item.id, {
                                        text: editText,
                                        status: editStatus,
                                      }),
                                    ),
                                  );
                                  setEditItem(null);
                                });
                              }}
                            >
                              <label htmlFor="edit-text">{t('itemText')}</label>
                              <textarea
                                id="edit-text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                required
                              />
                              <label htmlFor="edit-status">{t('status')}</label>
                              <select
                                id="edit-status"
                                value={editStatus}
                                onChange={(e) =>
                                  setEditStatus(e.target.value as MemoryItem['status'])
                                }
                              >
                                {(['active', 'proposed', 'rejected', 'resolved'] as const).map(
                                  (s) => (
                                    <option key={s} value={s}>
                                      {label(s)}
                                    </option>
                                  ),
                                )}
                              </select>
                              <button className="primary">{t('saveEdit')}</button>
                              <button type="button" onClick={() => setEditItem(null)}>
                                {t('cancel')}
                              </button>
                            </form>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
                {revision!.conflicts
                  .filter((c) => !c.resolved)
                  .map((c) => (
                    <article className="conflict-panel" key={c.id}>
                      <h2>{t('conflict')}</h2>
                      <p>{c.note}</p>
                      {c.evidence.map((e, i) => (
                        <blockquote key={i}>{e.quote}</blockquote>
                      ))}
                      <button
                        onClick={() =>
                          void perform(async () => {
                            const next = resolveConflict(
                              revision!,
                              c.id,
                              language === 'tr'
                                ? 'Kullanıcı çelişkiyi çözüldü işaretledi; mevcut madde metinleri korundu.'
                                : 'User marked conflict resolved; existing item wording retained.',
                            );
                            await commit(appendRevision(archive, next));
                          })
                        }
                      >
                        {t('resolveConflict')}
                      </button>
                    </article>
                  ))}
              </section>
            )}
            {view === 'import' && (
              <section className="flow-panel">
                <p className="lede small">{t('sourceHelp')}</p>
                <label className="file-button">
                  {t('sourceFile')}
                  <input
                    type="file"
                    disabled={busy}
                    accept=".txt,.md,text/plain,text/markdown"
                    aria-label={t('sourceFile')}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        void perform(async () => {
                          if (f.size > 1_048_576) throw new Error('Source size exceeds 1 MiB.');
                          setSource(await f.text());
                          setDraft(null);
                        });
                    }}
                  />
                </label>
                <label htmlFor="source-text">{t('conversationText')}</label>
                <textarea
                  id="source-text"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setDraft(null);
                  }}
                  rows={9}
                  spellCheck={false}
                />
                <div className="form-row">
                  <div>
                    <label htmlFor="format">{t('format')}</label>
                    <select
                      id="format"
                      value={format}
                      onChange={(e) => {
                        setFormat(e.target.value as ImportDraft['format']);
                        setDraft(null);
                      }}
                    >
                      <option value="plain">{t('plain')}</option>
                      <option value="role-tagged">{t('tagged')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="base">{t('base')}</label>
                    <select id="base" value={base} onChange={(e) => setBase(e.target.value)}>
                      {archive.revisions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id.slice(0, 8)} · {r.createdAt.slice(0, 16)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      const d = parseTranscript(source, format);
                      setDraft(d);
                      setIncluded(d.messages.map((_, i) => i));
                    })
                  }
                >
                  {t('preview')}
                </button>
                {draft && (
                  <div className="source-preview">
                    {draft.warnings.map((w) => (
                      <p className="subtle" key={w}>
                        {w}
                      </p>
                    ))}
                    {draft.messages.map((m, i) => (
                      <div className="draft-message" key={i}>
                        <div className="form-row">
                          <label className="check-line">
                            <input
                              type="checkbox"
                              checked={included.includes(i)}
                              onChange={(e) =>
                                setIncluded(
                                  e.target.checked
                                    ? [...included, i]
                                    : included.filter((n) => n !== i),
                                )
                              }
                            />
                            #{i + 1}
                          </label>
                          <label>
                            {t('role')} {i + 1}
                            <select
                              value={m.role}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  messages: draft.messages.map((x, n) =>
                                    n === i ? { ...x, role: e.target.value as typeof m.role } : x,
                                  ),
                                })
                              }
                            >
                              <option value="user">{t('user')}</option>
                              <option value="assistant">{t('assistant')}</option>
                              <option value="unknown">{t('unknown')}</option>
                            </select>
                          </label>
                        </div>
                        <textarea
                          aria-label={`Message ${i + 1}`}
                          value={m.text}
                          onSelect={(e) =>
                            setCursors({ ...cursors, [i]: e.currentTarget.selectionStart })
                          }
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              messages: draft.messages.map((x, n) =>
                                n === i ? { ...x, text: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <button
                          disabled={!cursors[i] || cursors[i] >= m.text.length}
                          onClick={() => {
                            const at = cursors[i];
                            const messages = [...draft.messages];
                            messages.splice(
                              i,
                              1,
                              { ...m, text: m.text.slice(0, at) },
                              { ...m, text: m.text.slice(at) },
                            );
                            setDraft({ ...draft, messages });
                            setIncluded(messages.map((_, n) => n));
                          }}
                        >
                          {t('split')}
                        </button>
                      </div>
                    ))}
                    {scopeControls}
                    <p className="subtle">{t('requestLimit')}</p>
                    <button
                      className="primary"
                      disabled={busy || !included.length}
                      onClick={() =>
                        void perform(async () => {
                          const c = await finalizeImport(draft, archive.project.id, base);
                          const prepared = addConversationRequest(
                            archive,
                            c,
                            c.messages.filter((_, i) => included.includes(i)).map((m) => m.id),
                            memoryScope ?? undefined,
                          );
                          await commit(prepared.archive);
                          setRequestId(prepared.request.requestId);
                          setView('review');
                          setSelected([]);
                        })
                      }
                    >
                      {t('prepare')}
                    </button>
                  </div>
                )}
              </section>
            )}
            {view === 'review' && (
              <section className="flow-panel">
                <p className="lede small">{t('bridgeHelp')}</p>
                <label htmlFor="pending">{t('pending')}</label>
                <select
                  id="pending"
                  value={requestId}
                  onChange={(e) => {
                    setRequestId(e.target.value);
                    setSelected([]);
                  }}
                >
                  {archive.requests.map((r) => (
                    <option key={r.requestId} value={r.requestId}>
                      {r.requestId.slice(0, 8)} · {r.baseRevisionId.slice(0, 8)}
                    </option>
                  ))}
                </select>
                {request ? (
                  <>
                    <label htmlFor="analysis-request">{t('analysisRequest')}</label>
                    <p className="subtle">
                      {t('excludedHistory')}: {request.excludedHistoryCount}
                    </p>
                    {request.omittedItemIds.length > 0 && (
                      <p className="mono">
                        {t('omittedMemory')}: {request.omittedItemIds.join(', ')}
                      </p>
                    )}
                    {scopeControls}
                    <button
                      disabled={busy}
                      onClick={() =>
                        void perform(async () => {
                          const retry = reanalyzeRequest(
                            archive,
                            requestId,
                            memoryScope ?? undefined,
                          );
                          await commit(retry.archive);
                          setRequestId(retry.request.requestId);
                          setSelected([]);
                          setResultRaw('');
                        })
                      }
                    >
                      {t('retryAnalysis')}
                    </button>
                    <textarea
                      id="analysis-request"
                      readOnly
                      rows={7}
                      value={buildAnalysisPrompt(request)}
                      spellCheck={false}
                    />
                    <button onClick={() => void copy(buildAnalysisPrompt(request))}>
                      {t('copy')}
                    </button>
                    {!batch && (
                      <>
                        <label htmlFor="analysis-result">{t('analysisResult')}</label>
                        <textarea
                          id="analysis-result"
                          rows={8}
                          value={resultRaw}
                          onChange={(e) => setResultRaw(e.target.value)}
                          spellCheck={false}
                        />
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() =>
                            void perform(async () => {
                              const imported = importProposals(archive, requestId, resultRaw);
                              await commit(imported.archive);
                              setSelected([]);
                            })
                          }
                        >
                          {t('validate')}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <p>{t('noChanges')}</p>
                )}
                {batch && (
                  <div className="review-diff">
                    <div className="review-toolbar">
                      <span>
                        {diff.length} {t('changeCount')}
                      </span>
                      <button
                        onClick={() =>
                          setSelected(diff.filter((d) => d.selectable).map((d) => d.proposalId))
                        }
                      >
                        {t('selectSafe')}
                      </button>
                    </div>
                    {diff.map((d) => (
                      <article key={d.proposalId} className="diff-item">
                        <label className="check-line">
                          <input
                            type="checkbox"
                            disabled={Boolean(d.blocked)}
                            checked={selected.includes(d.proposalId)}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? [...selected, d.proposalId]
                                  : selected.filter((s) => s !== d.proposalId),
                              )
                            }
                          />
                          <strong>
                            {d.operation === 'conflict' ? t('recordConflict') : label(d.operation)}
                          </strong>
                          <span className="pill">
                            {d.item ? label(d.item.status) : (d.blocked ?? label(d.operation))}
                          </span>
                        </label>
                        {d.blocked && <p role="alert">{d.blocked}</p>}
                        {d.before && (
                          <div className="diff-before">
                            <span>{t('before')}</span>
                            <p>{d.before.text}</p>
                          </div>
                        )}
                        {d.item && (
                          <div className="diff-after">
                            <span>{t('after')}</span>
                            <p>{d.item.text}</p>
                          </div>
                        )}
                        <p className="match-label">{t('sourceMatched')}</p>
                        {d.evidence.map((e, i) => (
                          <details key={i}>
                            <summary>
                              {t('sourceDetails')} · {e.messageId.slice(0, 8)}
                            </summary>
                            <blockquote>{e.quote}</blockquote>
                            <p className="mono">
                              {t('matchPositions')}:{' '}
                              {quotePositions(
                                request?.selectedMessages.find((m) => m.id === e.messageId)?.text ??
                                  '',
                                e.quote,
                              ).join(', ')}
                            </p>
                          </details>
                        ))}
                        {d.note && (
                          <p>
                            {t('note')}: {d.note}
                          </p>
                        )}
                      </article>
                    ))}
                    <button
                      className="primary"
                      disabled={busy || !selected.length}
                      onClick={() =>
                        void perform(async () => {
                          await commit(applyProposals(archive, requestId, selected));
                          setSelected([]);
                          setView('memory');
                        })
                      }
                    >
                      {t('save')}
                    </button>
                  </div>
                )}
              </section>
            )}
            {view === 'sources' && (
              <section className="history-grid">
                <div>
                  <h2>{t('sourceList')}</h2>
                  {!archive.conversations.length && <p>{t('noSources')}</p>}
                  {archive.conversations.map((c) => (
                    <article className="conversation" key={c.id}>
                      <h3>
                        {c.title} <span className="mono">{c.id.slice(0, 8)}</span>
                      </h3>
                      {c.messages.map((m) => (
                        <div id={'source-' + m.id} key={m.id} className="source-message">
                          <span className="eyebrow">
                            {label(m.role)} / {m.ordinal + 1} / {m.id.slice(0, 8)}
                          </span>
                          <pre>{m.text}</pre>
                        </div>
                      ))}
                    </article>
                  ))}
                </div>
                <div className="history-rail">
                  <h2>{t('history')}</h2>
                  {[...archive.revisions].reverse().map((r) => (
                    <article key={r.id}>
                      <span className="mono">{r.id.slice(0, 8)}</span>
                      <p>
                        {r.actor} · {r.createdAt.slice(0, 19)}
                      </p>
                      {r.id !== revision!.id && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void perform(() =>
                              commit(appendRevision(archive, restoreSnapshot(revision!, r))),
                            )
                          }
                        >
                          {t('restore')}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
            {view === 'export' && (
              <section className="flow-panel">
                <p className="lede small">{t('exportHelp')}</p>
                {scopePicker('handoffScope', handoffScope, setHandoffScope)}
                <div className="form-row">
                  <label>
                    {t('budget')}
                    <select
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value) as 8000 | 24000)}
                    >
                      <option value={8000}>8,000</option>
                      <option value={24000}>24,000</option>
                    </select>
                  </label>
                  <label className="check-line">
                    <input
                      type="checkbox"
                      checked={includeEvidence}
                      onChange={(e) => setIncludeEvidence(e.target.checked)}
                    />
                    {t('evidence')}
                  </label>
                </div>
                {handoff?.ok ? (
                  <>
                    <label htmlFor="handoff">{t('handoffText')}</label>
                    <textarea id="handoff" readOnly value={handoff.text} rows={15} />
                    <div className="button-row">
                      <button className="primary" onClick={() => void copy(handoff.text)}>
                        {t('copy')}
                      </button>
                      <button
                        onClick={() =>
                          download(
                            'threadlatch-handoff.md',
                            handoff.text,
                            'text/markdown;charset=utf-8',
                          )
                        }
                      >
                        {t('downloadMd')}
                      </button>
                    </div>
                  </>
                ) : (
                  <p role="alert">{handoff && !handoff.ok ? handoff.error : ''}</p>
                )}
                <div className="backup-box">
                  <h2>JSON / {t('history')}</h2>
                  <p>{t('backupHint')}</p>
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        'threadlatch-backup.json',
                        serializeArchive(archive),
                        'application/json',
                      )
                    }
                  >
                    {t('backup')}
                  </button>
                  <label className="file-button">
                    {t('importBackup')}
                    <input
                      type="file"
                      disabled={busy}
                      accept=".json,application/json"
                      aria-label={t('importBackup')}
                      onChange={(e) => void importBackup(e.target.files?.[0])}
                    />
                  </label>
                </div>
                <button className="danger" onClick={() => dialog.current?.showModal()}>
                  {t('delete')}
                </button>
              </section>
            )}
            <dialog ref={dialog} aria-labelledby="delete-title">
              <h2 id="delete-title">{t('delete')}</h2>
              <p>{t('deleteHelp')}</p>
              <div className="button-row">
                <button autoFocus onClick={() => dialog.current?.close()}>
                  {t('cancel')}
                </button>
                <button
                  className="danger"
                  onClick={() =>
                    void perform(async () => {
                      await repo.remove(archive.project.id);
                      localStorage.removeItem('threadlatch-project');
                      dialog.current?.close();
                      await refresh('');
                    })
                  }
                >
                  {t('deleteConfirm')}
                </button>
              </div>
            </dialog>
          </>
        )}
        <footer>
          <span>{t('tagline')}</span>
          <span>{t('instruction')}</span>
        </footer>
      </main>
    </div>
  );
}
function quotePositions(text: string, quote: string) {
  const positions: number[] = [];
  let offset = 0;
  while ((offset = text.indexOf(quote, offset)) !== -1) {
    positions.push(offset);
    offset++;
  }
  return positions;
}
