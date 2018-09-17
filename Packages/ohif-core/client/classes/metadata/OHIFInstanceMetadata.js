import { Viewerbase } from 'meteor/ohif:viewerbase';

const InstanceMetadata = Viewerbase.metadata.InstanceMetadata;
const DICOMTagDescriptions = Viewerbase.DICOMTagDescriptions;

export class OHIFInstanceMetadata extends InstanceMetadata {

    /**
     * @param {Object} Instance object.
     */
    constructor(data, series, study, uid) {
        super(data, uid);
        this.init(series, study);
    }

    init(series, study) {
        const instance = this.getData();

        // Initialize Private Properties
        Object.defineProperties(this, {
            _sopInstanceUID: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: instance.sopInstanceUid
            },
            _study: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: study
            },
            _series: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: series
            },
            _instance: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: instance
            },
            _cache: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: Object.create(null)
            }
        });
    }

    // Override
    getTagValue(tagOrProperty, defaultValue, bypassCache) {

        // check if this property has been cached...
        if (tagOrProperty in this._cache && bypassCache !== true) {
            return this._cache[tagOrProperty];
        }

        const propertyName = OHIFInstanceMetadata.getPropertyName(tagOrProperty);

        // Search property value in the whole study metadata chain...
        let rawValue;
        if (propertyName in this._instance) {
            rawValue = this._instance[propertyName];
        } else if (propertyName in this._series) {
            rawValue = this._series[propertyName];
        } else if (propertyName in this._study) {
            rawValue = this._study[propertyName];
        }

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

        return (propertyName in this._instance || propertyName in this._series || propertyName in this._study);
    }

    // Override
    getImageId(frame, thumbnail) {
        // If _imageID is not cached, create it
        if (this._imageId === null) {
            this._imageId = Viewerbase.getImageId(this.getData(), frame, thumbnail);
        }

        return this._imageId;
    }

    /**
     * Static methods
     */

    // @TODO: The current mapping of standard DICOM property names to local property names is not optimal.
    // The inconsistency in property naming makes this function increasingly complex.
    // A possible solution to improve this would be adapt retriveMetadata names to use DICOM standard names as in dicomTagDescriptions.js
    static getPropertyName(tagOrProperty) {
        let propertyName;
        const tagInfo = DICOMTagDescriptions.find(tagOrProperty);

        if (tagInfo !== void 0) {
            // This function tries to translate standard DICOM property names into local naming convention.
            propertyName = tagInfo.keyword.replace(/^SOP/, 'sop').replace(/UID$/, 'Uid').replace(/ID$/, 'Id');
            propertyName = propertyName.charAt(0).toLowerCase() + propertyName.substr(1);
        }

        return propertyName;
    }
}
