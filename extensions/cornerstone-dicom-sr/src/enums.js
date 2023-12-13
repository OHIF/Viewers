import { adaptersSR } from '@cornerstonejs/adapters';

const { CodeScheme: Cornerstone3DCodeScheme } = adaptersSR.Cornerstone3D;

export const CodeNameCodeSequenceValues = {
  ImagingMeasurementReport: '126000',
  ImageLibrary: '111028',
  ImagingMeasurements: '126010',
  MeasurementGroup: '125007',
  ImageLibraryGroup: '126200',
  TrackingUniqueIdentifier: '112040',
  TrackingIdentifier: '112039',
  Finding: '121071',
  FindingSite: 'G-C0E3', // SRT
  CornerstoneFreeText: Cornerstone3DCodeScheme.codeValues.CORNERSTONEFREETEXT,
};

export const CodingSchemeDesignators = {
  SRT: 'SRT',
  CornerstoneCodeSchemes: [Cornerstone3DCodeScheme.CodingSchemeDesignator, 'CST4'],
};

export const RELATIONSHIP_TYPE = {
  INFERRED_FROM: 'INFERRED FROM',
  CONTAINS: 'CONTAINS',
};

export const CORNERSTONE_FREETEXT_CODE_VALUE = 'CORNERSTONEFREETEXT';

const enums = {
  CodeNameCodeSequenceValues,
  CodingSchemeDesignators,
  RELATIONSHIP_TYPE,
  CORNERSTONE_FREETEXT_CODE_VALUE,
};

export default enums;
