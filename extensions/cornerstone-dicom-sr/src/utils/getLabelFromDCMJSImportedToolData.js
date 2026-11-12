import { adaptersSR } from '@cornerstonejs/adapters';

const { CodeScheme: Cornerstone3DCodeScheme } = adaptersSR.Cornerstone3D;

/**
 * Extracts the label from the toolData imported from dcmjs. We need to do this
 * as dcmjs does not depeend on OHIF/the measurementService, it just produces data for cornestoneTools.
 * This optional data is available for the consumer to process if they wish to.
 * @param {object} toolData The tooldata relating to the
 *
 * @returns {string} The extracted label.
 */
export default function getLabelFromDCMJSImportedToolData(toolData) {
  const { findingSites = [], finding, annotation } = toolData;

  if (annotation.data.label) {
    return annotation.data.label;
  }

  let freeTextLabel = findingSites.find(
    fs => fs.CodeValue === Cornerstone3DCodeScheme.codeValues.CORNERSTONEFREETEXT
  );

  if (freeTextLabel) {
    return freeTextLabel.CodeMeaning;
  }

  if (finding && finding.CodeValue === Cornerstone3DCodeScheme.codeValues.CORNERSTONEFREETEXT) {
    return finding.CodeMeaning;
  }
}
