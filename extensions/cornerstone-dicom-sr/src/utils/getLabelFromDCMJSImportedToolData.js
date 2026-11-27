import { adaptersSR } from '@cornerstonejs/adapters';

const { CodeScheme: Cornerstone3DCodeScheme } = adaptersSR.Cornerstone3D;

/**
 * Extracts the label from the toolData imported from dcmjs. We need to do this
 * as dcmjs does not depend on OHIF/the measurementService, it just produces data for cornerstoneTools.
 *
 * Priority: annotation label, free-text finding site, then the CodeMeaning of the Finding (free
 * text, or coded as in TID 1500, e.g. "Lesion").
 * @param {object} toolData The tooldata relating to the annotation
 *
 * @returns {string} The extracted label.
 */
export default function getLabelFromDCMJSImportedToolData(toolData) {
  const { findingSites = [], finding, annotation } = toolData;

  if (annotation?.data?.label) {
    return annotation.data.label;
  }

  const freeTextLabel = findingSites.find(
    fs => fs.CodeValue === Cornerstone3DCodeScheme.codeValues.CORNERSTONEFREETEXT
  );

  if (freeTextLabel?.CodeMeaning) {
    return freeTextLabel.CodeMeaning;
  }

  if (finding?.CodeMeaning) {
    return finding.CodeMeaning;
  }
}
