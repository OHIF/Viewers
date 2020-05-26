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
import { isImage } from '../../utils/isImage';
import isDisplaySetReconstructable from '../../utils/isDisplaySetReconstructable';
import isLowPriorityModality from '../../utils/isLowPriorityModality';
import errorHandler from '../../errorHandler';

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
      _derivedDisplaySets: {
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
      get: function () {
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
   * Split a series metadata object into display sets
   * @param {Array} sopClassHandlerModules List of SOP Class Modules
   * @param {SeriesMetadata} series The series metadata object from which the display sets will be created
   * @returns {Array} The list of display sets created for the given series object
   */
  _createDisplaySetsForSeries(sopClassHandlerModules, series) {
    const study = this;
    const displaySets = [];

    const anyInstances = series.getInstanceCount() > 0;

    if (!anyInstances) {
      const displaySet = new ImageSet([]);
      const seriesData = series.getData();

      displaySet.setAttributes({
        displaySetInstanceUID: displaySet.uid,
        SeriesInstanceUID: seriesData.SeriesInstanceUID,
        SeriesDescription: seriesData.SeriesDescription,
        SeriesNumber: seriesData.SeriesNumber,
        Modality: seriesData.Modality,
      });

      displaySets.push(displaySet);

      return displaySets;
    }

    const sopClassUIDs = getSopClassUIDs(series);

    if (sopClassHandlerModules && sopClassHandlerModules.length > 0) {
      const displaySet = _getDisplaySetFromSopClassModule(
        sopClassHandlerModules,
        series,
        study,
        sopClassUIDs
      );
      if (displaySet) {
        displaySet.sopClassModule = true;

        displaySet.isDerived
          ? this._addDerivedDisplaySet(displaySet)
          : displaySets.push(displaySet);

        return displaySets;
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
      // All imaging modalities must have a valid value for SOPClassUID (x00080016) or Rows (x00280010)
      if (
        !isImage(instance.getTagValue('SOPClassUID')) &&
        !instance.getTagValue('Rows')
      ) {
        return;
      }

      let displaySet;

      if (isMultiFrame(instance)) {
        displaySet = makeDisplaySet(series, [instance]);

        displaySet.setAttributes({
          sopClassUIDs,
          isClip: true,
          SeriesInstanceUID: series.getSeriesInstanceUID(),
          StudyInstanceUID: study.getStudyInstanceUID(), // Include the study instance UID for drag/drop purposes
          numImageFrames: instance.getTagValue('NumberOfFrames'), // Override the default value of instances.length
          InstanceNumber: instance.getTagValue('InstanceNumber'), // Include the instance number
          AcquisitionDatetime: instance.getTagValue('AcquisitionDateTime'), // Include the acquisition datetime
        });
        displaySets.push(displaySet);
      } else if (isSingleImageModality(instance.Modality)) {
        displaySet = makeDisplaySet(series, [instance]);
        displaySet.setAttributes({
          sopClassUIDs,
          StudyInstanceUID: study.getStudyInstanceUID(), // Include the study instance UID
          SeriesInstanceUID: series.getSeriesInstanceUID(),
          InstanceNumber: instance.getTagValue('InstanceNumber'), // Include the instance number
          AcquisitionDatetime: instance.getTagValue('AcquisitionDateTime'), // Include the acquisition datetime
        });
        displaySets.push(displaySet);
      } else {
        stackableInstances.push(instance);
      }
    });

    if (stackableInstances.length) {
      const displaySet = makeDisplaySet(series, stackableInstances);
      displaySet.setAttribute('StudyInstanceUID', study.getStudyInstanceUID());
      displaySet.setAttributes({
        sopClassUIDs,
      });
      displaySets.push(displaySet);
    }

    return displaySets;
  }

  /**
   * Adds the displaySets to the studies list of derived displaySets.
   * @param {object} displaySet The displaySet to append to the derived displaysets list.
   */
  _addDerivedDisplaySet(displaySet) {
    this._derivedDisplaySets.push(displaySet);
    // --> Perhaps that logic should exist in the extension sop class handler and this be a dumb list.
    // TODO -> Get x Modality by referencedSeriesInstanceUid, FoR, etc.
  }

  /**
   * Returns a list of derived datasets in the study, filtered by the given filter.
   * @param {object} filter An object containing search filters
   * @param {object} filter.Modality
   * @param {object} filter.referencedSeriesInstanceUID
   * @param {object} filter.referencedFrameOfReferenceUID
   * @return {Array} filtered derived display sets
   */
  getDerivedDatasets(filter) {
    const {
      Modality,
      referencedSeriesInstanceUID,
      referencedFrameOfReferenceUID,
    } = filter;

    let filteredDerivedDisplaySets = this._derivedDisplaySets;

    if (Modality) {
      filteredDerivedDisplaySets = filteredDerivedDisplaySets.filter(
        displaySet => displaySet.Modality === Modality
      );
    }

    if (referencedSeriesInstanceUID) {
      filteredDerivedDisplaySets = filteredDerivedDisplaySets.filter(
        displaySet => {
          if (!displaySet.metadata.ReferencedSeriesSequence) {
            return false;
          }

          const ReferencedSeriesSequence = Array.isArray(
            displaySet.metadata.ReferencedSeriesSequence
          )
            ? displaySet.metadata.ReferencedSeriesSequence
            : [displaySet.metadata.ReferencedSeriesSequence];

          return ReferencedSeriesSequence.some(
            ReferencedSeries =>
              ReferencedSeries.SeriesInstanceUID === referencedSeriesInstanceUID
          );
        }
      );
    }

    if (referencedFrameOfReferenceUID) {
      filteredDerivedDisplaySets = filteredDerivedDisplaySets.filter(
        displaySet =>
          displaySet.ReferencedFrameOfReferenceUID ===
          ReferencedFrameOfReferenceUID
      );
    }

    return filteredDerivedDisplaySets;
  }

  /**
   * Creates a set of displaySets to be placed in the Study Metadata
   * The displaySets that appear in the Study Metadata must represent
   * imaging modalities. A series may be split into one or more displaySets.
   *
   * Furthermore, for drag/drop functionality,
   * it is easiest if the stack objects also contain information about
   * which study they are linked to.
   *
   * @param {StudyMetadata} study The study instance metadata to be used
   * @returns {Array} An array of series to be placed in the Study Metadata
   */
  createDisplaySets(sopClassHandlerModules) {
    const displaySets = [];
    const anyDisplaySets = this.getSeriesCount();

    if (!anyDisplaySets) {
      return displaySets;
    }

    // Loop through the series (SeriesMetadata)
    this.forEachSeries(series => {
      const displaySetsForSeries = this._createDisplaySetsForSeries(
        sopClassHandlerModules,
        series
      );

      displaySets.push(...displaySetsForSeries);
    });

    return sortDisplaySetList(displaySets);
  }

  sortDisplaySets() {
    sortDisplaySetList(this._displaySets);
  }

  /**
   * Method to append display sets from a given series to the internal list of display sets
   * @param {Array} sopClassHandlerModules A list of SOP Class Handler Modules
   * @param {SeriesMetadata} series The series metadata object from which the display sets will be created
   * @returns {boolean} Returns true on success or false on failure (e.g., the series does not belong to this study)
   */
  createAndAddDisplaySetsForSeries(sopClassHandlerModules, series) {
    if (!this.containsSeries(series)) {
      return false;
    }

    const displaySets = this._createDisplaySetsForSeries(
      sopClassHandlerModules,
      series
    );

    // Note: filtering in place because this._displaySets has writable: false
    for (let i = this._displaySets.length - 1; i >= 0; i--) {
      const displaySet = this._displaySets[i];
      if (displaySet.SeriesInstanceUID === series.getSeriesInstanceUID()) {
        this._displaySets.splice(i, 1);
      }
    }

    displaySets.forEach(displaySet => {
      this.addDisplaySet(displaySet);
    });

    this.sortDisplaySets();

    return true;
  }

  /**
   * Set display sets
   * @param {Array} displaySets Array of display sets (ImageSet[])
   */
  setDisplaySets(displaySets) {
    if (Array.isArray(displaySets) && displaySets.length > 0) {
      // TODO: This is weird, can we just switch it to writable: true?
      this._displaySets.splice(0);

      displaySets.forEach(displaySet => this.addDisplaySet(displaySet));
      this.sortDisplaySets();
    }
  }

  /**
   * Add a single display set to the list
   * @param {Object} displaySet Display set object
   * @returns {boolean} True on success, false on failure.
   */
  addDisplaySet(displaySet) {
    if (displaySet instanceof ImageSet || displaySet.sopClassModule) {
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
   * Update a series in the current study by SeriesInstanceUID.
   * @param {String} SeriesInstanceUID The SeriesInstanceUID to be updated
   * @param {SeriesMetadata} series The series to be added to the current study.
   * @returns {boolean} Returns true on success, false otherwise.
   */
  updateSeries(SeriesInstanceUID, series) {
    const index = this._series.findIndex(series => {
      return series.getSeriesInstanceUID() === SeriesInstanceUID;
    });

    if (index < 0) {
      return false;
    }

    if (!(series instanceof SeriesMetadata)) {
      throw new Error('Series must be an instance of SeriesMetadata');
    }

    this._series[index] = series;

    return true;
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

  containsSeries(series) {
    return (
      series instanceof SeriesMetadata && this._series.indexOf(series) >= 0
    );
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
    // Object for mapping display sets' index by SeriesInstanceUID
    const displaySetsMapping = {};

    // Loop through each display set to create the mapping
    this.forEachDisplaySet((displaySet, index) => {
      if (!(displaySet instanceof ImageSet)) {
        throw new OHIFError(
          `StudyMetadata::sortSeriesByDisplaySets display set at index ${index} is not an instance of ImageSet`
        );
      }

      // In case of multiframe studies, just get the first index occurence
      if (displaySetsMapping[displaySet.SeriesInstanceUID] === void 0) {
        displaySetsMapping[displaySet.SeriesInstanceUID] = index;
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
   * Get the first image id given display instance uid.
   * @return {string} The image id.
   */
  getFirstImageId(displaySetInstanceUID) {
    try {
      const displaySet = this.findDisplaySet(
        displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
      );
      return displaySet.images[0].getImageId();
    } catch (error) {
      console.error('Failed to retrieve image metadata');
      return null;
    }
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
  return instance.getTagValue('NumberOfFrames') > 1;
};

const makeDisplaySet = (series, instances) => {
  const instance = instances[0];
  const imageSet = new ImageSet(instances);
  const seriesData = series.getData();

  // set appropriate attributes to image set...
  imageSet.setAttributes({
    displaySetInstanceUID: imageSet.uid, // create a local alias for the imageSet UID
    SeriesDate: seriesData.SeriesDate,
    SeriesTime: seriesData.SeriesTime,
    SeriesInstanceUID: series.getSeriesInstanceUID(),
    SeriesNumber: instance.getTagValue('SeriesNumber'),
    SeriesDescription: instance.getTagValue('SeriesDescription'),
    numImageFrames: instances.length,
    frameRate: instance.getTagValue('FrameTime'),
    Modality: instance.getTagValue('Modality'),
    isMultiFrame: isMultiFrame(instance),
  });

  // Sort the images in this series if needed
  const shallSort = true; //!OHIF.utils.ObjectPath.get(Meteor, 'settings.public.ui.sortSeriesByIncomingOrder');
  if (shallSort) {
    imageSet.sortBy((a, b) => {
      // Sort by InstanceNumber (0020,0013)
      return (
        (parseInt(a.getTagValue('InstanceNumber', 0)) || 0) -
        (parseInt(b.getTagValue('InstanceNumber', 0)) || 0)
      );
    });
  }

  // Include the first image instance number (after sorted)
  imageSet.setAttribute(
    'InstanceNumber',
    imageSet.getImage(0).getTagValue('InstanceNumber')
  );

  const isReconstructable = isDisplaySetReconstructable(instances);

  imageSet.isReconstructable = isReconstructable.value;

  if (shallSort && imageSet.isReconstructable) {
    imageSet.sortByImagePositionPatient();
  }

  if (isReconstructable.missingFrames) {
    // TODO -> This is currently unused, but may be used for reconstructing
    // Volumes with gaps later on.
    imageSet.missingFrames = isReconstructable.missingFrames;
  }

  return imageSet;
};

const isSingleImageModality = Modality => {
  return Modality === 'CR' || Modality === 'MG' || Modality === 'DX';
};

function getSopClassUIDs(series) {
  const uniqueSopClassUIDsInSeries = new Set();
  series.forEachInstance(instance => {
    const instanceSopClassUID = instance.getTagValue('SOPClassUID');

    uniqueSopClassUIDsInSeries.add(instanceSopClassUID);
  });
  const sopClassUIDs = Array.from(uniqueSopClassUIDsInSeries);

  return sopClassUIDs;
}

/**
 * @private
 * @param {SeriesMetadata} series
 * @param {StudyMetadata} study
 * @param {string[]} sopClassUIDs
 */
function _getDisplaySetFromSopClassModule(
  sopClassHandlerExtensions, // TODO: Update Usage
  series,
  study,
  sopClassUIDs
) {
  // TODO: For now only use the plugins if all instances have the same SOPClassUID
  if (sopClassUIDs.length !== 1) {
    console.warn(
      'getDisplaySetFromSopClassPlugin: More than one SOPClassUID in the same series is not yet supported.'
    );
    return;
  }

  const SOPClassUID = sopClassUIDs[0];
  const sopClassHandlerModules = sopClassHandlerExtensions.map(extension => {
    return extension.module;
  });

  const handlersForSopClassUID = sopClassHandlerModules.filter(module => {
    return module.sopClassUIDs.includes(SOPClassUID);
  });

  // TODO: Sort by something, so we can determine which plugin to use
  if (!handlersForSopClassUID || !handlersForSopClassUID.length) {
    return;
  }

  const plugin = handlersForSopClassUID[0];
  const headers = DICOMWeb.getAuthorizationHeader();
  const errorInterceptor = errorHandler.getHTTPErrorHandler();
  const dicomWebClient = new dwc({
    url: study.getData().wadoRoot,
    headers,
    errorInterceptor,
  });

  let displaySet = plugin.getDisplaySetFromSeries(
    series,
    study,
    dicomWebClient,
    headers
  );
  if (displaySet && !displaySet.Modality) {
    const instance = series.getFirstInstance();
    displaySet.Modality = instance.getTagValue('Modality');
  }
  return displaySet;
}

/**
 * Sort series primarily by Modality (i.e., series with references to other
 * series like SEG, KO or PR are grouped in the end of the list) and then by
 * series number:
 *
 *  --------
 * | CT #3  |
 * | CT #4  |
 * | CT #5  |
 *  --------
 * | SEG #1 |
 * | SEG #2 |
 *  --------
 *
 * @param {*} a - DisplaySet
 * @param {*} b - DisplaySet
 */

function seriesSortingCriteria(a, b) {
  const isLowPriorityA = isLowPriorityModality(a.Modality);
  const isLowPriorityB = isLowPriorityModality(b.Modality);
  if (!isLowPriorityA && isLowPriorityB) {
    return -1;
  }
  if (isLowPriorityA && !isLowPriorityB) {
    return 1;
  }
  return sortBySeriesNumber(a, b);
}

/**
 * Sort series by series number. Series with low
 * @param {*} a - DisplaySet
 * @param {*} b - DisplaySet
 */
function sortBySeriesNumber(a, b) {
  const seriesNumberAIsGreaterOrUndefined =
    a.SeriesNumber > b.SeriesNumber || (!a.SeriesNumber && b.SeriesNumber);

  return seriesNumberAIsGreaterOrUndefined ? 1 : -1;
}

/**
 * Sorts a list of display set objects
 * @param {Array} list A list of display sets to be sorted
 */
function sortDisplaySetList(list) {
  return list.sort(seriesSortingCriteria);
}
