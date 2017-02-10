import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';
// Local Dependencies
import { OHIFStudySummary } from './OHIFStudySummary';

const StudyMetadata = OHIF.viewerbase.metadata.StudyMetadata;
const StudySummary = OHIF.viewerbase.metadata.StudySummary;
const PatientID = 'x00100020';
const StudyDate = 'x00080020';

const getStudyPriors = study => {

    const priorStudies = [];
    let patientID;
    let studyDate;

    if (study instanceof StudyMetadata) {
        const instance = study.getFirstInstance();
        patientID = instance.getRawValue(PatientID); // PatientID
        studyDate = instance.getRawValue(StudyDate); // StudyDate
    } else if (study instanceof StudySummary) {
        patientID = study.getTagValue(PatientID); // PatientID
        studyDate = study.getTagValue(StudyDate); // StudyDate
    }

    // Find prior studies in global StudyListStudies Minimongo collection...
    const cursor = StudyListStudies.find({
        patientId: patientID,
        studyDate: {
            $lt: studyDate
        }
    }, {
        sort: {
            studyDate: 'desc'
        }
    });

    // Create an OHIFStudySummary object for each prior study found...
    cursor.forEach(study => {
        const summary = new OHIFStudySummary();
        summary.addTags(study);
        priorStudies.push(summary);
    });

    return priorStudies;

};

export { getStudyPriors };
