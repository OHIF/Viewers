/**
 * Parses data returned from a study search and transforms it into
 * an array of series that are present in the study
 *
 * @param resultData
 * @returns {Array} Series List
 */
function resultDataToStudyMetadata(resultData) {
    var seriesMap = {};
    var seriesList = [];

    resultData.forEach(function(instanceRaw) {
        var instance = instanceRaw.toObject();
        // Use seriesMap to cache series data
        // If the series instance UID has already been used to
        // process series data, continue using that series
        var seriesInstanceUid = instance[0x0020000E];
        var series = seriesMap[seriesInstanceUid];

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
        var server = getCurrentServer().peers[0];

        var serverRoot = server.host + ':' + server.port;

        var sopInstanceUid = instance[0x00080018];
        var uri = serverRoot + '/studies/' + studyInstanceUid + '/series/' + seriesInstanceUid + '/instances/' + sopInstanceUid + '/frames/1';

        // Add this instance to the current series
        series.instances.push({
            sopClassUid: instance[0x00080016],
            sopInstanceUid: sopInstanceUid,
            uri: uri,
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
Services.DIMSE.Instances = function(studyInstanceUid) {
    //var url = buildUrl(server, studyInstanceUid);
    var result = DIMSE.retrieveInstances(studyInstanceUid);

    return {
        studyInstanceUid: studyInstanceUid,
        seriesList: resultDataToStudyMetadata(result)
    };
};
