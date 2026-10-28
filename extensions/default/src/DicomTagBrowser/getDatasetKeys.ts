/**
 * Returns the keys of a naturalized dataset to list. dcmjs 1.0 groups a private
 * creator and its elements under one `gggg:creator` key, and keeps the hex tags
 * only as non-enumerable aliases. This expands such a block back to the hex tag
 * of the creator and of each element, so that the browser lists each private tag.
 */
export default function getDatasetKeys(metadata): string[] {
  return Object.keys(metadata).flatMap(key => {
    const block = metadata[key];
    if (!/^[0-9A-F]{4}:/i.test(key) || typeof block?.reservedBlock !== 'number') {
      return [key];
    }
    const group = key.slice(0, 4).toUpperCase();
    const blockHex = block.reservedBlock.toString(16).toUpperCase().padStart(2, '0');
    const elementKeys = Object.keys(block)
      .filter(name => /^x[0-9A-F]{2}$/i.test(name))
      .map(name => `${group}${blockHex}${name.slice(1).toUpperCase()}`);
    return [`${group}00${blockHex}`, ...elementKeys];
  });
}
