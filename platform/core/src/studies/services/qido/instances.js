import DICOMWeb from '../../../DICOMWeb/';
import { api } from 'dicomweb-client';

import errorHandler from '../../../errorHandler';

/**
 * Parses data returned from a QIDO search and transforms it into
 * an array of series that are present in the study
 *
 * @param server The DICOM server
 * @param StudyInstanceUID
 * @param resultData
 * @returns {Array} Series List
 */
function resultDataToStudyMetadata(server, StudyInstanceUID, resultData) {
  const seriesMap = {};
  const series = [];

  resultData.forEach(function(instance) {
    // Use seriesMap to cache series data
    // If the series instance UID has already been used to
    // process series data, continue using that series
    var SeriesInstanceUID = DICOMWeb.getString(instance['0020000E']);
    var series = seriesMap[SeriesInstanceUID];

    // If no series data exists in the seriesMap cache variable,
    // process any available series data
    if (!series) {
      series = {
        SeriesInstanceUID: SeriesInstanceUID,
        SeriesNumber: DICOMWeb.getString(instance['00200011']),
        instances: [],
      };

      // Save this data in the seriesMap cache variable
      seriesMap[SeriesInstanceUID] = series;
      series.push(series);
    }

    // The uri for the dicomweb
    // NOTE: DCM4CHEE seems to return the data zipped
    // NOTE: Orthanc returns the data with multi-part mime which cornerstoneWADOImageLoader doesn't
    //       know how to parse yet
    //var uri = DICOMWeb.getString(instance['00081190']);
    //uri = uri.replace('wado-rs', 'dicom-web');

    // manually create a WADO-URI from the UIDs
    // NOTE: Haven't been able to get Orthanc's WADO-URI to work yet - maybe its not configured?
    var SOPInstanceUID = DICOMWeb.getString(instance['00080018']);
    var uri =
      server.wadoUriRoot +
      '?requestType=WADO&studyUID=' +
      StudyInstanceUID +
      '&seriesUID=' +
      SeriesInstanceUID +
      '&objectUID=' +
      SOPInstanceUID +
      '&contentType=application%2Fdicom';

    // Add this instance to the current series
    series.instances.push({
      SOPClassUID: DICOMWeb.getString(instance['00080016']),
      SOPInstanceUID: SOPInstanceUID,
      uri: uri,
      InstanceNumber: DICOMWeb.getString(instance['00200013']),
    });
  });
  return series;
}

/**
 * Retrieve a set of instances using a QIDO call
 * @param server
 * @param StudyInstanceUID
 * @throws ECONNREFUSED
 * @returns {{wadoUriRoot: String, StudyInstanceUID: String, series: Array}}
 */
export default function Instances(server, StudyInstanceUID) {
  // TODO: Are we using this function anywhere?? Can we remove it?

  const config = {
    url: server.qidoRoot,
    headers: DICOMWeb.getAuthorizationHeader(server),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };
  const dicomWeb = new api.DICOMwebClient(config);
  const queryParams = getQIDOQueryParams(
    filter,
    server.qidoSupportsIncludeField
  );
  const options = {
    studyInstanceUID: StudyInstanceUID,
  };

  return dicomWeb.searchForInstances(options).then(result => {
    return {
      wadoUriRoot: server.wadoUriRoot,
      StudyInstanceUID: StudyInstanceUID,
      series: resultDataToStudyMetadata(server, StudyInstanceUID, result.data),
    };
  });
}
