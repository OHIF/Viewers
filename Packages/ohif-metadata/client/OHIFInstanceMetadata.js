import { Viewerbase } from 'meteor/ohif:viewerbase';

const InstanceMetadata = Viewerbase.metadata.InstanceMetadata;

export class OHIFInstanceMetadata extends InstanceMetadata {

    /**
     * @param {Object} Instance object.
     */
    constructor(data) {
        super(data);
        this._cache = Object.create(null); // Object with null prototype for fast and safe lookups...
        this.init();
    }

    init() {
        const data = this.getData();
        // set protected property...
        this._sopInstanceUID = data.sopInstanceUid;
    }

    // Override
    getRawValue(tagOrProperty, defaultValue, bypassCache) {

        // check if this property has been cached...
        if (tagOrProperty in this._cache && bypassCache !== true) {
            return this._cache[tagOrProperty];
        }

        const propertyName = OHIFInstanceMetadata.getPropertyName(tagOrProperty);
        const data = this.getData();
        const rawValue = data[propertyName];

        if (rawValue !== void 0) {
            // if rawValue value is not undefined, cache result...
            this._cache[tagOrProperty] = rawValue;
            return rawValue;
        }

        return defaultValue;
    }

    // Override
    tagExists(tagOrProperty) {
        const propertyName = OHIFInstanceMetadata.getPropertyName(tagOrProperty);

        const data = this.getData();

        return (propertyName in data);
    }

    /**
     * Static methods
     */

    // @TODO: The current mapping of standard DICOM property names to local property names is not optimal.
    // The inconsistency in property naming makes this function increasingly complex.
    // A possible solution to improve this would be adapt retriveMetadata names to use DICOM standard names as in dicomTagDescriptions.js
    static getPropertyName(tagOrProperty) {
        let propertyName;
        const tagInfo = InstanceMetadata.getTagInfo(tagOrProperty);

        if (tagInfo.propertyName !== null) {
            // This function tries to translate standard DICOM property names into local naming convention.
            propertyName = tagInfo.propertyName.replace(/^SOP/, 'sop').replace(/UID$/, 'Uid');
            propertyName = propertyName.charAt(0).toLowerCase() + propertyName.substr(1);
        }

        return propertyName;
    }
}
