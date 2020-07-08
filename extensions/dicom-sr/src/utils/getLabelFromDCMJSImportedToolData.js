export default function getLabelFromDCMJSImportedToolData(toolData) {
  const { findingSites = [], findings = [] } = toolData;

  let freeTextLabel = findingSites.find(
    fs => fs.CodeValue === 'CORNERSTONEFREETEXT'
  );

  if (freeTextLabel) {
    return freeTextLabel.CodeMeaning;
  }

  freeTextLabel = findings.find(f => f.CodeValue === 'CORNERSTONEFREETEXT');

  if (freeTextLabel) {
    return freeTextLabel.CodeMeaning;
  }
}
