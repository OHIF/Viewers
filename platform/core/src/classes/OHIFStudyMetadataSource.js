import { studyMetadataManager } from '../utils';

import OHIFError from './OHIFError';
import { StudyMetadata } from './metadata/StudyMetadata';
import { StudyMetadataSource } from './StudyMetadataSource.js';
import { retrieveStudyMetadata } from '../studies/retrieveStudyMetadata.js';

export class OHIFStudyMetadataSource extends StudyMetadataSource {
  /**
   * Get study metadata for a study with given study InstanceUID
   * @param server
   * @param  {String} studyInstanceUID Study InstanceUID
   * @return {Promise} A Promise object
   */
  getByInstanceUID(server, studyInstanceUID) {
    return retrieveStudyMetadata(server, studyInstanceUID);
  }

  /**
   * Load study info (OHIF.viewer.Studies) and study metadata (OHIF.viewer.StudyMetadataList) for a given study.
   * @param {StudyMetadata} study StudyMetadata object.
   */
  loadStudy(study) {
    if (!(study instanceof StudyMetadata)) {
      throw new OHIFError(
        'OHIFStudyMetadataSource::loadStudy study is not an instance of StudyMetadata'
      );
    }

    return new Promise((resolve, reject) => {
      const studyInstanceUID = study.getStudyInstanceUID();

      if (study instanceof StudyMetadata) {
        const alreadyLoaded = OHIF.viewer.Studies.findBy({
          StudyInstanceUID: studyInstanceUID,
        });

        if (!alreadyLoaded) {
          OHIFStudyMetadataSource._updateStudyCollections(study);
        }

        resolve(study);
        return;
      }

      this.getByInstanceUID(studyInstanceUID)
        .then(studyInfo => {
          // Create study metadata object
          const studyMetadata = new StudyMetadata(
            studyInfo,
            studyInfo.StudyInstanceUID
          );

          // Get Study display sets
          const displaySets = studyMetadata.createDisplaySets();

          OHIFStudyMetadataSource._updateStudyCollections(studyMetadata);
          resolve(studyMetadata);
        })
        .catch(reject);
    });
  }

  // Static methods
  static _updateStudyCollections(studyMetadata) {
    const studyInfo = studyMetadata.getData();

    // Set some studyInfo properties
    studyInfo.selected = true;
    studyInfo.displaySets = studyMetadata.getDisplaySets();
    studyMetadataManager.add(studyMetadata);
  }
}
