import { type Message } from '../core/schema.js';
export async function fingerprint(
  projectId: string,
  baseRevisionId: string,
  messages: Array<Pick<Message, 'role' | 'text'>>,
) {
  const bytes = new TextEncoder().encode(
    JSON.stringify([
      projectId,
      baseRevisionId,
      messages.map((m) => ({ role: m.role, text: m.text })),
    ]),
  );
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
