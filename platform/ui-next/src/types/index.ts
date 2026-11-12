import ThumbnailType from './ThumbnailType';

// A few miscellaneous types declared inline here.

export * from './Predicate';
export * from './ContextMenuItem';
export * from './ViewportActionCornersTypes';
export * from './ActionCorners';

/**
 * StringNumber often comes back from DICOMweb for integer valued items.
 */
type StringNumber = string | number;

/**
 * StringArray often comes back from dcmjs for single valued strings that
 * might have multiple values such as window level descriptions.
 */
type StringArray = string | string[];

export type { StringNumber, StringArray, ThumbnailType };
