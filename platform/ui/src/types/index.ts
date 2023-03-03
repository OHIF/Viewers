import PropTypes from 'prop-types';
import ThumbnailType from './ThumbnailType';

// A few miscellaneous types declared inline here.

/**
 * StringNumber often comes back from DICOMweb for integer valued items.
 */
const StringNumber = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

/**
 * StringArray often comes back from dcmjs for single valued strings that
 * might have multiple values such as window level descriptions.
 */
const StringArray = PropTypes.oneOfType([PropTypes.string, PropTypes.array]);

export { StringNumber, StringArray, ThumbnailType };
