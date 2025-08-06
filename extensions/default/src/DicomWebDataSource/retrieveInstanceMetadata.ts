import { retrieveStudyMetadata } from './retrieveStudyMetadata';
import DICOMwebClient from 'dicomweb-client/types/api';
import { DicomWebConfig, BulkDataURIConfig } from './dicomWebConfig';


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