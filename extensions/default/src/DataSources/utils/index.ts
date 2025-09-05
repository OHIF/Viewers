export type {HeadersInterface} from '@ohif/core/src/types/RequestHeaders';
export { generateAuthorizationHeader, generateWadoHeader } from './headers';
export type { HeaderOptions } from './headers';

export { fixMultiValueKeys } from './fixMultiValueKeys';
export { fixBulkDataURI } from './fixBulkDataURI';
export {
  cleanDenaturalizedDataset,
  transferDenaturalizedDataset
} from './cleanDenaturalizedDataset';

export type { DicomWebConfig, BulkDataURIConfig } from './dicomWebConfig';
export type { RetrieveStudyMetadataInterface } from './Types';

/**
 * Collect the main exports for WADO
 */
export {
  retrieveStudyMetadata,
  deleteStudyMetadataPromise,
  retrieveInstanceMetadata,
  retrieveMinimalSeriesMetadata,
  retrieveFullSeriesMetadata,
  retrieveSeriesMetadataAsync
} from './wado';

/**
 * Collect the main exports for QIDO
 */
export {
  mapParams,
  search as qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
  listSeries,
  listSeriesInstances,
} from './qido';

/**
 * Collect metadata processing imports
 */
export {
  generateInstanceMetaData,
  generateStudyMetaData,
  dicomWebToDicomStructure,
  dicomWebToRawDicomInstances,
} from './metadata/extractMetaData';

/**
 * Collect other used imports.
 */
export {getImageId} from './getImageId';
export {addRetrieveBulkData} from './wado/retrieveBulkData';

import StaticWadoClient from './StaticWadoClient';
import getDirectURL from '../../utils/getDirectURL';
export {getDirectURL, StaticWadoClient};

/**
 * Collect dicomjs based imports.
 */
export {DicomMetaDictionary, DicomDict, naturalizeDataset, denaturalizeDataset} from './dicom'
