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
