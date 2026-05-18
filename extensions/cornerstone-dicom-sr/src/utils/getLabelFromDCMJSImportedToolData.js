import { adaptersSR } from '@cornerstonejs/adapters';

const { CodeScheme: Cornerstone3DCodeScheme } = adaptersSR.Cornerstone3D;

/**
 * Display label for SR annotations. Per TID 1500 and issue #107, show Finding
 * CodeMeaning (e.g. "Lesion"). Priority: annotation label, free-text finding
 * site, free-text finding, then Finding concept CodeMeaning.
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

  if (finding?.CodeValue === Cornerstone3DCodeScheme.codeValues.CORNERSTONEFREETEXT && finding?.CodeMeaning) {
    return finding.CodeMeaning;
  }

  if (finding?.CodeMeaning) {
    return finding.CodeMeaning;
  }
}
