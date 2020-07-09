export default function getLabelFromDCMJSImportedToolData(toolData) {
  const { findingSites = [], finding } = toolData;

  debugger;

  let freeTextLabel = findingSites.find(
    fs => fs.CodeValue === 'CORNERSTONEFREETEXT'
  );

  if (freeTextLabel) {
    return freeTextLabel.CodeMeaning;
  }

  if (finding && finding.CodeValue === 'CORNERSTONEFREETEXT') {
    return finding.CodeMeaning;
  }
}
