import PropTypes from 'prop-types';

/**
 * StringNumber often comes back from DICOMweb for integer valued items.
 */
const StringNumber = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

/**
 * StringArray often comes back from dcmjs for single valued strings that
 * might have multiple values such as window level descriptions.
 */
const StringArray = PropTypes.oneOfType([PropTypes.string, PropTypes.array]);

const ThumbnailType = PropTypes.oneOf([
  'thumbnail',
  'thumbnailTracked',
  'thumbnailNoImage',
]);

export { StringNumber, StringArray, ThumbnailType };
