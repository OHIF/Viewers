/**
 * Extracts the label from the toolData imported from dcmjs. We need to do this
 * as dcmjs does not depeend on OHIF/the measurementService, it just produces data for cornestoneTools.
 * This optional data is available for the consumer to process if they wish to.
 * @param {object} toolData The tooldata relating to the
 *
 * @returns {string} The extracted label.
 */
export default function getLabelFromDCMJSImportedToolData(toolData) {
  const { findingSites = [], finding } = toolData;

  let freeTextLabel = findingSites.find(fs => fs.CodeValue === 'CORNERSTONEFREETEXT');

  if (freeTextLabel) {
    return freeTextLabel.CodeMeaning;
  }

  if (finding && finding.CodeValue === 'CORNERSTONEFREETEXT') {
    return finding.CodeMeaning;
  }
}
