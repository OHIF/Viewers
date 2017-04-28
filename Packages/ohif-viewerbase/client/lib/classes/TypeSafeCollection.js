import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';

/**
 * Constants
 */

const PROPERTY_SEPARATOR = '.';
const ORDER_ASC = 'asc';
const ORDER_DESC = 'desc';
const MIN_COUNT = 0x00000000;
const MAX_COUNT = 0x7FFFFFFF;

/**
 * Class Definition
 */

export class TypeSafeCollection {

    constructor() {
        this._operationCount = new ReactiveVar(MIN_COUNT);
        this._elementList = [];
        this._handlers = Object.create(null);
    }

    /**
     * Private Methods
     */

    _invalidate() {
        let count = this._operationCount.get();
        this._operationCount.set(count < MAX_COUNT ? count + 1 : MIN_COUNT);
    }

    _elements(silent) {
        (silent === true || this._operationCount.get());
        return this._elementList;
    }

    _elementWithPayload(payload, silent) {
        return this._elements(silent).find(item => item.payload === payload);
    }

    _elementWithId(id, silent) {
        return this._elements(silent).find(item => item.id === id);
    }

    _trigger(event, data) {
        let handlers = this._handlers;
        if (event in handlers) {
            handlers = handlers[event];
            if (!(handlers instanceof Array)) {
                return;
            }
            for (let i = 0, limit = handlers.length; i < limit; ++i) {
                let handler = handlers[i];
                if (_isFunction(handler)) {
                    handler.call(null, data);
                }
            }
        }
    }

    /**
     * Public Methods
     */

    onInsert(callback) {
        if (_isFunction(callback)) {
            let handlers = this._handlers.insert;
            if (!(handlers instanceof Array)) {
                handlers = [];
                this._handlers.insert = handlers;
            }
            handlers.push(callback);
        }
    }

    /**
     * Update the payload associated with the given ID to be the new supplied payload.
     * @param {string} id The ID of the entry that will be updated.
     * @param {any} payload The element that will replace the previous payload.
     * @returns {boolean} Returns true if the given ID is present in the collection, false otherwise.
     */
    updateById(id, payload) {
        let result = false,
            found = this._elementWithPayload(payload, true);
        if (found) {
            // nothing to do since the element is already in the collection...
            if (found.id === id) {
                // set result to true since the ids match...
                result = true;
                this._invalidate();
            }
        } else {
            found = this._elementWithId(id, true);
            if (found) {
                found.payload = payload;
                result = true;
                this._invalidate();
            }
        }
        return result;
    }

    /**
     * Signal that the given element has been changed by notifying reactive data-source observers.
     * This method is basically a means to invalidate the inernal reactive data-source.
     * @param {any} payload The element that has been altered.
     * @returns {boolean} Returns true if the element is present in the collection, false otherwise.
     */
    update(payload) {
        let result = false,
            found = this._elementWithPayload(payload, true);
        if (found) {
            // nothing to do since the element is already in the collection...
            result = true;
            this._invalidate();
        }
        return result;
    }

    /**
     * Insert an element in the collection. On success, the element ID (a unique string) is returned. On failure, returns null.
     * A failure scenario only happens when the given payload is already present in the collection. Note that NO exceptions are thrown!
     * @param {any} payload The element to be stored.
     * @returns {string} The ID of the inserted element or null if the element already exists...
     */
    insert(payload) {
        let id = null,
            found = this._elementWithPayload(payload, true);
        if (!found) {
            id = Random.id();
            this._elements(true).push({ id, payload });
            this._invalidate();
            this._trigger('insert', { id, data: payload });
        }
        return id;
    }

    /**
     * Remove all elements from the collection.
     * @returns {void} No meaningful value is returned.
     */
    removeAll() {
        let all = this._elements(true),
            length = all.length;
        for (let i = length - 1; i >= 0; i--) {
            let item = all[i];
            delete item.id;
            delete item.payload;
            all[i] = null;
        }
        all.splice(0, length);
        this._invalidate();
    }

    /**
     * Remove elements from the collection that match the criteria given in the property map.
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @returns {Array} A list with all removed elements.
     */
    remove(propertyMap) {
        let found = this.findAllEntriesBy(propertyMap),
            foundCount = found.length,
            removed = [];
        if (foundCount > 0) {
            const all = this._elements(true);
            for (let i = foundCount - 1; i >= 0; i--) {
                let item = found[i];
                all.splice(item[2], 1);
                removed.push(item[0]);
            }
            this._invalidate();
        }
        return removed;
    }

    /**
     * Provides the ID of the given element inside the collection.
     * @param {any} payload The element being searched for.
     * @returns {string} The ID of the given element or undefined if the element is not present.
     */
    getElementId(payload) {
        let found = this._elementWithPayload(payload);
        return found && found.id;
    }

    /**
     * Provides the position of the given element in the internal list returning -1 if the element is not present.
     * @param {any} payload The element being searched for.
     * @returns {number} The position of the given element in the internal list. If the element is not present -1 is returned.
     */
    findById(id) {
        let found = this._elementWithId(id);
        return found && found.payload;
    }

