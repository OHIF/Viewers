import type { ContextKey, EventContextItem } from '../network/types';

/**
 * Extracts the first context resource matching the given key from a cast event context array.
 */
export function getContextResource<T = unknown>(
  context: EventContextItem<unknown>[] | undefined,
  key: ContextKey
): T | null {
  if (!context || !Array.isArray(context)) return null;
  const keyLower = key.toLowerCase();
  for (const item of context) {
    if (item?.key?.toLowerCase() === keyLower && item.resource != null) {
      return item.resource as T;
    }
  }
  return null;
}
