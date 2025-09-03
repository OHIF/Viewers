import { fixBulkDataURI } from './fixBulkDataURI';
import {
  cleanDenaturalizedDataset,
  transferDenaturalizedDataset,
} from './cleanDenaturalizedDataset';

export type {HeadersInterface} from '@ohif/core/src/types/RequestHeaders';


export { fixMultiValueKeys } from './fixMultiValueKeys';

export { fixBulkDataURI, cleanDenaturalizedDataset, transferDenaturalizedDataset };

export type { DicomWebConfig, BulkDataURIConfig } from './dicomWebConfig';
export type { RetrieveStudyMetadataInterface } from './Types';

export {
  retrieveStudyMetadata,
  deleteStudyMetadataPromise
} from './wado/retrieveStudyMetadata.js';

export {
  retrieveInstanceMetadata
} from './wado/retrieveInstanceMetadata';

export {
  mapParams,
  search as qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
  listSeries,
  listSeriesInstances,
} from './qido/qido.js';

export {
  generateInstanceMetaData,
  generateStudyMetaData,
  dicomWebToDicomStructure,
  dicomWebToRawDicomInstances,
} from './metadata/extractMetaData';

export {getImageId} from './getImageId';
export {addRetrieveBulkData} from './wado/retrieveBulkData';

import StaticWadoClient from './StaticWadoClient';
import getDirectURL from '../../utils/getDirectURL';
export {getDirectURL, StaticWadoClient};

export {DicomMetaDictionary, DicomDict, naturalizeDataset, denaturalizeDataset} from './dicom'
