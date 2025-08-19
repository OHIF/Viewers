import { retrieveStudyMetadata } from './retrieveStudyMetadata';
import DICOMwebClient from 'dicomweb-client/types/api';
import { DicomWebConfig, BulkDataURIConfig } from './utils/dicomWebConfig';

/**
 * Retrieval of instance metadata updated to allow optional passthrough of SOPInstanceUID so that we can
 * retrieve individual slices instead of the full series or study.
 *
 * @param wadoDicomWebClient client needed to execute retrieval
 * @param StudyInstanceUID
 * @param enableStudyLazyLoad
 * @param instanceMeta Instance metadata from which we can obtain the series uid and instance uid if available
 * @param sortCriteria
 * @param sortFunction
 * @param dicomWebConfig system configuration structure.
 */
export async function retrieveInstanceMetadata(
  wadoDicomWebClient: DICOMwebClient,
  StudyInstanceUID: string,
  enableStudyLazyLoad: boolean,
  instanceMeta: any,
  sortCriteria,
  sortFunction: Function,
  dicomWebConfig: DicomWebConfig
) {
  const seriesInstanceUID = instanceMeta.seriesInstanceUID;
  const sopInstanceUID = instanceMeta.sopInstanceUID;
  return retrieveStudyMetadata(
    wadoDicomWebClient,
    StudyInstanceUID,
    enableStudyLazyLoad,
    {seriesInstanceUID, sopInstanceUID},
    sortCriteria,
    sortFunction,
    dicomWebConfig
  );
}