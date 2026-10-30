/**
 * Calls `callback` for each bulk data value (an object with a `BulkDataURI`) in
 * a naturalized dataset, at any depth.
 *
 * The walk follows a sequence in each shape that `naturalizeDataset` gives: an
 * array of items, and with dcmjs 1.0 also the item object of a one-item
 * sequence (it has a `length` of 1) and a private block (`gggg:creator`, with a
 * `reservedBlock`). It does not go into a person name, a bulk data value, or
 * binary data.
 */
export function forEachBulkDataValue(naturalized, callback: (value) => void): void {
  if (!naturalized || typeof naturalized !== 'object') {
    return;
  }
  for (const key of Object.keys(naturalized)) {
    const value = naturalized[key];
    if (!value || typeof value !== 'object' || ArrayBuffer.isView(value)) {
      continue;
    }
    if (value.BulkDataURI) {
      callback(value);
    } else if (Array.isArray(value)) {
      if (typeof value[0] === 'object') {
        value.forEach(item => forEachBulkDataValue(item, callback));
      }
    } else if (typeof value.length === 'number' || typeof value.reservedBlock === 'number') {
      forEachBulkDataValue(value, callback);
    }
  }
}

export default forEachBulkDataValue;
