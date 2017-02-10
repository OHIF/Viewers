import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';
// Local Dependencies
import { getStudyPriors } from './getStudyPriors';

const StudyMetadata = OHIF.viewerbase.metadata.StudyMetadata;
const StudySummary = OHIF.viewerbase.metadata.StudySummary;

/**
 * Create a Map of study priors where the key of each entry is the StudyInstanceUID and its value is an array of StudySummary instances.
 * @returns {Map} The study map.
 */
const getStudyPriorsMap = studies => {

    const priorsMap = new Map();

    if (studies instanceof Array) {
        studies.forEach(study => {
            if (study instanceof StudyMetadata || study instanceof StudySummary) {
                const studyInstanceUID = study.getStudyInstanceUID();
                if (studyInstanceUID) {
                    const priors = getStudyPriors(study);
                    priorsMap.set(studyInstanceUID, priors);
                }
            }
        });
    }

    return priorsMap;

};

export { getStudyPriorsMap };
