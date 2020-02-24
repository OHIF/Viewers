const isTemplateNameEqual = (templateNameA, templateNameB) => {
  return (
    templateNameA &&
    templateNameB &&
    templateNameA.toLowerCase() === templateNameB.toLowerCase()
  );
};

export default isTemplateNameEqual;
