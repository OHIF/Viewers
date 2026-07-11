import type CustomizationService from '@ohif/core/src/services/CustomizationService';

/**
 * Keys preserved when navigating between worklist and viewer modes.
 * Each key may repeat in the URL; a single occurrence is preserved as a string and
 * multiple occurrences as an array (see preserveQueryStrings).
 */
export const PRESERVE_CUSTOMIZATION_KEYS_KEY = 'ohif.preserveCustomizationKeys';
export const preserveKeys = [
  'configUrl',
  'multimonitor',
  'screenNumber',
  'hangingProtocolId',
  'customization',
  'theme',
];

function preserveKey(query: URLSearchParams, current: URLSearchParams, key: string) {
  const values = current.getAll(key);
  for (const value of values) {
    if (value) {
      query.append(key, value);
    }
  }
}

function getPreserveKeys(customizationService?: CustomizationService): string[] {
  const customKeys = customizationService?.getValue?.(PRESERVE_CUSTOMIZATION_KEYS_KEY, []) || [];
  if (!customKeys?.length) {
    return preserveKeys;
  }

  return [...preserveKeys, ...customKeys];
}

export function preserveQueryParameters(
  query: URLSearchParams,
  customizationService?: CustomizationService,
  current: URLSearchParams = new URLSearchParams(window.location.search)
): void {
  for (const key of getPreserveKeys(customizationService)) {
    preserveKey(query, current, key);
  }
}

export function preserveQueryStrings(
  query: Record<string, string | string[]>,
  customizationService?: CustomizationService,
  current: URLSearchParams = new URLSearchParams(window.location.search)
): void {
  for (const key of getPreserveKeys(customizationService)) {
    const values = current.getAll(key).filter(Boolean);
    if (!values.length) {
      continue;
    }
    // A single value is stored as a plain string and repeated values as an array.
    // The worklist stringifier (query-string) serializes both correctly with its
    // default arrayFormat: a string becomes `key=value` and an array becomes
    // duplicated `key=a&key=b` keys — no arrayFormat option required by callers.
    // Keeping single values as strings also keeps them safe under stricter
    // serializers (e.g. the `qs` library, whose default would index arrays).
    query[key] = values.length === 1 ? values[0] : values;
  }
}
