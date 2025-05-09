import { adaptersSR } from '@cornerstonejs/adapters';

const { CodeScheme: Cornerstone3DCodeScheme } = adaptersSR.Cornerstone3D;

export const SCOORDTypes = {
  POINT: 'POINT',
  MULTIPOINT: 'MULTIPOINT',
  POLYLINE: 'POLYLINE',
  CIRCLE: 'CIRCLE',
  ELLIPSE: 'ELLIPSE',
};

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
  FindingSiteSCT: '363698007', // SCT
};

export const CodingSchemeDesignators = {
  SRT: 'SRT',
  SCT: 'SCT',
  CornerstoneCodeSchemes: [Cornerstone3DCodeScheme.CodingSchemeDesignator, 'CST4'],
};

export const RelationshipType = {
  INFERRED_FROM: 'INFERRED FROM',
  CONTAINS: 'CONTAINS',
};

const enums = {
  CodeNameCodeSequenceValues,
  CodingSchemeDesignators,
  RelationshipType,
  SCOORDTypes,
};

export default enums;
