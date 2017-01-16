import { Metadata } from './Metadata';
import { SeriesMetadata } from './SeriesMetadata';

export class StudyMetadata extends Metadata {
    constructor(data) {
        super(data);
        this._studyInstanceUID = null;
        this._series = [];  // SeriesMetadata[]

    }

    /**
     * Returns the StudyInstanceUID of the current study.
     */
    getStudyInstanceUID() {
        return this._studyInstanceUID;
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
     * Get first instance of the first series
     * @return {InstanceMetadata} InstanceMetadata class object or undefined if it doenst exist
     */
    getFirstInstance() {
        let firstInstance;
        const firstSeries = this.getSeriesByIndex(0);

        if (firstSeries) {
            firstInstance = firstSeries.getInstanceByIndex(0);
        }

        return firstInstance;
    }

}
