/**
 * Expose all type definitions needed to track the object fields from the input metadata retrieved
 * from the server.
 */

export type RawDicomInstance = PromiseFulfilledResult<any>;
export type RawDicomInstances = RawDicomInstance[];
export type SettledRawDicomInstances = RawDicomInstances[];

/**
 * Series level metadata header type. Here, we collect all of the metadata necessary for describing
 * an input study
 */
export type DicomSeriesHeaderMetaData = {
  StudyInstanceUID: string,
  StudyDescription: string,
  SeriesInstanceUID: string,
  SeriesDescription: string,
  SeriesNumber: number,
  SeriesTime: string,
  SOPClassUID: string,
  ProtocolName: string,
  Modality: string,
}

/**
 * This type adds the fields we need to track an instance. Some of the data can be obtained from
 * QIDO responses and other data such as ImagePositionPatient (IPP) comes from WADO responses.
 */
export interface DicomReferenceMetadata extends DicomSeriesHeaderMetaData {
  SOPInstanceUID: string,
  ImagePositionPatient?: number[],
  BitsAllocated: number,
  Rows: number,
  Columns: number,
  InstanceNumber: number,
  NumberOfFrames?: number,
  imageId?: string,
  url?: string,
  wadoRoot?: string,
  wadoUri?: string,
}
export type DicomStructure = DicomReferenceMetadata;
export type DicomStructureData = DicomStructure[];

export type DicomSeriesMetaData = Map<string, DicomSeriesHeaderMetaData>;
export type DicomInstancesMetaData = Map<string, DicomStructureData>;

/**
 * This type puts together all of the instance metadata and series metadata in one structure that
 * mirrors the data structure expected by the Viewer.
 */
export type DicomStudyMetaData = {
  seriesSummaryMetadata: DicomSeriesMetaData,
  instancesPerSeries: DicomInstancesMetaData
}

/**
 * Interface to be used by retrieveStudyMetadata to annotate the expected result fields.
 */
export type RetrieveStudyMetadataInterface = {
  preLoadData: Array<DicomSeriesHeaderMetaData>;
  promises: Array<DicomStructure>;
}
export type DicomSeriesStructureData = DicomStructureData[];