import { currentRevision, type AnalysisRequest, type ProjectArchive } from '../core/schema.js';

export function reviewState(archive: ProjectArchive, request: AnalysisRequest) {
  const batch = archive.proposals.find((b) => b.requestId === request.requestId);
  const current = currentRevision(archive);
  const applied =
    batch?.changes.filter((c) =>
      current.appliedProposalIds.includes(`${request.requestId}:${c.proposalId}`),
    ).length ?? 0;
  const total = batch?.changes.length ?? 0;
  const stale = request.baseRevisionId !== current.id;
  const status =
    total > 0 && applied === total
      ? 'requestApplied'
      : applied > 0
        ? 'requestPartial'
        : stale
          ? 'requestStale'
          : batch
            ? 'requestReady'
            : 'requestWaiting';
  const source = archive.conversations.find((c) =>
    c.messages.some((m) => request.selectedMessages.some((s) => s.id === m.id)),
  );
  return {
    status,
    stale,
    applied,
    total,
    title: source?.title ?? '',
    date: source?.createdAt?.slice(0, 10) ?? '',
  } as const;
}
