import { describe, expect, it } from 'vitest';
import { ProposalBatchSchema, createProject, parseArchive } from '../../src/core/schema.js';

describe('portable protocol', () => {
  const batch = { schemaVersion: 1, requestId: 'req-1', baseRevisionId: 'rev-1', changes: [] };
  it('accepts the v1 envelope and rejects added fields, missing identity and unknown versions', () => {
    expect(ProposalBatchSchema.safeParse(batch).success).toBe(true);
    expect(ProposalBatchSchema.safeParse({ ...batch, execute: 'command' }).success).toBe(false);
    expect(ProposalBatchSchema.safeParse({ ...batch, requestId: undefined }).success).toBe(false);
    expect(ProposalBatchSchema.safeParse({ ...batch, schemaVersion: 2 }).success).toBe(false);
  });
  it('rejects a dangling current revision before restoring any data', () => {
    const archive = createProject('Synthetic project');
    expect(parseArchive(JSON.stringify(archive)).project.title).toBe('Synthetic project');
    archive.project.currentRevisionId = 'absent';
    expect(() => parseArchive(JSON.stringify(archive))).toThrow(/reference/i);
  });
  it('rejects oversized and deeply nested input before schema traversal', () => {
    expect(() => parseArchive(' '.repeat(10 * 1024 * 1024 + 1))).toThrow(/size/i);
    expect(() => parseArchive('['.repeat(100) + '0' + ']'.repeat(100))).toThrow(/depth/i);
  });
});
