/**
 * Keys that are preserved as single-valued query parameters when navigating
 * between worklist and viewer modes.
 */
export const preserveKeys = ['configUrl', 'multimonitor', 'screenNumber', 'hangingProtocolId'];

/**
 * Keys that are preserved as multi-valued query parameters. Each occurrence
 * (and comma-delimited values within an occurrence) is appended back to the
 * outgoing query so repeated values survive navigation.
 */
export const preserveMultiKeys = ['customization'];

function preserve(query: URLSearchParams, current: URLSearchParams, key: string) {
  const value = current.get(key);
  if (value) {
    query.append(key, value);
  }
}

function preserveMulti(query: URLSearchParams, current: URLSearchParams, key: string) {
  const values = current.getAll(key);
  for (const value of values) {
    if (value) {
      query.append(key, value);
    }
  }
}

export function preserveQueryParameters(
  query: URLSearchParams,
  current: URLSearchParams = new URLSearchParams(window.location.search)
): void {
  for (const key of preserveKeys) {
    preserve(query, current, key);
  }
  for (const key of preserveMultiKeys) {
    preserveMulti(query, current, key);
  }
}

export function preserveQueryStrings(
  query: Record<string, string | string[]>,
  current: URLSearchParams = new URLSearchParams(window.location.search)
): void {
  for (const key of preserveKeys) {
    const value = current.get(key);
    if (value) {
      query[key] = value;
    }
  }
  for (const key of preserveMultiKeys) {
    const values = current.getAll(key).filter(Boolean);
    if (values.length === 1) {
      query[key] = values[0];
    } else if (values.length > 1) {
      query[key] = values;
    }
  }
}
