import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

// Important metadata classes
const { OHIFError, metadata } = OHIF.viewerbase;
const { StudySummary, StudyMetadata } = metadata;

export class OHIFStudyMetadataSource extends OHIF.viewerbase.StudyMetadataSource {

    /**
     * Get study metadata for a study with given study InstanceUID
     * @param  {String} studyInstanceUID Study InstanceUID
     * @return {Promise} A Promise object
     */
    getByInstanceUID(studyInstanceUID) {
        return OHIF.studies.retrieveStudyMetadata(studyInstanceUID);
    }

    /**
     * Load study info (OHIF.viewer.Studies) and study metadata (OHIF.viewer.StudyMetadataList) for a given study.
     * @param {StudySummary|StudyMetadata} study of StudySummary or StudyMetadata object.
     */
    loadStudy(study) {
        if (!(study instanceof StudyMetadata) && !(study instanceof StudySummary)) {
            throw new OHIFError('OHIFStudyMetadataSource::loadStudy study is not an instance of StudySummary or StudyMetadata');
        }

        return new Promise((resolve, reject) => {
            const studyInstanceUID = study.getStudyInstanceUID();

            if (study instanceof StudyMetadata) {
                const alreadyLoaded = OHIF.viewer.Studies.findBy({
                    studyInstanceUid: studyInstanceUID
                });

                if (!alreadyLoaded) {
                    OHIFStudyMetadataSource._updateStudyCollections(study);
                }

                resolve(study);
                return;
            }

            this.getByInstanceUID(studyInstanceUID).then(studyInfo => {
                // Create study metadata object
                const studyMetadata = new OHIF.metadata.StudyMetadata(studyInfo, studyInfo.studyInstanceUid);

                // Get Study display sets
                const displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(studyMetadata);

                // Set studyMetadata display sets
                studyMetadata.setDisplaySets(displaySets);

                OHIFStudyMetadataSource._updateStudyCollections(studyMetadata);
                resolve(studyMetadata);
            }).catch(reject);
        });
    }

    // Static methods
    static _updateStudyCollections(studyMetadata) {
        const studyInfo = studyMetadata.getData();

        // Set some studyInfo properties
        studyInfo.selected = true;
        studyInfo.displaySets = studyMetadata.getDisplaySets();

        // Insert new study info object in Studies TypeSafeCollection
        OHIF.viewer.Studies.insert(studyInfo);

        // Insert new study metadata in StudyMetadataList TypeSafeCollection
        OHIF.viewer.StudyMetadataList.insert(studyMetadata);
    }

}
