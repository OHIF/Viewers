import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

const { StudyMetadata, StudySummary } = OHIF.viewerbase.metadata;
const PATIENT_ID = 'x00100020';
const STUDY_DATE = 'x00080020';

/**
 * Get the priors of a given study
 * @param  {StudyMetadata|StudySummary} study An instance of StudyMetadata|StudySummary class to get it's priors
 * @return {Array}       An Array of StudySummary objects representing the study priors for the given study or an empty array if none
 */
const getStudyPriors = study => {

    if (!(study instanceof StudyMetadata) && !(study instanceof StudySummary)) {
        throw new OHIF.viewerbase.OHIFError('getStudyPriors study must be an instance of StudySummary or StudyMetadata');
    }

    if (study instanceof StudyMetadata) {
        study = study.getFirstInstance();
    }

    const priorStudies = [];
    const patientID = study.getTagValue(PATIENT_ID); // PatientID
    const studyDate = study.getTagValue(STUDY_DATE); // StudyDate

    // Find prior studies in global Studies Minimongo collection
    const cursor = OHIF.studylist.collections.Studies.find({
        patientId: patientID,
        studyDate: {
            $lt: studyDate
        }
    }, {
        sort: {
            studyDate: 'desc'
        }
    });

    // Create an OHIFStudySummary object for each prior study found
    cursor.forEach(study => {
        const summary = new OHIF.studies.classes.OHIFStudySummary(study, null, study.studyInstanceUid);
        priorStudies.push(summary);
    });

    return priorStudies;

};

export { getStudyPriors };
