
/**
 * Constants
 */

const STRING = 'string';
const NUMBER = 'number';
const FUNCTION = 'function';

export class Metadata {

    /**
     * Constructor and Instance Methods
     */

    constructor(data) {
        this._data = data;
    }

    getData() {
        return this._data;
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
