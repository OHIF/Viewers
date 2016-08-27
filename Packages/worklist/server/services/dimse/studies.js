/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */
function resultDataToStudies(resultData) {
    var studies = [];

    resultData.forEach(function(studyRaw) {
        var study = studyRaw.toObject();
        studies.push({
            studyInstanceUid: study[0x0020000D],
            // 00080005 = SpecificCharacterSet
            studyDate: study[0x00080020],
            studyTime: study[0x00080030],
            accessionNumber: study[0x00080050],
            referringPhysicianName: study[0x00080090],
            // 00081190 = URL
            patientName: study[0x00100010],
            patientId: study[0x00100020],
            patientBirthdate: study[0x00100030],
            patientSex: study[0x00100040],
            imageCount: study[0x00201208],
            studyId: study[0x00200010],
            studyDescription: study[0x00081030],
            modalities: study[0x00080061]
        });
    });
    return studies;
}

Services.DIMSE.Studies = function(filter) {
    log.info('Services.DIMSE.Studies');
    var parameters = {
        0x00100010: filter.patientName,
        0x00100020: filter.patientId,
        0x00080050: filter.accessionNumber,
        0x00081030: filter.studyDescription,
        0x00100040: '',
        0x00201208: '',
        0x00080061: ''
    };

    var results = DIMSE.retrieveStudies(parameters);
    return resultDataToStudies(results);
};
