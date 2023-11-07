export default function mergeResults(results, keyId) {
  const mergedResults = [];
  const keys = {};
  if (results.length === 1) {
    const { status, value } = results[0];
    if (status === 'fulfilled') {
      return value;
    }
  } else {
    for (const { status, value } of results) {
      if (status !== 'fulfilled') {
        continue;
      }
      for (const result of value) {
        const key = result[keyId].Value[0];
        if (!(key in keys)) {
          keys[key] = result;
          mergedResults.push(result);
        }
      }
    }
  }
  return mergedResults;
}
