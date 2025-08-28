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
  let item: ConceptNameCodeSequenceItem = conceptNameCodeSequence[0];
  const { CodeMeaning } = item;
  return CodeMeaning ?? "";
}

export function getCodeValueFromConceptNameCodeSequence(
  conceptNameCodeSequence: ConceptNameCodeSequence
): string {
  let item: ConceptNameCodeSequenceItem = conceptNameCodeSequence[0];
  const { CodeValue } = item;
  return CodeValue ?? "";
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