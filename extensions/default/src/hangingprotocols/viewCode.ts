export default displaySet => {
  const ViewCodeSequence = displaySet?.images[0]?.ViewCodeSequence[0];
  if (!ViewCodeSequence) {
    return undefined;
  }
  const { CodingSchemeDesignator, CodeValue } = ViewCodeSequence;
  if (!CodingSchemeDesignator || !CodeValue) {
    return undefined;
  }
  return `${CodingSchemeDesignator}:${CodeValue}`;
};
