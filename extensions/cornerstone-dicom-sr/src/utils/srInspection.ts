/*
TODO: The contents of this file need to be reconciled or moved into the upcoming @cornerstonejs/metadata module.
Once that module becomes available, please move there.
 */
import {
  ConceptNameCodeSequence,
  ConceptNameCodeSequenceItem,
  ContentSequence,
  ContentSequenceItem,
  DICOMStandardReport,
} from './srTypes';

export function getCodeMeaningFromConceptNameCodeSequence(
  conceptNameCodeSequence: ConceptNameCodeSequence
): string {
  return conceptNameCodeSequence?.[0]?.CodeMeaning || "";
}

export function getCodeValueFromConceptNameCodeSequence(
  conceptNameCodeSequence: ConceptNameCodeSequence
): string {
  return conceptNameCodeSequence?.[0]?.CodeValue || "";
}

export function getContentSequenceFromSR(root: DICOMStandardReport): ContentSequence{
  return root.ContentSequence ? root.ContentSequence : [];
}

export function asStandardReport(root): DICOMStandardReport {
  return root;
}

export function asStandardReportContentItem(root): ContentSequenceItem {
  return root;
}