    /**
     * Provides the position of the given element in the internal list returning -1 if the element is not present.
     * @param {any} payload The element being searched for.
     * @returns {number} The position of the given element in the internal list. If the element is not present -1 is returned.
     */
    indexOfElement(payload) {
        return this._elements().indexOf(this._elementWithPayload(payload, true));
    }

    /**
     * Provides the position of the element associated with the given ID in the internal list returning -1 if the element is not present.
     * @param {string} id The index of the element.
     * @returns {number} The position of the element associated with the given ID in the internal list. If the element is not present -1 is returned.
     */
    indexOfId(id) {
        return this._elements().indexOf(this._elementWithId(id, true));
    }

    /**
     * Provides a list-like approach to the collection returning an element by index.
     * @param {number} index The index of the element.
     * @returns {any} If out of bounds, undefined is returned. Otherwise the element in the given position is returned.
     */
    getElementByIndex(index) {
        let found = ((this._elements())[index >= 0 ? index : -1]);
        return found && found.payload;
    }

    /**
     * Find an element by a criteria defined by the given callback function.
     * Attention!!! The reactive source will not be notified if no valid callback is supplied...
     * @param {function} callback A callback function which will define the search criteria. The callback
     * function will be passed the collection element, its ID and its index in this very order. The callback
     * shall return true when its criterea has been fulfilled.
     * @returns {any} The matched element or undefined if not match was found.
     */
    find(callback) {
        let found;
        if (_isFunction(callback)) {
            found = this._elements().find((item, index) => {
                return callback.call(this, item.payload, item.id, index);
            });
        }
        return found && found.payload;
    }

    /**
     * Find the first element that strictly matches the specified property map.
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @param {Object} options A set of options. Currently only "options.sort" option is supported.
     * @param {Object.SortingSpecifier} options.sort An optional sorting specifier. If a sorting specifier is supplied
     * but is not valid, an exception will be thrown.
     * @returns {Any} The matched element or undefined if not match was found.
     */
    findBy(propertyMap, options) {
        let found;
        if (_isObject(options)) {
            // if the "options" argument is provided and is a valid object,
            // it must be applied to the dataset before search...
            const all = this.all(options);
            if (all.length > 0) {
                if (_isObject(propertyMap)) {
                    found = all.find(item => _compareToPropertyMapStrict(propertyMap, item));
                } else {
                    found = all[0]; // simply extract the first element...
                }
            }
        } else if (_isObject(propertyMap)) {
            found = this._elements().find(item => _compareToPropertyMapStrict(propertyMap, item.payload));
            if (found) {
                found = found.payload;
            }
        }
        return found;
    }

    /**
     * Find all elements that strictly match the specified property map.
     * Attention!!! The reactive source will not be notified if no valid property map is supplied...
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @returns {Array} An array of entries of all elements that match the given criteria. Each set in
     * in the array has the following format: [ elementData, elementId, elementIndex ].
     */
    findAllEntriesBy(propertyMap) {
        const found = [];
        if (_isObject(propertyMap)) {
            this._elements().forEach((item, index) => {
                if (_compareToPropertyMapStrict(propertyMap, item.payload)) {
                    // Match! Add it to the found list...
                    found.push([ item.payload, item.id, index ]);
                }
            });
        }
        return found;
    }

    /**
     * Find all elements that match a specified property map.
     * Attention!!! The reactive source will not be notified if no valid property map is supplied...
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @param {Object} options A set of options. Currently only "options.sort" option is supported.
     * @param {Object.SortingSpecifier} options.sort An optional sorting specifier. If a sorting specifier is supplied
     * but is not valid, an exception will be thrown.
     * @returns {Array} An array with all elements that match the given criteria and sorted in the specified sorting order.
     */
    findAllBy(propertyMap, options) {
        const found = this.findAllEntriesBy(propertyMap).map(item => item[0]); // Only payload is relevant...
        if (_isObject(options)) {
            if ('sort' in options) {
                _sortListBy(found, options.sort);
            }
        }
        return found;
    }

    /**
     * Executes the supplied callback function for each element of the collection.
     * Attention!!! The reactive source will not be notified if no valid property map is supplied...
     * @param {function} callback The callback function to be executed. The callback is passed the element,
     * its ID and its index in this very order.
     * @returns {void} Nothing is returned.
     */
    forEach(callback) {
        if (_isFunction(callback)) {
            this._elements().forEach((item, index) => {
                callback.call(this, item.payload, item.id, index);
            });
        }
    }

    /**
     * Count the number of elements currently in the collection.
     * @returns {number} The current number of elements in the collection.
     */
    count() {
        return this._elements().length;
    }

    /**
     * Returns a list with all elements of the collection optionally sorted by a sorting specifier criteria.
     * @param {Object} options A set of options. Currently only "options.sort" option is supported.
     * @param {Object.SortingSpecifier} options.sort An optional sorting specifier. If a sorting specifier is supplied
     * but is not valid, an exception will be thrown.
     * @returns {Array} An array with all elements stored in the collection.
     */
    all(options) {
        let list = this._elements().map(item => item.payload);
        if (_isObject(options)) {
            if ('sort' in options) {
                _sortListBy(list, options.sort);
            }
        }
        return list;
    }

}

