
/**
 * Constants
 */

const STRING = 'string';
const NUMBER = 'number';
const FUNCTION = 'function';
const OBJECT = 'object';

/**
 * Class Definition
 */

export class Metadata {

    /**
     * Constructor and Instance Methods
     */

    constructor(data, uid) {
        // Define the main "_data" private property as an immutable property.
        // IMPORTANT: This property can only be set during instance construction.
        Object.defineProperty(this, '_data', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: data
        });

        // Define the main "_uid" private property as an immutable property.
        // IMPORTANT: This property can only be set during instance construction.
        Object.defineProperty(this, '_uid', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: uid
        });

        // Define "_custom" properties as an immutable property.
        // IMPORTANT: This property can only be set during instance construction.
        Object.defineProperty(this, '_custom', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: Object.create(null)
        });
    }

    getData() {
        return this._data;
    }

    getDataProperty(propertyName) {
        let propertyValue;
        const _data = this._data;
        if (_data instanceof Object || typeof _data === OBJECT && _data !== null) {
            propertyValue = _data[propertyName];
        }
        return propertyValue;
    }

    /**
     * Get unique object ID
     */
    getObjectID() {
        return this._uid;
    }

    /**
     * Set custom attribute value
     * @param {String} attribute Custom attribute name
     * @param {Any} value     Custom attribute value
     */
    setCustomAttribute(attribute, value) {
        this._custom[attribute] = value;
    }

    /**
     * Get custom attribute value
     * @param  {String} attribute Custom attribute name
     * @return {Any}              Custom attribute value
     */
    getCustomAttribute(attribute) {
        return this._custom[attribute];
    }

    /**
     * Check if a custom attribute exists
     * @param  {String} attribute Custom attribute name
     * @return {Boolean}          True if custom attribute exists or false if not
     */
    customAttributeExists(attribute) {
        return attribute in this._custom;
    }

    /**
     * Set custom attributes in batch mode.
     * @param {Object} attributeMap An object whose own properties will be used as custom attributes.
     */
    setCustomAttributes(attributeMap) {
        const _hasOwn = Object.prototype.hasOwnProperty;
        const _custom = this._custom;
        for (let attribute in attributeMap) {
            if (_hasOwn.call(attributeMap, attribute)) {
                _custom[attribute] = attributeMap[attribute];
            }
        }
    }

    /**
     * Static Methods
     */

    static isValidUID(uid) {
        return typeof uid === STRING && uid.length > 0;
    }

    static isValidIndex(index) {
        return typeof index === NUMBER && index >= 0 && (index | 0) === index;
    }

    static isValidCallback(callback) {
        return typeof callback === FUNCTION;
    }

}
