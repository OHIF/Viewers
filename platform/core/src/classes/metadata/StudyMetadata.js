// - createStacks
import DICOMWeb from './../../DICOMWeb';
import ImageSet from './../ImageSet';
import { InstanceMetadata } from './InstanceMetadata';
import { Metadata } from './Metadata';
import OHIFError from '../OHIFError';
import { SeriesMetadata } from './SeriesMetadata';
// - createStacks
import { api } from 'dicomweb-client';
// - createStacks
import { isImage } from './../../utils/isImage';

export class StudyMetadata extends Metadata {
  constructor(data, uid) {
    super(data, uid);
    // Initialize Private Properties
    Object.defineProperties(this, {
      _studyInstanceUID: {
        configurable: true, // configurable so that it can be redefined in sub-classes...
        enumerable: false,
        writable: true,
        value: null,
      },
      _series: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: [],
      },
      _displaySets: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: [],
      },
      _firstSeries: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null,
      },
      _firstInstance: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null,
      },
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
      },
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
   * Creates a set of series to be placed in the Study Metadata
   * The series that appear in the Study Metadata must represent
   * imaging modalities.
   *
   * Furthermore, for drag/drop functionality,
   * it is easiest if the stack objects also contain information about
   * which study they are linked to.
   *
   * @param {StudyMetadata} study The study instance metadata to be used
   * @returns {Array} An array of series to be placed in the Study Metadata
   */
  createDisplaySets(sopClassHandlerModules) {
    const study = this;
    const displaySets = [];
    const anyDisplaySets = study.getSeriesCount();
    const anySopClassHandlerModules =
      sopClassHandlerModules && sopClassHandlerModules.length > 0;

    if (!anyDisplaySets) {
      return displaySets;
    }

    // Loop through the series (SeriesMetadata)
    this.forEachSeries(series => {
      const anyInstances = series.getInstanceCount() > 0;
      if (!anyInstances) {
        return;
      }

      const sopClassUids = getSopClassUids(series);

      if (anySopClassHandlerModules) {
        const displaySet = _getDisplaySetFromSopClassModule(
          sopClassHandlerModules,
          series,
          study,
          sopClassUids
        );

        if (displaySet) {
          displaySets.push(displaySet);

          return;
        }
      }

      // WE NEED A BETTER WAY TO NOTE THAT THIS IS THE DEFAULT BEHAVIOR FOR LOADING
      // A DISPLAY SET IF THERE IS NO MATCHING SOP CLASS PLUGIN

      // Search through the instances (InstanceMetadata object) of this series
      // Split Multi-frame instances and Single-image modalities
      // into their own specific display sets. Place the rest of each
      // series into another display set.
      const stackableInstances = [];
      series.forEachInstance(instance => {
        // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
        if (
          !isImage(instance.getRawValue('x00080016')) &&
          !instance.getRawValue('x00280010')
        ) {
          return;
        }

        let displaySet;

        if (isMultiFrame(instance)) {
          displaySet = makeDisplaySet(series, [instance]);
          displaySet.setAttributes({
            sopClassUids,
            isClip: true,
            seriesInstanceUid: series.getSeriesInstanceUID(),
            studyInstanceUid: study.getStudyInstanceUID(), // Include the study instance Uid for drag/drop purposes
            numImageFrames: instance.getRawValue('x00280008'), // Override the default value of instances.length
            instanceNumber: instance.getRawValue('x00200013'), // Include the instance number
            acquisitionDatetime: instance.getRawValue('x0008002a'), // Include the acquisition datetime
          });
          displaySets.push(displaySet);
        } else if (isSingleImageModality(instance.modality)) {
          displaySet = makeDisplaySet(series, [instance]);
          displaySet.setAttributes({
            sopClassUids,
            studyInstanceUid: study.getStudyInstanceUID(), // Include the study instance Uid
            seriesInstanceUid: series.getSeriesInstanceUID(),
            instanceNumber: instance.getRawValue('x00200013'), // Include the instance number
            acquisitionDatetime: instance.getRawValue('x0008002a'), // Include the acquisition datetime
          });
          displaySets.push(displaySet);
        } else {
          stackableInstances.push(instance);
        }
      });

      if (stackableInstances.length) {
        const displaySet = makeDisplaySet(series, stackableInstances);
        displaySet.setAttribute(
          'studyInstanceUid',
          study.getStudyInstanceUID()
        );
        displaySet.setAttributes({
          sopClassUids,
        });
        displaySets.push(displaySet);
      }
    });

    // TODO
    displaySets.sort(_sortBySeriesNumber);

    return displaySets;
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
   * two arguments: display set (an ImageSet instance) and index (the integer
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
    if (
      series instanceof SeriesMetadata &&
      this.getSeriesByUID(series.getSeriesInstanceUID()) === void 0
    ) {
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
    this.forEachDisplaySet((displaySet, index) => {
      if (!(displaySet instanceof ImageSet)) {
        throw new OHIFError(
          `StudyMetadata::sortSeriesByDisplaySets display set at index ${index} is not an instance of ImageSet`
        );
      }

      // In case of multiframe studies, just get the first index occurence
      if (displaySetsMapping[displaySet.seriesInstanceUid] === void 0) {
        displaySetsMapping[displaySet.seriesInstanceUid] = index;
      }
    });

    // Clone of actual series
    const actualSeries = this.getSeries();

    actualSeries.forEach((series, index) => {
      if (!(series instanceof SeriesMetadata)) {
        throw new OHIFError(
          `StudyMetadata::sortSeriesByDisplaySets series at index ${index} is not an instance of SeriesMetadata`
        );
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
      (study instanceof StudyMetadata &&
        study.getStudyInstanceUID() === self.getStudyInstanceUID())
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
          instance,
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

/**
 *
 * @typedef StudyMetadata
 * @property {function} getSeriesCount - returns the number of series in the study
 * @property {function} forEachSeries - function that invokes callback with each series and index
 * @property {function} getStudyInstanceUID - returns the study's instance UID
 *
 */

/**
 * @typedef SeriesMetadata
 * @property {function} getSeriesInstanceUID - returns the series's instance UID
 * @property {function} getData - ???
 * @property {function} forEachInstance - ???
 */

const dwc = api.DICOMwebClient;

const isMultiFrame = instance => {
  // NumberOfFrames (0028,0008)
  return instance.getRawValue('x00280008') > 1;
};

const makeDisplaySet = (series, instances) => {
  const instance = instances[0];
  const imageSet = new ImageSet(instances);
  const seriesData = series.getData();

  // set appropriate attributes to image set...
  imageSet.setAttributes({
    displaySetInstanceUid: imageSet.uid, // create a local alias for the imageSet UID
    seriesDate: seriesData.seriesDate,
    seriesTime: seriesData.seriesTime,
    seriesInstanceUid: series.getSeriesInstanceUID(),
    seriesNumber: instance.getRawValue('x00200011'),
    seriesDescription: instance.getRawValue('x0008103e'),
    numImageFrames: instances.length,
    frameRate: instance.getRawValue('x00181063'),
    modality: instance.getRawValue('x00080060'),
    isMultiFrame: isMultiFrame(instance),
  });

  // Sort the images in this series if needed
  const shallSort = true; //!OHIF.utils.ObjectPath.get(Meteor, 'settings.public.ui.sortSeriesByIncomingOrder');
  if (shallSort) {
    imageSet.sortBy((a, b) => {
      // Sort by InstanceNumber (0020,0013)
      return (
        (parseInt(a.getRawValue('x00200013', 0)) || 0) -
        (parseInt(b.getRawValue('x00200013', 0)) || 0)
      );
    });
  }

  // Include the first image instance number (after sorted)
  imageSet.setAttribute(
    'instanceNumber',
    imageSet.getImage(0).getRawValue('x00200013')
  );

  return imageSet;
};

const isSingleImageModality = modality => {
  return modality === 'CR' || modality === 'MG' || modality === 'DX';
};

function getSopClassUids(series) {
  const uniqueSopClassUidsInSeries = new Set();
  series.forEachInstance(instance => {
    const instanceSopClassUid = instance.getRawValue('x00080016');

    uniqueSopClassUidsInSeries.add(instanceSopClassUid);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

/**
 * @private
 * @param {SeriesMetadata} series
 * @param {StudyMetadata} study
 * @param {string[]} sopClassUids
 */
function _getDisplaySetFromSopClassModule(
  sopClassHandlerExtensions, // TODO: Update Usage
  series,
  study,
  sopClassUids
) {
  // TODO: For now only use the plugins if all instances have the same sopClassUid
  if (sopClassUids.length !== 1) {
    console.warn(
      'getDisplaySetFromSopClassPlugin: More than one SOPClassUid in the same series is not yet supported.'
    );
    return;
  }

  const sopClassUid = sopClassUids[0];
  const sopClassHandlerModules = sopClassHandlerExtensions.map(extension => {
    return extension.module;
  });

  const handlersForSopClassUid = sopClassHandlerModules.filter(module => {
    return module.sopClassUids.includes(sopClassUid);
  });

  // TODO: Sort by something, so we can determine which plugin to use
  if (!handlersForSopClassUid || !handlersForSopClassUid.length) {
    return;
  }

  const plugin = handlersForSopClassUid[0];
  const headers = DICOMWeb.getAuthorizationHeader();
  const dicomWebClient = new dwc({
    url: study.getData().wadoRoot,
    headers,
  });

  let displaySet = plugin.getDisplaySetFromSeries(
    series,
    study,
    dicomWebClient,
    headers
  );
  if (displaySet && !displaySet.modality) {
    const instance = series.getFirstInstance();
    displaySet.modality = instance.getRawValue('x00080060');
  }
  return displaySet;
}

/**
 *
 * @param {*} a - DisplaySet
 * @param {*} b - DisplaySet
 */
function _sortBySeriesNumber(a, b) {
  const seriesNumberAIsGreaterOrUndefined =
    a.seriesNumber > b.seriesNumber || (!a.seriesNumber && b.seriesNumber);

  return seriesNumberAIsGreaterOrUndefined ? 1 : -1;
}
