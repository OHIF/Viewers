import { asMultiValueArray } from '@cornerstonejs/utils';

/**
 * Fix multi-valued keys so that values which are strings split by a backslash
 * become separate list items.
 *
 * Some DICOMweb sources write all values as one backslash-joined string, for
 * example ImageType `["ORIGINAL\\PRIMARY\\VOLUME\\NONE"]`. dcmjs 1.0 keeps
 * such a value as a one-item list, and `denaturalizeDataset` then truncates
 * it to the 16 characters of a CS value (`ORIGINAL\PRIMARY`), so the split
 * must also apply to a list.
 */
export function fixMultiValueKeys(naturalData, keys = ['ImageType', 'FrameType']) {
  for (const key of keys) {
    const value = naturalData[key];
    if (typeof value === 'string' || Array.isArray(value)) {
      naturalData[key] = asMultiValueArray(value);
    }
  }
  return naturalData;
}
