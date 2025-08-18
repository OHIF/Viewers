export const enum reportFields {
  Findings = 'Findings',
  History = 'History',

}

/**
 * Structure of a ConceptNameCodeSequence item. typically, the main field used is the CodeMeaning
 * field.
 *
 * See https://dicom.nema.org/dicom/2013/output/chtml/part03/sect_8.8.html#table_8.8-1
 */
export type ConceptNameCodeSequenceItem = {
  CodeMeaning: string;
  CodeValue: string;
  CodingSchemeDesignator: string;
};

/**
 * Per the standard, this is an array with a single item.
 * https://dicom.nema.org/dicom/2013/output/chtml/part03/sect_C.17.html#table_C.17-5
 */
export type ConceptNameCodeSequence = ConceptNameCodeSequenceItem[];

/**
 * Pretty much the same as the ConceptNameCodeSequenceItem structure.
 */
export type ConceptCodeSequenceItem = {
  CodeMeaning: string;
  CodeValue: string;
  CodingSchemeDesignator: string;
};

export type ConceptCodeSequence = ConceptCodeSequenceItem[];

export type ContentSequenceItem = {
  ConceptCodeSequence?: ConceptCodeSequence;
  ConceptNameCodeSequence: ConceptNameCodeSequence;
  ContentSequence?: ContentSequence;
  ValueType: string;
  RelationshipType: string;
  TextValue?: string;
};

/**
 * Contains the main items for an SR report. Each item can have a value or its own container filled
 * with more items nested deeper.
 *
 * See https://dicom.nema.org/dicom/2013/output/chtml/part03/sect_C.17.html#table_C.17-5
 */
export type ContentSequence = ContentSequenceItem[];

export type ContentTemplateSequenceItem = {
  MappingResource: string;
  TemplateIdentifier: string;
}

/**
 * See https://dicom.nema.org/dicom/2013/output/chtml/part03/sect_C.18.html#sect_C.18.8.1.2
 */
export type ContentTemplateSequence = ContentTemplateSequenceItem[];

/**
 * Basic structure of the General DICOM SR module. Note, I have not fully defined it.
 *
 * See https://dicom.nema.org/dicom/2013/output/chtml/part03/sect_C.17.html#table_C.17-2 and
 * https://dicom.nema.org/dicom/2013/output/chtml/part03/sect_C.18.html#sect_C.18.8.1.1
 */
export interface DICOMStandardReport extends ContentSequenceItem {
  InstanceNumber: number;
  PreliminaryFlag?: string;
  CompletionFlag: string;
  CompletionFlagDescription?: string;
  VerificationFlag: string;
  ContentDate: string;
  ContentTime: string;
  ContentTemplateSequence: ContentTemplateSequence;
  ContinuityOfContent: string;
  SpecificCharacterSet: string; // not in the module but useful to track for encoding purposes.
}