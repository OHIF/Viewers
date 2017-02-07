import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

export class OHIFStudyMetadataSource extends OHIF.viewerbase.StudyMetadataSource {

    /**
     * Get study metadata for a study with given study InstanceUID
     * @param  {String} studyInstanceUID Study InstanceUID
     */
    getByInstanceUID(studyInstanceUID) {
        return new Promise((resolve, reject) => {
            getStudyMetadata(studyInstanceUID, resolve, reject);
        });
    }

}
