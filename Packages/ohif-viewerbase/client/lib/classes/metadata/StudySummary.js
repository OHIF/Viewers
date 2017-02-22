import { Metadata } from './Metadata';
import { OHIFError } from '../OHIFError';
import { DICOMTagDescriptions } from '../../DICOMTagDescriptions';

/**
 * Constants
 */

const STUDY_INSTANCE_UID = 'x0020000d';

/**
 * Class Definition
 */

export class StudySummary extends Metadata {

    constructor(tagMap, attributeMap, uid) {

        // Call the superclass constructor passing an plain object with no prototype to be used as the main "_data" attribute.
        const _data = Object.create(null);
        super(_data, uid);

        // Initialize internal tag map if first argument is given.
        if (tagMap !== void 0) {
            this.addTags(tagMap);
        }

        // Initialize internal property map if second argument is given.
        if (attributeMap !== void 0) {
            this.setCustomAttributes(attributeMap);
        }

    }

    getStudyInstanceUID() {
        // This method should return null if StudyInstanceUID is not available to keep compatibility StudyMetadata API
        return this.getTagValue(STUDY_INSTANCE_UID) || null;
    }

    /**
     * Append tags to internal tag map.
     * @param {Object} tagMap An object whose own properties will be used as tag values and appended to internal tag map.
     */
    addTags(tagMap) {
        const _hasOwn = Object.prototype.hasOwnProperty;
        const _data = this._data;
        for (let tag in tagMap) {
            if (_hasOwn.call(tagMap, tag)) {
                const description = DICOMTagDescriptions.find(tag);
                // When a description is available, use its tag as internal key...
                if (description) {
                    _data[description.tag] = tagMap[tag];
                } else {
                    _data[tag] = tagMap[tag];
                }
            }
        }
    }

    tagExists(tagName) {
        const _data = this._data;
        const description = DICOMTagDescriptions.find(tagName);
        if (description) {
            return (description.tag in _data);
        }
        return (tagName in _data);
    }

    getTagValue(tagName) {
        const _data = this._data;
        const description = DICOMTagDescriptions.find(tagName);
        if (description) {
            return _data[description.tag];
        }
        return _data[tagName];
    }

}
