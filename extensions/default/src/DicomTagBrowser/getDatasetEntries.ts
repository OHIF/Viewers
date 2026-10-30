/**
 * Returns the `[key, value]` entries of a naturalized dataset to list. dcmjs 1.0
 * groups a private creator and its elements under one `gggg:creator` key, and
 * keeps the hex tags only as non-enumerable aliases, which a copy of the dataset
 * loses. This expands such a block to the hex tag of the creator and of each
 * element, with the values read from the block, so that the browser lists each
 * private tag also for a copied dataset.
 */
export default function getDatasetEntries(metadata): [string, unknown][] {
  return Object.keys(metadata).flatMap((key): [string, unknown][] => {
    const block = metadata[key];
    if (!/^[0-9A-F]{4}:/i.test(key) || typeof block?.reservedBlock !== 'number') {
      return [[key, block]];
    }
    const group = key.slice(0, 4).toUpperCase();
    const blockHex = block.reservedBlock.toString(16).toUpperCase().padStart(2, '0');
    const elements = Object.keys(block)
      .filter(name => /^x[0-9A-F]{2}$/i.test(name))
      .map((name): [string, unknown] => [
        `${group}${blockHex}${name.slice(1).toUpperCase()}`,
        block[name],
      ]);
    // The key holds the creator; dcmjs treats it as the authority.
    return [[`${group}00${blockHex}`, key.slice(5)], ...elements];
  });
}
