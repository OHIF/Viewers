/**
 * Expose all type definitions needed to track the object fields from the input metadata retrieved
 * from the server.
 */

///////////////////////////DICOM Types///////////////////////////////

export type RawFulfilledDicomInstance = PromiseFulfilledResult<any>;
export type RawDicomInstance = any;
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
  PixelData: {
    BulkDataURI: string,
  },
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
export type DicomSeriesStructureData = DicomStructureData[];

///////////////////////////Retrieval Types//////////////////////////////////

/**
 * Deferred promise class type hadnling retrieval of data in a lazy context.
 *
 * If you use the constructor, the promise will be auto queued. Otherwise, you need to call start()
 * to get the underlying promised queued in the background.
 */
export class DeferredPromise {
  metadata = undefined;
  processFunction = undefined;
  internalPromise = undefined;
  thenFunction = undefined;
  rejectFunction = undefined;

  constructor(metadata, processFunction) {
    this.setMetadata(metadata);
    this.setProcessFunction(processFunction);
    this.start();
  }

  setMetadata(metadata) {
    this.metadata = metadata;
  }
  setProcessFunction(func) {
    this.processFunction = func;
  }
  getPromise() {
    return this.start();
  }
  start() {
    if (this.internalPromise) {
      return this.internalPromise;
    }
    this.internalPromise = this.processFunction();
    // in case then and reject functions called before start
    if (this.thenFunction) {
      this.then(this.thenFunction);
      this.thenFunction = undefined;
    }
    if (this.rejectFunction) {
      this.reject(this.rejectFunction);
      this.rejectFunction = undefined;
    }
    return this.internalPromise;
  }
  then(func) {
    if (this.internalPromise) {
      return this.internalPromise.then(func);
    } else {
      this.thenFunction = func;
    }
  }
  reject(func) {
    if (this.internalPromise) {
      return this.internalPromise.reject(func);
    } else {
      this.rejectFunction = func;
    }
  }
}

/**
 * Interface to be used by retrieveStudyMetadata to annotate the expected result fields.
 */
export interface RetrieveStudyMetadataInterface {
  preLoadData: Array<DicomSeriesHeaderMetaData>,
  promises: Array<DeferredPromise>,
}


export interface DicomWebClientOptionsInterface {
  studyInstanceUID?: string,
  seriesInstanceUID?: string,
  queryParams?: any,
}