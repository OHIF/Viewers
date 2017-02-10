
/**
 * Constants
 */

const STRING = 'string';
const NUMBER = 'number';
const FUNCTION = 'function';
const OBJECT = 'object';

export class Metadata {

    /**
     * Constructor and Instance Methods
     */

    constructor(data) {
        // Define the main "_data" private property as an immutable property.
        // IMPORTANT: This property can only be set during instance construction.
        Object.defineProperty(this, '_data', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: data
        });

        // Define _custom properties as an immutable property
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
