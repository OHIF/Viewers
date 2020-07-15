import DICOMWeb from '../../../DICOMWeb';
import metadataProvider from '../../../classes/MetadataProvider';
import getWADORSImageId from '../../../utils/getWADORSImageId';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import getReferencedSeriesSequence from './getReferencedSeriesSequence';

/**
 * Create a plain JS object that describes a study (a study descriptor object)
 * @param {Object} server Object with server configuration parameters
 * @param {Object} aSopInstance a SOP Instance from which study information will be added
 */
function createStudy(server, aSopInstance) {
  // TODO: Pass a reference ID to the server instead of including the URLs here
  return {
    series: [],
    seriesMap: Object.create(null),
    seriesLoader: null,
    wadoUriRoot: server.wadoUriRoot,
    wadoRoot: server.wadoRoot,
    qidoRoot: server.qidoRoot,
    PatientName: DICOMWeb.getName(aSopInstance['00100010']),
    PatientID: DICOMWeb.getString(aSopInstance['00100020']),
    PatientAge: DICOMWeb.getNumber(aSopInstance['00101010']),
    PatientSize: DICOMWeb.getNumber(aSopInstance['00101020']),
    PatientWeight: DICOMWeb.getNumber(aSopInstance['00101030']),
    AccessionNumber: DICOMWeb.getString(aSopInstance['00080050']),
    StudyTime: DICOMWeb.getString(aSopInstance['00080030']),
    StudyDate: DICOMWeb.getString(aSopInstance['00080020']),
    FrameOfReferenceUID: DICOMWeb.getString(aSopInstance['00200052']),
    ReferencedSeriesSequence: getReferencedSeriesSequence(aSopInstance),
    modalities: DICOMWeb.getString(aSopInstance['00080061']), // TODO -> Rename this.. it'll take a while to not mess this one up.
    StudyDescription: DICOMWeb.getString(aSopInstance['00081030']),
    NumberOfStudyRelatedInstances: DICOMWeb.getString(aSopInstance['00201208']),
    StudyInstanceUID: DICOMWeb.getString(aSopInstance['0020000D']),
    InstitutionName: DICOMWeb.getString(aSopInstance['00080080']),
  };
}

/** Returns a WADO url for an instance
 *
 * @param StudyInstanceUID
 * @param SeriesInstanceUID
 * @param SOPInstanceUID
 * @returns  {string}
 */
function buildInstanceWadoUrl(
  server,
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID
) {
  // TODO: This can be removed, since DICOMWebClient has the same function. Not urgent, though
  const params = [];

  params.push('requestType=WADO');
  params.push(`studyUID=${StudyInstanceUID}`);
  params.push(`seriesUID=${SeriesInstanceUID}`);
  params.push(`objectUID=${SOPInstanceUID}`);
  params.push('contentType=application/dicom');
  params.push('transferSyntax=*');

  const paramString = params.join('&');

  return `${server.wadoUriRoot}?${paramString}`;
}

function buildInstanceWadoRsUri(
  server,
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID
) {
  return `${server.wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}`;
}

function buildInstanceFrameWadoRsUri(
  server,
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID,
  frame
) {
  const baseWadoRsUri = buildInstanceWadoRsUri(
    server,
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID
  );
  frame = frame != null || 1;

  return `${baseWadoRsUri}/frames/${frame}`;
}

async function makeSOPInstance(server, study, instance) {
  const naturalizedInstance = await metadataProvider.addInstance(instance, {
    server,
  });

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
  } = naturalizedInstance;

  let series = study.seriesMap[SeriesInstanceUID];

  if (!series) {
    series = {
      SeriesInstanceUID,
      SeriesDescription: naturalizedInstance.SeriesDescription,
      Modality: naturalizedInstance.Modality,
      SeriesNumber: naturalizedInstance.SeriesNumber,
      SeriesDate: naturalizedInstance.SeriesDate,
      SeriesTime: naturalizedInstance.SeriesTime,
      instances: [],
    };
    study.seriesMap[SeriesInstanceUID] = series;
    study.series.push(series);
  }

  const wadouri = buildInstanceWadoUrl(
    server,
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID
  );
  const baseWadoRsUri = buildInstanceWadoRsUri(
    server,
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID
  );
  const wadorsuri = buildInstanceFrameWadoRsUri(
    server,
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID
  );

  const sopInstance = {
    metadata: naturalizedInstance,
    baseWadoRsUri,
    wadouri,
    wadorsuri,
    wadoRoot: server.wadoRoot,
    imageRendering: server.imageRendering,
    thumbnailRendering: server.thumbnailRendering,
  };

  series.instances.push(sopInstance);

  if (
    sopInstance.thumbnailRendering === 'wadors' ||
    sopInstance.imageRendering === 'wadors'
  ) {
    // If using WADO-RS for either images or thumbnails,
    // Need to add this to cornerstoneWADOImageLoader's provider
    // (it won't be hit on cornerstone.metaData.get, but cornerstoneWADOImageLoader
    // will cry if you don't add data to cornerstoneWADOImageLoader.wadors.metaDataManager).

    const wadoRSMetadata = Object.assign(instance);

    const { NumberOfFrames } = sopInstance.metadata;

    if (NumberOfFrames) {
      for (let i = 0; i < NumberOfFrames; i++) {
        const wadorsImageId = getWADORSImageId(sopInstance, i);

        cornerstoneWADOImageLoader.wadors.metaDataManager.add(
          wadorsImageId,
          wadoRSMetadata
        );
      }
    } else {
      const wadorsImageId = getWADORSImageId(sopInstance);

      cornerstoneWADOImageLoader.wadors.metaDataManager.add(
        wadorsImageId,
        wadoRSMetadata
      );
    }
  }

  return sopInstance;
}

/**
 * Add a list of SOP Instances to a given study object descriptor
 * @param {Object} server Object with server configuration parameters
 * @param {Object} study The study descriptor to which the given SOP instances will be added
 * @param {Array} sopInstanceList A list of SOP instance objects
 */
async function addInstancesToStudy(server, study, sopInstanceList) {
  return Promise.all(
    sopInstanceList.map(function(sopInstance) {
      return makeSOPInstance(server, study, sopInstance);
    })
  );
}

const createStudyFromSOPInstanceList = async (server, sopInstanceList) => {
  if (Array.isArray(sopInstanceList) && sopInstanceList.length > 0) {
    const firstSopInstance = sopInstanceList[0];
    const study = createStudy(server, firstSopInstance);
    await addInstancesToStudy(server, study, sopInstanceList);
    return study;
  }
  throw new Error('Failed to create study out of provided SOP instance list');
};

export { createStudyFromSOPInstanceList, addInstancesToStudy };
