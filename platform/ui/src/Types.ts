import PropTypes from 'prop-types';

/**
 * stringNumber often comes back from DICOMweb for integer valued items.
 */
const stringNumber = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

/**
 * stringArray often comes back from dcmjs for single valued strings that
 * might have multiplee values such as window level descriptions.
 */
const stringArray = PropTypes.oneOfType([PropTypes.string, PropTypes.array]);

const thumbnailType = PropTypes.oneOf([
  'thumbnail',
  'thumbnailTracked',
  'thumbnailNoImage',
]);

export {
  stringNumber,
  stringArray,
  thumbnailType,
};
