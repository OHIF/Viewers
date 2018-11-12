import { OHIF } from 'meteor/ohif:core';
import DICOMwebClient from 'dicomweb-client';

const { DICOMWeb } = OHIF;

/**
 * Parses data returned from a QIDO search and transforms it into
 * an array of series that are present in the study
 *
 * @param server The DICOM server
 * @param studyInstanceUid
 * @param resultData
 * @returns {Array} Series List
 */
function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
    var seriesMap = {};
    var seriesList = [];

    resultData.forEach(function(instance) {
        // Use seriesMap to cache series data
        // If the series instance UID has already been used to
        // process series data, continue using that series
        var seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
        var series = seriesMap[seriesInstanceUid];

        // If no series data exists in the seriesMap cache variable,
        // process any available series data
        if (!series) {
            series = {
                seriesInstanceUid: seriesInstanceUid,
                seriesNumber: DICOMWeb.getString(instance['00200011']),
                instances: []
            };

            // Save this data in the seriesMap cache variable
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }

        // The uri for the dicomweb
        // NOTE: DCM4CHEE seems to return the data zipped
        // NOTE: Orthanc returns the data with multi-part mime which cornerstoneWADOImageLoader doesn't
        //       know how to parse yet
        //var uri = DICOMWeb.getString(instance['00081190']);
        //uri = uri.replace('wado-rs', 'dicom-web');

        // manually create a WADO-URI from the UIDs
        // NOTE: Haven't been able to get Orthanc's WADO-URI to work yet - maybe its not configured?
        var sopInstanceUid = DICOMWeb.getString(instance['00080018']);
        var uri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + '&contentType=application%2Fdicom';

        // Add this instance to the current series
        series.instances.push({
            sopClassUid: DICOMWeb.getString(instance['00080016']),
            sopInstanceUid: sopInstanceUid,
            uri: uri,
            instanceNumber: DICOMWeb.getString(instance['00200013'])
        });
    });
    return seriesList;
}

/**
 * Retrieve a set of instances using a QIDO call
 * @param server
 * @param studyInstanceUid
 * @throws ECONNREFUSED
 * @returns {{wadoUriRoot: String, studyInstanceUid: String, seriesList: Array}}
 */
OHIF.studies.services.QIDO.Instances = function(server, studyInstanceUid) {
    // TODO: Are we using this function anywhere?? Can we remove it?

    const config = {
        url: server.qidoRoot,
        headers: OHIF.DICOMWeb.getAuthorizationHeader()
    };
    const dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
    const queryParams = getQIDOQueryParams(filter, server.qidoSupportsIncludeField);
    const options = {
        studyInstanceUID: studyInstanceUid
    };

    return dicomWeb.searchForInstances(options).then(result => {
        return {
            wadoUriRoot: server.wadoUriRoot,
            studyInstanceUid: studyInstanceUid,
            seriesList: resultDataToStudyMetadata(server, studyInstanceUid, result.data)
        };
    });
};
