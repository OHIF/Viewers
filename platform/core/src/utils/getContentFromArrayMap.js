/**
 * It returns property value from an object for a given propertyKey.
 * In case there is no propertyKey it returns defaultContent
 *
 * @param {string} propertyKey property to be consumed on contentArrayMap object
 * @param {object} contentArrayMap object to be inspected
 * @param {*} defaultContent default value in case there is no propertyKey on object.
 */
const getContentFromArrayMap = (
  propertyKey,
  contentArrayMap,
  defaultContent
) => {
  const content =
    propertyKey in contentArrayMap
      ? contentArrayMap[propertyKey]
      : defaultContent;

  return content;
};

export default getContentFromArrayMap;
