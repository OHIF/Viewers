import { OHIF } from 'meteor/ohif:core';
import DIMSE from 'dimse';

/**
 * Parses data returned from a study search and transforms it into
 * an array of series that are present in the study
 *
 * @param resultData
 * @param studyInstanceUid
 * @returns {Array} Series List
 */
function resultDataToStudyMetadata(resultData, studyInstanceUid) {
    const seriesMap = {};
    const seriesList = [];

    resultData.forEach(function(instanceRaw) {
        const instance = instanceRaw.toObject();
        // Use seriesMap to cache series data
        // If the series instance UID has already been used to
        // process series data, continue using that series
        const seriesInstanceUid = instance[0x0020000E];
        let series = seriesMap[seriesInstanceUid];

        // If no series data exists in the seriesMap cache variable,
        // process any available series data
        if (!series) {
            series = {
                seriesInstanceUid: seriesInstanceUid,
                seriesNumber: instance[0x00200011],
                instances: []
            };

            // Save this data in the seriesMap cache variable
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }

        // TODO: Check which peer it should point to
        const server = OHIF.servers.getCurrentServer().peers[0];

        const serverRoot = server.host + ':' + server.port;

        const sopInstanceUid = instance[0x00080018];
        const uri = serverRoot + '/studies/' + studyInstanceUid + '/series/' + seriesInstanceUid + '/instances/' + sopInstanceUid + '/frames/1';

        // Add this instance to the current series
        series.instances.push({
            sopClassUid: instance[0x00080016],
            sopInstanceUid,
            uri,
            instanceNumber: instance[0x00200013]
        });
    });
    return seriesList;
}

/**
 * Retrieve a set of instances using a DIMSE call
 * @param studyInstanceUid
 * @returns {{wadoUriRoot: String, studyInstanceUid: String, seriesList: Array}}
 */
OHIF.studies.services.DIMSE.Instances = function(studyInstanceUid) {
    //var url = buildUrl(server, studyInstanceUid);
    const result = DIMSE.retrieveInstances(studyInstanceUid);

    return {
        studyInstanceUid: studyInstanceUid,
        seriesList: resultDataToStudyMetadata(result, studyInstanceUid)
    };
};
