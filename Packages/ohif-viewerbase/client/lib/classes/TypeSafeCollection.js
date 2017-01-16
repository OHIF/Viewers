import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';

const FUNCTION = 'function';
const OBJECT = 'object';
const STRING = 'string';
const PROPERTY_SEPARATOR = '.';
const ORDER_ASC = 'asc';
const ORDER_DESC = 'desc';
const MIN_COUNT = 0x00000000;
const MAX_COUNT = 0x7FFFFFFF;

export class TypeSafeCollection {

    constructor() {
        this._operationCount = new ReactiveVar(MIN_COUNT);
        this._elementList = [];
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

    /**
     * Static Methods
     */

    /**
     * Retrieve an object's property value by name
     * @param {Object} object The object we want read the property from...
     * @param {String} propertyName The property to be read (e.g., 'address.street.name' or 'address.street.number'
     * to read object.address.street.name or object.address.street.number);
     * @returns {Any} Returns whatever the property holds or undefined if the property cannot be read or reached.
     */
    static getPropertyValue(object, propertyName) {
        let propertyValue;
        if (typeof object === OBJECT && object !== null && typeof propertyName === STRING) {
            let fragments = propertyName.split(PROPERTY_SEPARATOR),
                fragmentCount = fragments.length;
            if (fragmentCount > 0) {
                let firstFragment = fragments[0],
                    remainingFragments = fragmentCount > 1 ? fragments.slice(1).join(PROPERTY_SEPARATOR) : null;
                propertyValue = object[firstFragment];
                if (remainingFragments !== null) {
                    propertyValue = TypeSafeCollection.getPropertyValue(propertyValue, remainingFragments);
                }
            }
        }
        return propertyValue;
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
    static isValidSortingSpecifier(specifiers) {
        let result = true;
        if (specifiers instanceof Array && specifiers.length > 0) {
            for (let i = specifiers.length - 1; i >= 0; i--) {
                const item = specifiers[i];
                if (item instanceof Array) {
                    const property = item[0];
                    const order = item[1];
                    if (typeof property === STRING && (order === ORDER_ASC || order === ORDER_DESC)) {
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
    static sortListBy(list, specifiers) {
        const thisClass = TypeSafeCollection;
        if (list instanceof Array && thisClass.isValidSortingSpecifier(specifiers)) {
            const getPropertyValue = thisClass.getPropertyValue;
            const specifierCount = specifiers.length;
            list.sort((a, b) => {
                let index = 0;
                while (index < specifierCount) {
                    const specifier = specifiers[index];
                    const property = specifier[0];
                    const order = specifier[1] === ORDER_DESC ? -1 : 1;
                    const aValue = getPropertyValue(a, property);
                    const bValue = getPropertyValue(b, property);
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
            throw new Error('TypeSafeCollection::sortListBy Invalid Arguments');
        }
    }

    /**
     * Public Methods
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

    insert(payload) {
        let id = null,
            found = this._elementWithPayload(payload, true);
        if (!found) {
            id = Random.id();
            this._elements(true).push({ id, payload });
            this._invalidate();
        }
        return id;
    }

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

    remove(propertyMap) {
        let found = this.findAllBy(propertyMap),
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

    getElementId(payload) {
        let found = this._elementWithPayload(payload);
        return found && found.id;
    }

    findById(id) {
        let found = this._elementWithId(id);
        return found && found.payload;
    }

    indexOfElement(payload) {
        return this._elements().indexOf(this._elementWithPayload(payload, true));
    }

    indexOfId(id) {
        return this._elements().indexOf(this._elementWithId(id, true));
    }

    getElementByIndex(index) {
        let found = ((this._elements())[index >= 0 ? index : -1]);
        return found && found.payload;
    }

    // the reactive var will not be notified if no valid callback is supplied...
    find(callback) {
        let found;
        if (typeof callback === FUNCTION) {
            found = this._elements().find((item, index) => {
                return callback.call(this, item.payload, index);
            });
        }
        return found && found.payload;
    }

    // the reactive var will not be notified if no valid property map is supplied...
    findBy(propertyMap) {
        let found;
        if (typeof propertyMap === OBJECT && propertyMap !== null) {
            const hasOwn = Object.prototype.hasOwnProperty;
            found = this._elements().find(item => {
                const payload = item.payload;
                for (let propertyName in propertyMap) {
                    if (hasOwn.call(propertyMap, propertyName)) {
                        if (propertyMap[propertyName] !== TypeSafeCollection.getPropertyValue(payload, propertyName)) {
                            return false;
                        }
                    }
                }
                return true;
            });
        }
        return found && found.payload;
    }

    /**
     * Find all elements that match a specified property map.
     * Attention!!! The reactive source will not be notified if no valid property map is supplied...
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @param {Object} options A set of options. Currently only "options.sort" option is supported.
     * @param {Object.SortingSpecifier} options.sort An optional sorting specifier. If a sorting specifier is supplied
     * but it's not valid, an exception will be thrown.
     * @returns {Array} An array with all elements stored in the collection.
     */
    findAllBy(propertyMap, options) {
        let found = [];
        if (typeof propertyMap === OBJECT && propertyMap !== null) {
            const hasOwn = Object.prototype.hasOwnProperty;
            this._elements().forEach((item, index) => {
                const payload = item.payload;
                for (let propertyName in propertyMap) {
                    if (hasOwn.call(propertyMap, propertyName)) {
                        if (propertyMap[propertyName] !== TypeSafeCollection.getPropertyValue(payload, propertyName)) {
                            return; // skip this element since it does not match the criteria...
                        }
                    }
                }
                // Match! Add it to the found list...
                found.push([ payload, item.id, index ]);
            });
        }
        if (options instanceof Object && 'sort' in options) {
            TypeSafeCollection.sortListBy(found, options.sort);
        }
        return found;
    }

    // the reactive var will not be notified if no valid callback is supplied...
    forEach(callback) {
        if (typeof callback === FUNCTION) {
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
     * but it's not valid, an exception will be thrown.
     * @returns {Array} An array with all elements stored in the collection.
     */
    all(options) {
        let list = this._elements().map(item => item.payload);
        if (options instanceof Object && 'sort' in options) {
            TypeSafeCollection.sortListBy(list, options.sort);
        }
        return list;
    }

}
