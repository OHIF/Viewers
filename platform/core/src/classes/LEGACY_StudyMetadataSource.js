import OHIFError from './OHIFError';

/**
 * Abstract class to fetch study metadata.
 */
export class StudyMetadataSource {
  /**
   * Get study metadata for a study with given study InstanceUID.
   * @param {String} studyInstanceUID Study InstanceUID.
   */
  getByInstanceUID(studyInstanceUID) {
    /**
     * Please override this method on a specialized class.
     */
    throw new OHIFError(
      'StudyMetadataSource::getByInstanceUID is not overriden. Please, override it in a specialized class. See OHIFStudyMetadataSource for example'
    );
  }

  /**
   * Load study info and study metadata for a given study into the viewer.
   * @param {StudyMetadata} study StudyMetadata object.
   */
  loadStudy(study) {
    /**
     * Please override this method on a specialized class.
     */
    throw new OHIFError(
      'StudyMetadataSource::loadStudy is not overriden. Please, override it in a specialized class. See OHIFStudyMetadataSource for example'
    );
  }
}
