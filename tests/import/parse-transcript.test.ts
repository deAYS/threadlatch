import { expect, it } from 'vitest';
import { parseTranscript, finalizeImport } from '../../src/import/parse-transcript.js';
it('preserves Unicode, repeated messages and code-fenced role markers', async () => {
  const raw =
    'User: Türkçe 😀\r\n```txt\r\nAssistant: literal\r\n```\r\nAssistant: OK\r\nUser: Türkçe 😀';
  const draft = parseTranscript(raw, 'role-tagged');
  expect(draft.raw).toBe(raw);
  expect(draft.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  expect(draft.messages[0].text).toContain('Assistant: literal');
  const a = await finalizeImport(draft, 'project', 'revision');
  const b = await finalizeImport(draft, 'project', 'revision');
  expect(a.importFingerprint).toBe(b.importFingerprint);
  expect(a.messages).toHaveLength(3);
  expect((await finalizeImport(draft, 'project', 'other')).importFingerprint).not.toBe(
    a.importFingerprint,
  );
});
it('never guesses roles or truncates oversized input', () => {
  expect(parseTranscript('Use SQLite.', 'plain').messages[0].role).toBe('unknown');
  expect(() => parseTranscript('', 'plain')).toThrow();
  expect(() => parseTranscript('😀'.repeat(300_000), 'plain')).toThrow(/size/i);
});
