import * as dcmjs from 'dcmjs';
import { api } from 'dicomweb-client';
import log from '../log';

import DICOMWeb from '../DICOMWeb';
import getAllDisplaySets from '../DICOMSR/utils/getAllDisplaySets';
import { parser as DICOMSR2Parser } from './index';

const VERSION_NAME = 'dcmjs-0.0';
const TRANSFER_SYNTAX_UID = '1.2.840.10008.1.2.1';

/**
 * Function to store measurement service measurements to
 * DICOM Structured Reports in determined server
 *
 * @param {Object} measurements Measurement service measurements
 * @param {string} serverUrl Server URL to be used on request
 * @returns {Promise}
 */
const store = async (measurements, serverUrl) => {
  try {
    const { dataset } = DICOMSR2Parser.toDCMJS(measurements);
    const { DicomMetaDictionary, DicomDict } = dcmjs.data;

    const meta = {
      FileMetaInformationVersion: dataset._meta.FileMetaInformationVersion.Value,
      MediaStorageSOPClassUID: dataset.SOPClassUID,
      MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
      TransferSyntaxUID: TRANSFER_SYNTAX_UID,
      ImplementationClassUID: DicomMetaDictionary.uid(),
      ImplementationVersionName: VERSION_NAME,
    };

    const denaturalized = DicomMetaDictionary.denaturalizeDataset(meta);
    const dicomDict = new DicomDict(denaturalized);
    dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dataset);

    const part10Buffer = dicomDict.write();

    const dicomWeb = new api.DICOMwebClient({
      url: serverUrl,
      headers: DICOMWeb.getAuthorizationHeader(),
    });

    await dicomWeb.storeInstances({ datasets: [part10Buffer] });
  } catch (error) {
    log.error('Failed to store measurements to DICOMWeb server.', error);
  }
};

/**
 * Function to retrieve measurements from
 * DICOM Structured Reports coming from determined server
 *
 * @param {Array} series List of all series metaData loaded
 * @param {Array} studies List of all studies metaData loaded
 * @param {string} serverUrl Server URL to be used on request
 * @returns {Object} MeasurementData
 */
const retrieve = async (series, studies, serverUrl) => {
  try {
    const dicomWeb = new api.DICOMwebClient({
      url: serverUrl,
      headers: DICOMWeb.getAuthorizationHeader(),
    });

    const instance = series.getFirstInstance();
    const part10SRArrayBuffer = await dicomWeb.retrieveInstance({
      studyInstanceUID: instance.getStudyInstanceUID(),
      seriesInstanceUID: instance.getSeriesInstanceUID(),
      sopInstanceUID: instance.getSOPInstanceUID(),
    });

    const displaySets = getAllDisplaySets(studies);

    return DICOMSR2Parser.toMeasurementService(part10SRArrayBuffer, displaySets);
  } catch (error) {
    log.error('Failed to retrieve measurements to DICOMWeb server.', error);
  }
};

export default { store, retrieve };
