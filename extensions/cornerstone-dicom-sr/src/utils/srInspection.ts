import {
  ConceptNameCodeSequence,
  ConceptNameCodeSequenceItem,
  ContentSequence,
  DICOMStandardReport,
  reportFields,
} from './srTypes';

export function getCodeMeaningFromConceptNameCodeSequence(
  conceptNameCodeSequence: ConceptNameCodeSequence
): string {
  let item: ConceptNameCodeSequenceItem = conceptNameCodeSequence[0];
  const { CodeMeaning } = item;
  return CodeMeaning ?? "";
}

export function getContentSequenceFromSR(root: DICOMStandardReport): ContentSequence{
  return root.ContentSequence ? root.ContentSequence : [];
}

export function getStandardReport(root): DICOMStandardReport {
  return root;
}

export function isSRReportField(field: string): boolean {
  switch (field) {
    case reportFields.Findings:
    case reportFields.History:
      return true;
    default:
      return false;
  }
}