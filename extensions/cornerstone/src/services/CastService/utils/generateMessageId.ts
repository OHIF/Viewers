/**
 * Generates a unique message ID for cast publish. Prefers crypto.randomUUID when available.
 */
export function generateMessageId(prefix = 'OHIF-'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return prefix + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  return prefix + Math.random().toString(36).substring(2, 18);
}
