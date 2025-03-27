function preserve(query, current, key) {
  const value = current.get(key);
  if (value) {
    query.append(key, value);
  }
}

export const preserveKeys = ['configUrl', 'multimonitor', 'screenNumber', 'hangingProtocolId'];

export function preserveQueryParameters(
  query,
  current = new URLSearchParams(window.location.search)
) {
  for (const key of preserveKeys) {
    preserve(query, current, key);
  }
}

export function preserveQueryStrings(query, current = new URLSearchParams(window.location.search)) {
  for (const key of preserveKeys) {
    const value = current.get(key);
    if (value) {
      query[key] = value;
    }
  }
}
