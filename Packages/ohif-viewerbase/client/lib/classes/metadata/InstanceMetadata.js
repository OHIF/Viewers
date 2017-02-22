import { Metadata } from './Metadata';
import { OHIFError } from '../OHIFError';

/**
 * ATTENTION! This class should never depend on StudyMetadata or SeriesMetadata classes as this could
 * possibly cause circular dependency issues.
 */

const UNDEFINED = 'undefined';
const NUMBER = 'number';
const STRING = 'string';
const STUDY_INSTANCE_UID = 'x0020000d';
const SERIES_INSTANCE_UID = 'x0020000e';

export class InstanceMetadata extends Metadata {

    constructor(data, uid) {
        super(data, uid);
        // Initialize Private Properties
        Object.defineProperties(this, {
            _sopInstanceUID: {
                configurable: true, // configurable so that it can be redefined in sub-classes...
                enumerable: false,
                writable: true,
                value: null
            },
            _imageId: {
                configurable: true, // configurable so that it can be redefined in sub-classes...
                enumerable: false,
                writable: true,
                value: null
            }
        });
        // Initialize Public Properties
        this._definePublicProperties();
    }

    /**
     * Private Methods
     */

    /**
     * Define Public Properties
     * This method should only be called during initialization (inside the class constructor)
     */
    _definePublicProperties() {

        /**
         * Property: this.sopInstanceUID
         * Same as this.getSOPInstanceUID()
         * It's specially useful in contexts where a method call is not suitable like in search criteria. For example:
         * sopInstanceCollection.findBy({
         *   sopInstanceUID: '1.2.3.4.5.6.77777.8888888.99999999999.0'
         * });
         */
        Object.defineProperty(this, 'sopInstanceUID', {
            configurable: false,
            enumerable: false,
            get: function() {
                return this.getSOPInstanceUID();
            }
        });

    }

    /**
     * Public Methods
     */

    /**
     * Returns the StudyInstanceUID of the current instance. This method is basically a shorthand the full "getTagValue" method call.
     */
    getStudyInstanceUID() {
        return this.getTagValue(STUDY_INSTANCE_UID, null);
    }

    /**
     * Returns the SeriesInstanceUID of the current instance. This method is basically a shorthand the full "getTagValue" method call.
     */
    getSeriesInstanceUID() {
        return this.getTagValue(SERIES_INSTANCE_UID, null);
    }

    /**
     * Returns the SOPInstanceUID of the current instance.
     */
    getSOPInstanceUID() {
        return this._sopInstanceUID;
    }

    // @TODO: Improve this... (E.g.: blob data)
    getStringValue(tagOrProperty, index, defaultValue) {
        let value = this.getTagValue(tagOrProperty, defaultValue);

        if (typeof value !== STRING && typeof value !== UNDEFINED) {
            value = value.toString(); 
        }

        return InstanceMetadata.getIndexedValue(value, index, defaultValue);
    }

    // @TODO: Improve this... (E.g.: blob data)
    getFloatValue(tagOrProperty, index, defaultValue) {
        let value = this.getTagValue(tagOrProperty, defaultValue);
        value = InstanceMetadata.getIndexedValue(value, index, defaultValue);

        if(value instanceof Array) {
            value.forEach( (val, idx) => {
                value[idx] = parseFloat(val);
            });
            
            return value;
        }

        return typeof value === STRING ? parseFloat(value) : value;
    }

    // @TODO: Improve this... (E.g.: blob data)
    getIntValue(tagOrProperty, index, defaultValue) {
        let value = this.getTagValue(tagOrProperty, defaultValue);
        value = InstanceMetadata.getIndexedValue(value, index, defaultValue);

        if(value instanceof Array) {
            value.forEach( (val, idx) => {
                value[idx] = parseFloat(val);
            });

            return value;
        }

        return typeof value === STRING ? parseInt(value) : value;
    }

    /**
     * @deprecated Please use getTagValue instead.
     */
    getRawValue(tagOrProperty, defaultValue) {
        return this.getTagValue(tagOrProperty, defaultValue);
    }

    /**
     * This function should be overriden by specialized classes in order to allow client libraries or viewers to take advantage of the Study Metadata API.
     */
    getTagValue(tagOrProperty, defaultValue) {
        /**
         * Please override this method on a specialized class.
         */
        throw new OHIFError('InstanceMetadata::getTagValue is not overriden. Please, override it in a specialized class. See OHIFInstanceMetadata for example');
    }

    /**
     * Compares the current instance with another one.
     * @param {InstanceMetadata} instance An instance of the InstanceMetadata class.
     * @returns {boolean} Returns true if both instances refer to the same instance.
     */
    equals(instance) {
        const self = this;
        return (
            instance === self ||
            (
                instance instanceof InstanceMetadata &&
                instance.getSOPInstanceUID() === self.getSOPInstanceUID()
            )
        );
    }

    /**
     * Check if the tagOrProperty exists
     * @param  {String} tagOrProperty tag or property be checked
     * @return {Boolean}   True if the tag or property exists or false if doesn't
     */
    tagExists(tagOrProperty) {
        /**
         * Please override this method
         */
        throw new OHIFError('InstanceMetadata::tagExists is not overriden. Please, override it in a specialized class. See OHIFInstanceMetadata for example');
    }

    /**
     * Get custom image id of a sop instance
     * @return {Any}          sop instance image id
     */
    getImageId(frame) {
        /**
         * Please override this method
         */
        throw new OHIFError('InstanceMetadata::getImageId is not overriden. Please, override it in a specialized class. See OHIFInstanceMetadata for example');
    }

    /**
     * Static Methods
     */

    /**
     * Get an value based that can be index based. This function is called by all getters. See above functions.
     *     - If value is a String and has indexes:
     *         - If undefined index: returns an array of the split values.
     *         - If defined index: 
     *             - If invalid: returns defaultValue
     *             - If valid: returns the indexed value
     *      - If value is not a String, returns default value.
     */
    static getIndexedValue(value, index, defaultValue) {
        let result = defaultValue;

        if (typeof value === STRING) {
            const hasIndexValues = value.indexOf('\\') !== -1;

            result = value;

            if(hasIndexValues) {
                const splitValues = value.split('\\');
                if (Metadata.isValidIndex(index)) {
                    const indexedValue = splitValues[index];

                    result = typeof indexedValue !== STRING ? defaultValue : indexedValue;
                }
                else {
                    result = splitValues;
                }
            }
        }

        return result;
    }

}
