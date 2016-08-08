/**
 * Creates a QIDO date string for a date range query
 * Assumes the year is positive, at most 4 digits long.
 *
 * @param date The Date object to be formatted
 * @returns {string} The formatted date string
 */
function dateToString(date) {
    if(!date) return "";
    var year = date.getFullYear().toString();
    var month = (date.getMonth() + 1).toString();
    var day = date.getDate().toString();
    year = "0".repeat(4-year.length).concat(year);
    month= "0".repeat(2-month.length).concat(month);
    day = "0".repeat(2-day.length).concat(day);
    return "".concat(year,month,day);
}

/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param server
 * @param filter
 * @returns {string} The URL with encoded filter query data
 */
function filterToQIDOURL(server, filter) {
    var commaSeparatedFields = [
        '00081030', // Study Description
        '00080060' //Modality
        // Add more fields here if you want them in the Study List
    ].join(',');

    var parameters = {
        PatientName: filter.patientName,
        PatientID: filter.patientId,
        AccessionNumber: filter.accessionNumber,
        StudyDescription: filter.studyDescription,
        limit: filter.limit || 20,
        includefield: server.qidoSupportsIncludeField ? 'all' : commaSeparatedFields
    };

    // build the StudyDate range parameter
    if (filter.studyDateFrom || filter.sutydDateTo) {
        var date = "".concat(dateToString(new Date(filter.studyDateFrom)), "-", dateToString(new Date(filter.studyDateTo)));
        parameters.StudyDate = date;
    }

    return server.qidoRoot + '/studies?' + encodeQueryData(parameters);
}

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */
function resultDataToStudies(resultData) {
    var studies = [];

    if (!resultData || !resultData.length) {
        return;
    }

    resultData.forEach(function(study) {
        studies.push({
            studyInstanceUid: DICOMWeb.getString(study['0020000D']),
            // 00080005 = SpecificCharacterSet
            studyDate: DICOMWeb.getString(study['00080020']),
            studyTime: DICOMWeb.getString(study['00080030']),
            accessionNumber: DICOMWeb.getNumber(study['00080050']),
            referringPhysicianName: DICOMWeb.getString(study['00080090']),
            // 00081190 = URL
            patientName: DICOMWeb.getName(study['00100010']),
            patientId: DICOMWeb.getString(study['00100020']),
            patientBirthdate: DICOMWeb.getString(study['00100030']),
            patientSex: DICOMWeb.getString(study['00100040']),
            studyId: DICOMWeb.getString(study['00200010']),
            numberOfStudyRelatedSeries: DICOMWeb.getString(study['00201206']),
            numberOfStudyRelatedInstances: DICOMWeb.getString(study['00201208']),
            studyDescription: DICOMWeb.getString(study['00081030']),
            // modality: DICOMWeb.getString(study['00080060']),
            // modalitiesInStudy: DICOMWeb.getString(study['00080061']),
            modalities: DICOMWeb.getString(DICOMWeb.getModalities(study['00080060'], study['00080061']))
        });
    });

    return studies;
}

Services.QIDO.Studies = function(server, filter) {
    var url = filterToQIDOURL(server, filter);
    var result = DICOMWeb.getJSON(url, server.requestOptions);
    return resultDataToStudies(result.data);
};
