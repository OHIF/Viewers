import type CustomizationService from '@ohif/core/src/services/CustomizationService';

/**
 * Keys preserved when navigating between worklist and viewer modes.
 * All preserved keys are handled as multi-valued query parameters.
 */
export const PRESERVE_CUSTOMIZATION_KEYS_KEY = 'ohif.preserveCustomizationKeys';
export const preserveKeys = [
  'configUrl',
  'multimonitor',
  'screenNumber',
  'hangingProtocolId',
  'customization',
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
    if (values.length) {
      query[key] = values;
    }
  }
}
