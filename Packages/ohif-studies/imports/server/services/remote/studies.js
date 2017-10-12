import { OHIF } from 'meteor/ohif:core';
import { remoteGetValue } from '../../lib/remoteGetValue';

function resultDataToStudies(resultData) {
    const studies = [];

    resultData.forEach(function(study) {
        studies.push({
            studyInstanceUid: remoteGetValue(study['0020,000d']),
            // 00080005 = SpecificCharacterSet
            studyDate: remoteGetValue(study['0008,0020']),
            studyTime: remoteGetValue(study['0008,0030']),
            accessionNumber: remoteGetValue(study['0008,0050']),
            referringPhysicianName: remoteGetValue(study['0008,0090']),
            // 00081190 = URL
            patientName: remoteGetValue(study['0010,0010']),
            patientId: remoteGetValue(study['0010,0020']),
            patientBirthdate: remoteGetValue(study['0010,0030']),
            patientSex: remoteGetValue(study['0010,0040']),
            studyId: remoteGetValue(study['0020,0010']),
            numberOfStudyRelatedSeries: parseFloat(remoteGetValue(study['0020,1206'])),
            numberOfStudyRelatedInstances: parseFloat(remoteGetValue(study['0020,1208'])),
            studyDescription: remoteGetValue(study['0008,1030']),
            modalities: remoteGetValue(study['0008,0061'])
        });
    });

    return studies;
}

OHIF.studies.services.REMOTE.Studies = function(server, filter) {
    const parameters = {
        studyInstanceUID: filter.studyInstanceUid || '',
        PatientName: filter.patientName ? filter.patientName : '',
        PatientID: filter.patientId,
        AccessionNumber: filter.accessionNumber ? filter.accessionNumber : '',
        StudyDescription: '',
        StudyDate: '',
        StudyTime: '',
        ReferringPhysicianName: '',
        PatientBirthDate: '',
        PatientSex: '',
        StudyID: '',
        NumberOfStudyRelatedSeries: '',
        NumberOfStudyRelatedInstances: '',
        ModalitiesInStudy: ''
    };

    const remote = new OrthancRemote(server.root, server.sourceAE);
    const data = remote.findStudies(server.modality, parameters);

    return resultDataToStudies(data.results);
};
