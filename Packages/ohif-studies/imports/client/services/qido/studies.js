import { OHIF } from 'meteor/ohif:core';
import DICOMwebClient from 'dicomweb-client';

const { DICOMWeb } = OHIF;

// TODO: Is there an easier way to do this?
if (Meteor.isServer) {
    var XMLHttpRequest = require('xhr2');

    global.XMLHttpRequest = XMLHttpRequest;
}

/**
 * Creates a QIDO date string for a date range query
 * Assumes the year is positive, at most 4 digits long.
 *
 * @param date The Date object to be formatted
 * @returns {string} The formatted date string
 */
function dateToString(date) {
    if (!date) return '';
    let year = date.getFullYear().toString();
    let month = (date.getMonth() + 1).toString();
    let day = date.getDate().toString();
    year = '0'.repeat(4 - year.length).concat(year);
    month = '0'.repeat(2 - month.length).concat(month);
    day = '0'.repeat(2 - day.length).concat(day);
    return ''.concat(year, month, day);
}

/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param filter
 * @param serverSupportsQIDOIncludeField
 * @returns {string} The URL with encoded filter query data
 */
function getQIDOQueryParams(filter, serverSupportsQIDOIncludeField) {
    const commaSeparatedFields = [
        '00081030', // Study Description
        '00080060' //Modality
        // Add more fields here if you want them in the result
    ].join(',');

    const parameters = {
        PatientName: filter.patientName,
        PatientID: filter.patientId,
        AccessionNumber: filter.accessionNumber,
        StudyDescription: filter.studyDescription,
        ModalitiesInStudy: filter.modalitiesInStudy,
        limit: filter.limit,
        offset: filter.offset,
        includefield: serverSupportsQIDOIncludeField ? commaSeparatedFields : 'all'
    };

    // build the StudyDate range parameter
    if (filter.studyDateFrom || filter.studyDateTo) {
        const dateFrom = dateToString(new Date(filter.studyDateFrom));
        const dateTo = dateToString(new Date(filter.studyDateTo));
        parameters.StudyDate = `${dateFrom}-${dateTo}`;
    }

    // Build the StudyInstanceUID parameter
    if (filter.studyInstanceUid) {
        let studyUids = filter.studyInstanceUid;
        studyUids = Array.isArray(studyUids) ? studyUids.join() : studyUids;
        studyUids = studyUids.replace(/[^0-9.]+/g, '\\');
        parameters.StudyInstanceUID = studyUids;
    }

    // Clean query params of undefined values.
    const params = {};
    Object.keys(parameters).forEach(key => {
        if (parameters[key] !== undefined &&
            parameters[key] !== "") {
            params[key] = parameters[key];
        }
    });

    return params;
}

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */
function resultDataToStudies(resultData) {
    const studies = [];

    if (!resultData || !resultData.length) return;

    resultData.forEach(study => studies.push({
        studyInstanceUid: DICOMWeb.getString(study['0020000D']),
        // 00080005 = SpecificCharacterSet
        studyDate: DICOMWeb.getString(study['00080020']),
        studyTime: DICOMWeb.getString(study['00080030']),
        accessionNumber: DICOMWeb.getString(study['00080050']),
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
    }));

    return studies;
}

OHIF.studies.services.QIDO.Studies = (server, filter) => {
    const config = {
        url: server.qidoRoot,
        headers: OHIF.DICOMWeb.getAuthorizationHeader()
    };

    const dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
    const queryParams = getQIDOQueryParams(filter, server.qidoSupportsIncludeField);
    const options = {
        queryParams
    };

    return dicomWeb.searchForStudies(options).then(resultDataToStudies);
};
