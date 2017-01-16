import { Random } from 'meteor/random';
import { Metadata } from './metadata/Metadata';
import { InstanceMetadata } from './metadata/InstanceMetadata';

export class DisplaySet {

    constructor(instances) {
      this._uid = Random.id();
      this._attributes = {};
      this._instances = [];

      if (instances instanceof Array) {
        instances.forEach( instance => this.addInstance(instance));
      }
    }

    getUID() {
      return this._uid;
    }

    /**
     * Retrieve the number of instances within the current display set.
     * @returns {number} The number of instances in the current display set.
     */
    getInstanceCount() {
        return this._instances.length;
    }

     /**
     * Find an instance by index.
     * @param {number} index An integer representing a list index.
     * @returns {InstanceMetadata} Returns a InstanceMetadata instance when found or undefined otherwise.
     */
    getInstanceByIndex(index) {
        let found; // undefined by default...
        if (Metadata.isValidIndex(index)) {
            found = this._instances[index];
        }
        return found;
    }

    /**
     * Invokes the supplied callback for each instance in the current display set passing
     * two arguments: instance (InstanceMetadata) and index (the integer index of the instance within the current display set)
     * @param {function} callback The callback function which will be invoked for each instance in the display set.
     * @returns {undefined} Nothing is returned.
     */
    forEachInstance(callback) {
        if (Metadata.isValidCallback(callback)) {
            this._instances.forEach((instance, index) => {
                callback.call(null, instance, index);
            });
        }
    }

    /**
     * Append an instance to the current series.
     * @param {InstanceMetadata} instance The instance to be added to the current series.
     * @returns {boolean} Returns true on success, false otherwise.
     */
    addInstance(instance) {
        let result = false;
        if (instance instanceof InstanceMetadata) {
            this._instances.push(instance);
            result = true;
        }
        return result;
    }

    setAttribute(attribute, value) {
        this._attributes[attribute] = value;
    }

    getAttribute(attribute) {
        return this._attributes[attribute];
    }

    setAttributes(attributes) {
        if (typeof attributes === 'object' && attributes !== null) {
            const _attributes = this._attributes;
            const hasOwn = Object.prototype.hasOwnProperty;
            for (let attribute in attributes) {
                if (hasOwn.call(attributes, attribute)) {
                    _attributes[attribute] = attributes[attribute];
                }
            }
        }
    }

}