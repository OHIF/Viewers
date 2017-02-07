import { OHIFError } from './OHIFError';

/**
 * Abstract class to fetch study metadata.
 */
export class StudyMetadataSource {

    /**
     * Get study metadata for a given study info
     * @param  {Object} studyInfo Study info object
     */
    getByStudyInfo(studyInfo) {
        /**
         * Please override this method on a specialized class.
         */
        throw new OHIFError('StudyMetadataSource::getByStudyInfo is not overriden. Please, override it in a specialized class. See OHIFStudyMetadataSource for example');
    }

    /**
     * Get study metadata for a study with given study InstanceUID
     * @param  {String} studyInstanceUID Study InstanceUID
     */
    getByInstanceUID(studyInstanceUID) {
        /**
         * Please override this method on a specialized class.
         */
        throw new OHIFError('StudyMetadataSource::getByInstanceUID is not overriden. Please, override it in a specialized class. See OHIFStudyMetadataSource for example');
    }
}