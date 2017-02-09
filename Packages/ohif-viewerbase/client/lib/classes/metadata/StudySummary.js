
class StudySummary {

    constructor(propertyMap) {

        // Define the main immutable "_data" private property.
        Object.defineProperty(this, '_data', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: Object.create(null)
        });

        const hasOwn = Object.prototype.hasOwnProperty;
        const data = this._data;
        for (let property in propertyMap) {
            if (hasOwn.call(propertyMap, property)) {
                data[property] = propertyMap[property];
            }
        }

    }

    propertyExists(propertyName) {
        const internalPropertyName = this.getInternalPropertyName(propertyName);
        return (internalPropertyName in this._data);
    }

    getPropertyValue(propertyName) {
        const internalPropertyName = this.getInternalPropertyName(propertyName);
        return this._data[internalPropertyName];
    }

    /**
     * This function is supposed to translate external property names into internal property names.
     * By default it implements the simplest translation possible. For 
     */
    getInternalPropertyName(propertyName) {
        return propertyName;
    }

}
