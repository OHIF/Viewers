import { OHIF } from 'meteor/ohif:core';
import { remoteGetValue } from '../../lib/remoteGetValue';

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
        var seriesInstanceUid = remoteGetValue(instance['0020,000e']);
        var series = seriesMap[seriesInstanceUid];

        // If no series data exists in the seriesMap cache variable,
        // process any available series data
        if(!series) {
            series = {
                seriesInstanceUid : seriesInstanceUid,
                seriesNumber : parseFloat(remoteGetValue(instance['0020,0011'])),
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
        var sopInstanceUid = remoteGetValue(instance['0008,0018']);
        var uri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + "&contentType=application%2Fdicom";

        // Add this instance to the current series
        series.instances.push({
            sopClassUid: remoteGetValue(instance['0008,0016']),
            sopInstanceUid: sopInstanceUid,
            uri: uri,
            instanceNumber: parseFloat(remoteGetValue(instance['0020,0013']))
        });
  });
  return seriesList;
}

/**
 * Retrieve a set of instances using a QIDO call
 * @param server
 * @param studyInstanceUid
 * @returns {{wadoUriRoot: String, studyInstanceUid: String, seriesList: Array}}
 */
OHIF.studies.services.REMOTE.Instances = function(server, studyInstanceUid) {
    var parameters = {
        PatientName: "",
        PatientID: "",
        AccessionNumber: "",
        SeriesInstanceUID: "",
        SeriesNumber : "",
        SOPClassUID : "",
        InstanceNumber : ""
    };

    var remote = new OrthancRemote(server.root, server.sourceAE);

    return {
        wadoUriRoot: server.wadoUriRoot,
        studyInstanceUid: studyInstanceUid,
        seriesList: resultDataToStudyMetadata(server, studyInstanceUid, remote.findInstances(server.modality, studyInstanceUid, null, parameters))
    };
};
