const attributeCache = Object.create(null);
const REGEXP = /^\([x0-9a-f]+\)/;

const humanize = text => {
  let humanized = text.replace(/([A-Z])/g, ' $1'); // insert a space before all caps

  humanized = humanized.replace(/^./, str => {
    // uppercase the first character
    return str.toUpperCase();
  });

  return humanized;
};

/**
 * Get the text of an attribute for a given attribute
 * @param  {String} attributeId The attribute ID
 * @param  {Array} attributes   Array of attributes objects with id and text properties
 * @return {String}             If found return the attribute text or an empty string otherwise
 */
const getAttributeText = (attributeId, attributes) => {
  // If the attribute is already in the cache, return it
  if (attributeId in attributeCache) {
    return attributeCache[attributeId];
  }

  // Find the attribute with given attributeId
  const attribute = attributes.find(attribute => attribute.id === attributeId);

  let attributeText;

  // If attribute was found get its text and save it on the cache
  if (attribute) {
    attributeText = attribute.text.replace(REGEXP, '');
    attributeCache[attributeId] = attributeText;
  }

  return attributeText || '';
};

function displayConstraint(attributeId, constraint, attributes) {
  if (!constraint || !attributeId) {
    return;
  }

  const validatorType = Object.keys(constraint)[0];
  if (!validatorType) {
    return;
  }

  const validator = Object.keys(constraint[validatorType])[0];
  if (!validator) {
    return;
  }

  const value = constraint[validatorType][validator];
  if (value === void 0) {
    return;
  }

  let comparator = validator;
  if (validator === 'value') {
    comparator = validatorType;
  }

  const attributeText = getAttributeText(attributeId, attributes);
  const constraintText =
    attributeText + ' ' + humanize(comparator).toLowerCase() + ' ' + value;

  return constraintText;
}
