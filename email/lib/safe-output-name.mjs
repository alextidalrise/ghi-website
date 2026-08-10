/** Restrict generated QA directory names to one conservative path segment. */
export function safeOutputName(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value)) {
    throw new Error('Output name must be a single 1–80 character slug using letters, numbers, dot, underscore or hyphen.');
  }
  return value;
}
