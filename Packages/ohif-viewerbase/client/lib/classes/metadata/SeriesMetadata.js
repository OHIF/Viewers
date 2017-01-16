import { Metadata } from './Metadata';
import { InstanceMetadata } from './InstanceMetadata';

export class SeriesMetadata extends Metadata {

    constructor(data) {
        super(data);
        this._seriesInstanceUID = null;
        this._instances = []; // InstanceMetadata[]
    }

    /**
     * Returns the SeriesInstanceUID of the current series.
     */
    getSeriesInstanceUID() {
        return this._seriesInstanceUID;
    }

    /**
     * Append an instance to the current series.
     * @param {InstanceMetadata} instance The instance to be added to the current series.
     * @returns {boolean} Returns true on success, false otherwise.
     */
    addInstance(instance) {
        let result = false;
        if (instance instanceof InstanceMetadata && this.getInstanceByUID(instance.getSOPInstanceUID()) === void 0) {
            this._instances.push(instance);
            result = true;
        }
        return result;
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
     * Find an instance by SOPInstanceUID.
     * @param {string} uid An UID string.
     * @returns {InstanceMetadata} Returns a InstanceMetadata instance when found or undefined otherwise.
     */
    getInstanceByUID(uid) {
        let found; // undefined by default...
        if (Metadata.isValidUID(uid)) {
            found = this._instances.find(instance => {
                return instance.getSOPInstanceUID() === uid;
            });
        }
        return found;
    }

    /**
     * Retrieve the number of instances within the current series.
     * @returns {number} The number of instances in the current series.
     */
    getInstanceCount() {
        return this._instances.length;
    }

    /**
     * Invokes the supplied callback for each instance in the current series passing
     * two arguments: instance (an InstanceMetadata instance) and index (the integer
     * index of the instance within the current series)
     * @param {function} callback The callback function which will be invoked for each instance in the series.
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
     * Find the index of an instance inside the series.
     * @param {InstanceMetadata} instance An instance of the SeriesMetadata class.
     * @returns {number} The index of the instance inside the series or -1 if not found.
     */
    indexOfInstance(instance) {
        return this._instances.indexOf(instance);
    }

    /**
     * Compares the current series with another one.
     * @param {SeriesMetadata} series An instance of the SeriesMetadata class.
     * @returns {boolean} Returns true if both instances refer to the same series.
     */
    equals(series) {
        const self = this;
        return (
            series === self ||
            (
                series instanceof SeriesMetadata &&
                series.getSeriesInstanceUID() === self.getSeriesInstanceUID()
            )
        );
    }

}
