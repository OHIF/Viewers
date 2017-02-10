import { DICOMTagDescriptions } from '../../DICOMTagDescriptions';

const StudyInstanceUID = 'x0020000D';

export class StudySummary {

    constructor(tagMap, propertyMap) {

        // Define the main immutable "_data" private property.
        Object.defineProperties(this, {
            _tags: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: Object.create(null)
            },
            _properties: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: Object.create(null)
            }
        });

        // Initialize internal tag map if first argument is given.
        if (tagMap !== void 0) {
            this.addTags(tagMap);
        }

        // Initialize internal property map if second argument is given.
        if (propertyMap !== void 0) {
            this.addProperties(addProperties);
        }

    }

    getStudyInstanceUID() {
        // This method should return null if StudyInstanceUID is not available to keep compatibility StudyMetadata API
        return this.getTagValue(StudyInstanceUID) || null;
    }

    addProperties(propertyMap) {
        const _hasOwn = Object.prototype.hasOwnProperty;
        const _properties = this._properties;
        for (let property in propertyMap) {
            if (_hasOwn.call(propertyMap, property)) {
                _properties[property] = propertyMap[property];
            }
        }
    }

    addTags(tagMap) {
        const _hasOwn = Object.prototype.hasOwnProperty;
        const _tags = this._tags;
        for (let tag in tagMap) {
            if (_hasOwn.call(tagMap, tag)) {
                const description = DICOMTagDescriptions.find(tag);
                // When a description is available, use its tag as internal key...
                if (description) {
                    _tags[description.tag] = tagMap[tag];
                } else {
                    _tags[tag] = tagMap[tag];
                }
            }
        }
    }

    tagExists(tagName) {
        const _tags = this._tags;
        const description = DICOMTagDescriptions.find(tagName);
        if (description) {
            return (description.tag in _tags);
        }
        return (tagName in _tags);
    }

    getTagValue(tagName) {
        const _tags = this._tags;
        const description = DICOMTagDescriptions.find(tagName);
        if (description) {
            return _tags[description.tag];
        }
        return _tags[tagName];
    }

    propertyExists(propertyName) {
        return (propertyName in this._properties);
    }

    getPropertyValue(propertyName) {
        return this._properties[propertyName];
    }

}