/**
 * Utility Functions
 */

/**
 * Test if supplied argument is a valid object for current class purposes.
 * Atention! The underscore version of this function should not be used for performance reasons.
 */
function _isObject(subject) {
    return subject instanceof Object || typeof subject === 'object' && subject !== null;
}

/**
 * Test if supplied argument is a valid string for current class purposes.
 * Atention! The underscore version of this function should not be used for performance reasons.
 */
function _isString(subject) {
    return typeof subject === 'string';
}

/**
 * Test if supplied argument is a valid function for current class purposes.
 * Atention! The underscore version of this function should not be used for performance reasons.
 */
function _isFunction(subject) {
    return typeof subject === 'function';
}

/**
 * Shortcut for Object's prototype "hasOwnProperty" method.
 */
const _hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Retrieve an object's property value by name. Composite property names (e.g., 'address.country.name') are accepted.
 * @param {Object} targetObject The object we want read the property from...
 * @param {String} propertyName The property to be read (e.g., 'address.street.name' or 'address.street.number'
 * to read object.address.street.name or object.address.street.number, respectively);
 * @returns {Any} Returns whatever the property holds or undefined if the property cannot be read or reached.
 */
function _getPropertyValue(targetObject, propertyName) {
    let propertyValue; // undefined (the default return value)
    if (_isObject(targetObject) && _isString(propertyName)) {
        const fragments = propertyName.split(PROPERTY_SEPARATOR);
        const fragmentCount = fragments.length;
        if (fragmentCount > 0) {
            const firstFragment = fragments[0];
            const remainingFragments = fragmentCount > 1 ? fragments.slice(1).join(PROPERTY_SEPARATOR) : null;
            propertyValue = targetObject[firstFragment];
            if (remainingFragments !== null) {
                propertyValue = _getPropertyValue(propertyValue, remainingFragments);
            }
        }
    }
    return propertyValue;
}

/**
 * Compare a property map with a target object using strict comparison.
 * @param {Object} propertyMap The property map whose properties will be used for comparison. Composite
 * property names (e.g., 'address.country.name') will be tested against the "resolved" properties from the target object.
 * @param {Object} targetObject The target object whose properties will be tested.
 * @returns {boolean} Returns true if the properties match, false otherwise.
 */
function _compareToPropertyMapStrict(propertyMap, targetObject) {
    let result = false;
    // "for in" loops do not thown exceptions for invalid data types...
    for (let propertyName in propertyMap) {
        if (_hasOwnProperty.call(propertyMap, propertyName)) {
            if (propertyMap[propertyName] !== _getPropertyValue(targetObject, propertyName)) {
                result = false;
                break;
            } else if (result !== true) {
                result = true;
            }
        }
    }
    return result;
}

/**
 * Checks if a sorting specifier is valid.
 * A valid sorting specifier consists of an array of arrays being each subarray a pair
 * in the format ["property name", "sorting order"].
 * The following exemple can be used to sort studies by "date"" and use "time" to break ties in descending order.
 * [ [ 'study.date', 'desc' ], [ 'study.time', 'desc' ] ]
 * @param {Array} specifiers The sorting specifier to be tested.
 * @returns {boolean} Returns true if the specifiers are valid, false otherwise.
 */
function _isValidSortingSpecifier(specifiers) {
    let result = true;
    if (specifiers instanceof Array && specifiers.length > 0) {
        for (let i = specifiers.length - 1; i >= 0; i--) {
            const item = specifiers[i];
            if (item instanceof Array) {
                const property = item[0];
                const order = item[1];
                if (_isString(property) && (order === ORDER_ASC || order === ORDER_DESC)) {
                    continue;
                }
            }
            result = false;
            break;
        }
    }
    return result;
}

/**
 * Sorts an array based on sorting specifier options.
 * @param {Array} list The that needs to be sorted.
 * @param {Array} specifiers An array of specifiers. Please read isValidSortingSpecifier method definition for further details.
 * @returns {void} No value is returned. The array is sorted in place.
 */
function _sortListBy(list, specifiers) {
    if (list instanceof Array && _isValidSortingSpecifier(specifiers)) {
        const specifierCount = specifiers.length;
        list.sort(function _sortListByCallback(a, b) { // callback name for stack traces...
            let index = 0;
            while (index < specifierCount) {
                const specifier = specifiers[index];
                const property = specifier[0];
                const order = specifier[1] === ORDER_DESC ? -1 : 1;
                const aValue = _getPropertyValue(a, property);
                const bValue = _getPropertyValue(b, property);
                // @TODO: should we check for the types being compared, like:
                // ~~ if (typeof aValue !== typeof bValue) continue;
                // Not sure because dates, for example, can be correctly compared to numbers...
                if (aValue < bValue) {
                    return order * -1;
                }
                if (aValue > bValue) {
                    return order * 1;
                }
                if (++index >= specifierCount) {
                    return 0;
                }
            }
        });
    } else {
        throw new Error('Invalid Arguments');
    }
}
