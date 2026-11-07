export type ErrorCode =
  | 'invalid_json'
  | 'invalid_proposal'
  | 'invalid_archive'
  | 'source_size'
  | 'analysis_size'
  | 'input_size'
  | 'empty_source'
  | 'stale_revision'
  | 'project_lock'
  | 'quota'
  | 'invalid_scope'
  | 'operation_failed';

export class WorkflowError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export function errorCode(error: unknown): ErrorCode {
  if (error instanceof WorkflowError) return error.code;
  // Dexie wraps the browser's DOMException; inspect types, never translated text.
  if (error && typeof error === 'object') {
    if ('name' in error && error.name === 'QuotaExceededError') return 'quota';
    if ('inner' in error && error.inner && error.inner !== error) return errorCode(error.inner);
  }
  return 'operation_failed';
}
