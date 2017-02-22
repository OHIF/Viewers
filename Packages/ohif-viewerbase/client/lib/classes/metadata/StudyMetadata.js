import { Metadata } from './Metadata';
import { SeriesMetadata } from './SeriesMetadata';
import { InstanceMetadata } from './InstanceMetadata';
import { ImageSet } from '../ImageSet';
import { OHIFError } from '../OHIFError';

export class StudyMetadata extends Metadata {

    constructor(data, uid) {
        super(data, uid);
        // Initialize Private Properties
        Object.defineProperties(this, {
            _studyInstanceUID: {
                configurable: true, // configurable so that it can be redefined in sub-classes...
                enumerable: false,
                writable: true,
                value: null
            },
            _series: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: []
            },
            _displaySets: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: []
            },
            _firstSeries: {
                configurable: false,
                enumerable: false,
                writable: true,
                value: null
            },
            _firstInstance: {
                configurable: false,
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
         * Property: this.studyInstanceUID
         * Same as this.getStudyInstanceUID()
         * It's specially useful in contexts where a method call is not suitable like in search criteria. For example:
         * studyCollection.findBy({
         *   studyInstanceUID: '1.2.3.4.5.6.77777.8888888.99999999999.0'
         * });
         */
        Object.defineProperty(this, 'studyInstanceUID', {
            configurable: false,
            enumerable: false,
            get: function() {
                return this.getStudyInstanceUID();
            }
        });

    }

    /**
     * Public Methods
     */

    /**
     * Getter for displaySets
     * @return {Array} Array of display set object
     */
    getDisplaySets() {
        return this._displaySets.slice();
    }

    /**
     * Set display sets
     * @param {Array} displaySets Array of display sets (ImageSet[])
     */
    setDisplaySets(displaySets) {
        displaySets.forEach(displaySet => this.addDisplaySet(displaySet));
    }

    /**
     * Add a single display set to the list
     * @param {Object} displaySet Display set object
     * @returns {boolean} True on success, false on failure.
     */
    addDisplaySet(displaySet) {
        if (displaySet instanceof ImageSet) {
            this._displaySets.push(displaySet);
            return true;
        }
        return false;
    }

    /**
     * Invokes the supplied callback for each display set in the current study passing
     * two arguments: display set (a ImageSet instance) and index (the integer
     * index of the display set within the current study)
     * @param {function} callback The callback function which will be invoked for each display set instance.
     * @returns {undefined} Nothing is returned.
     */
    forEachDisplaySet(callback) {
        if (Metadata.isValidCallback(callback)) {
            this._displaySets.forEach((displaySet, index) => {
                callback.call(null, displaySet, index);
            });
        }
    }

    /**
     * Search the associated display sets using the supplied callback as criteria. The callback is passed
     * two arguments: display set (a ImageSet instance) and index (the integer
     * index of the display set within the current study)
     * @param {function} callback The callback function which will be invoked for each display set instance.
     * @returns {undefined} Nothing is returned.
     */
    findDisplaySet(callback) {
        if (Metadata.isValidCallback(callback)) {
            return this._displaySets.find((displaySet, index) => {
                return callback.call(null, displaySet, index);
            });
        }
    }

    /**
     * Retrieve the number of display sets within the current study.
     * @returns {number} The number of display sets in the current study.
     */
    getDisplaySetCount() {
        return this._displaySets.length;
    }

    /**
     * Returns the StudyInstanceUID of the current study.
     */
    getStudyInstanceUID() {
        return this._studyInstanceUID;
    }

    /**
     * Getter for series
     * @return {Array} Array of SeriesMetadata object
     */
    getSeries() {
        return this._series.slice();
    }

    /**
     * Append a series to the current study.
     * @param {SeriesMetadata} series The series to be added to the current study.
     * @returns {boolean} Returns true on success, false otherwise.
     */
    addSeries(series) {
        let result = false;
        if (series instanceof SeriesMetadata && this.getSeriesByUID(series.getSeriesInstanceUID()) === void 0) {
            this._series.push(series);
            result = true;
        }
        return result;
    }

    /**
     * Find a series by index.
     * @param {number} index An integer representing a list index.
     * @returns {SeriesMetadata} Returns a SeriesMetadata instance when found or undefined otherwise.
     */
    getSeriesByIndex(index) {
        let found; // undefined by default...
        if (Metadata.isValidIndex(index)) {
            found = this._series[index];
        }
        return found;
    }

    /**
     * Find a series by SeriesInstanceUID.
     * @param {string} uid An UID string.
     * @returns {SeriesMetadata} Returns a SeriesMetadata instance when found or undefined otherwise.
     */
    getSeriesByUID(uid) {
        let found; // undefined by default...
        if (Metadata.isValidUID(uid)) {
            found = this._series.find(series => {
                return series.getSeriesInstanceUID() === uid;
            });
        }
        return found;
    }

    /**
     * Retrieve the number of series within the current study.
     * @returns {number} The number of series in the current study.
     */
    getSeriesCount() {
        return this._series.length;
    }

    /**
     * Retrieve the number of instances within the current study.
     * @returns {number} The number of instances in the current study.
     */
    getInstanceCount() {
        return this._series.reduce((sum, series) => {
            return sum + series.getInstanceCount();
        }, 0);
    }

    /**
     * Invokes the supplied callback for each series in the current study passing
     * two arguments: series (a SeriesMetadata instance) and index (the integer
     * index of the series within the current study)
     * @param {function} callback The callback function which will be invoked for each series instance.
     * @returns {undefined} Nothing is returned.
     */
    forEachSeries(callback) {
        if (Metadata.isValidCallback(callback)) {
            this._series.forEach((series, index) => {
                callback.call(null, series, index);
            });
        }
    }

    /**
     * Find the index of a series inside the study.
     * @param {SeriesMetadata} series An instance of the SeriesMetadata class.
     * @returns {number} The index of the series inside the study or -1 if not found.
     */
    indexOfSeries(series) {
        return this._series.indexOf(series);
    }

    /**
     * It sorts the series based on display sets order. Each series must be an instance 
     * of SeriesMetadata and each display sets must be an instance of ImageSet.
     * Useful example of usage: 
     *     Study data provided by backend does not sort series at all and client-side 
     *     needs series sorted by the same criteria used for sorting display sets.
     */
    sortSeriesByDisplaySets() {

        // Object for mapping display sets' index by seriesInstanceUid
        const displaySetsMapping = {};

        // Loop through each display set to create the mapping
        this.forEachDisplaySet( (displaySet, index) => {

            if (!(displaySet instanceof ImageSet)) {
              throw new OHIFError(`StudyMetadata::sortSeriesByDisplaySets display set at index ${index} is not an instance of ImageSet`);
            }

            // In case of multiframe studies, just get the first index occurence
            if (displaySetsMapping[displaySet.seriesInstanceUid] === void 0) {
                displaySetsMapping[displaySet.seriesInstanceUid] = index;
            }
        });

        // Clone of actual series
        const actualSeries = this.getSeries();

        actualSeries.forEach( (series, index) => {

            if (!(series instanceof SeriesMetadata)) {
              throw new OHIFError(`StudyMetadata::sortSeriesByDisplaySets series at index ${index} is not an instance of SeriesMetadata`);
            }

            // Get the new series index
            const seriesIndex = displaySetsMapping[series.getSeriesInstanceUID()];

            // Update the series object with the new series position
            this._series[seriesIndex] = series;
        });
    }

    /**
     * Compares the current study instance with another one.
     * @param {StudyMetadata} study An instance of the StudyMetadata class.
     * @returns {boolean} Returns true if both instances refer to the same study.
     */
    equals(study) {
        const self = this;
        return (
            study === self ||
            (
                study instanceof StudyMetadata &&
                study.getStudyInstanceUID() === self.getStudyInstanceUID()
            )
        );
    }

    /**
     * Get the first series of the current study retaining a consistent result across multiple calls.
     * @return {SeriesMetadata} An instance of the SeriesMetadata class or null if it does not exist.
     */
    getFirstSeries() {
        let series = this._firstSeries;
        if (!(series instanceof SeriesMetadata)) {
            series = null;
            const found = this.getSeriesByIndex(0);
            if (found instanceof SeriesMetadata) {
                this._firstSeries = found;
                series = found;
            }
        }
        return series;
    }

    /**
     * Get the first instance of the current study retaining a consistent result across multiple calls.
     * @return {InstanceMetadata} An instance of the InstanceMetadata class or null if it does not exist.
     */
    getFirstInstance() {
        let instance = this._firstInstance;
        if (!(instance instanceof InstanceMetadata)) {
            instance = null;
            const firstSeries = this.getFirstSeries();
            if (firstSeries instanceof SeriesMetadata) {
                const found = firstSeries.getFirstInstance();
                if (found instanceof InstanceMetadata) {
                    this._firstInstance = found;
                    instance = found;
                }
            }
        }
        return instance;
    }

     /**
     * Search the associated series to find an specific instance using the supplied callback as criteria.
     * The callback is passed two arguments: instance (a InstanceMetadata instance) and index (the integer
     * index of the instance within the current series)
     * @param {function} callback The callback function which will be invoked for each instance instance.
     * @returns {Object} Result object containing series (SeriesMetadata) and instance (InstanceMetadata) 
     *                   objects or an empty object if not found.
     */
    findSeriesAndInstanceByInstance(callback) {
        let result;

        if (Metadata.isValidCallback(callback)) {
            let instance;

            const series = this._series.find(series => {
                instance = series.findInstance(callback);
                return instance instanceof InstanceMetadata;
            });

            // No series found
            if (series instanceof SeriesMetadata) {
                result = {
                    series,
                    instance
                };
            }
        }

        return result || {};
    }

    /**
     * Find series by instance using the supplied callback as criteria. The callback is passed
     * two arguments: instance (a InstanceMetadata instance) and index (the integer index of 
     * the instance within its series)
     * @param {function} callback The callback function which will be invoked for each instance.
     * @returns {SeriesMetadata|undefined} If a series is found based on callback criteria it
     *                                     returns a SeriesMetadata. "undefined" is returned otherwise
     */
    findSeriesByInstance(callback) {
        const result = this.findSeriesAndInstanceByInstance(callback);

        return result.series;
    }

    /**
     * Find an instance using the supplied callback as criteria. The callback is passed
     * two arguments: instance (a InstanceMetadata instance) and index (the integer index of 
     * the instance within its series)
     * @param {function} callback The callback function which will be invoked for each instance.
     * @returns {InstanceMetadata|undefined} If an instance is found based on callback criteria it
     *                                     returns a InstanceMetadata. "undefined" is returned otherwise
     */
    findInstance(callback) {
        const result = this.findSeriesAndInstanceByInstance(callback);

        return result.instance;
    }

   

}
