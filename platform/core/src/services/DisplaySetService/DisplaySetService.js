import pubSubServiceInterface from '../_shared/pubSubServiceInterface';
import EVENTS from './EVENTS';

const displaySetCache = [];

/**
 * Find an instance in a list of instances, comparing by SOP instance UID
 */
const findInSet = (instance, list) => {
  if (!list) return false;
  for (const elem of list) {
    if (!elem) continue;
    if (elem === instance) return true;
    if (elem.SOPInstanceUID === instance.SOPInstanceUID) return true;
  }
  return false;
};

/**
 * Find an instance in a display set
 * @returns true if found
 */
const findInstance = (instance, displaySets) => {
  for (const displayset of displaySets) {
    if (findInSet(instance, displayset.images)) return true;
    if (findInSet(instance, displayset.others)) return true;
  }
  return false;
}

export default class DisplaySetService {
  constructor() {
    this.activeDisplaySets = [];
    this.listeners = {};
    this.EVENTS = EVENTS;

    Object.assign(this, pubSubServiceInterface);
  }

  init(extensionManager, SOPClassHandlerIds) {
    this.extensionManager = extensionManager;
    this.SOPClassHandlerIds = SOPClassHandlerIds;
    this.activeDisplaySets = [];
  }

  _addDisplaySetsToCache(displaySets) {
    displaySets.forEach(displaySet => {
      displaySetCache.push(displaySet);
    });
  }

  _addActiveDisplaySets(displaySets) {
    const activeDisplaySets = this.activeDisplaySets;

    displaySets.forEach(displaySet => {
      activeDisplaySets.push(displaySet);
    });
  }

  getDisplaySetCache() {
    return displaySetCache;
  }

  getMostRecentDisplaySet() {
    return this.activeDisplaySets[this.activeDisplaySets.length - 1];
  }

  getActiveDisplaySets() {
    return this.activeDisplaySets;
  }

  getDisplaySetsForSeries = SeriesInstanceUID => {
    return displaySetCache.filter(
      displaySet => displaySet.SeriesInstanceUID === SeriesInstanceUID
    );
  };

  getDisplaySetForSOPInstanceUID(SOPInstanceUID, SeriesInstanceUID) {
    const displaySets = SeriesInstanceUID
      ? this.getDisplaySetsForSeries(SeriesInstanceUID)
      : this.getDisplaySetCache();

    const displaySet = displaySets.find(ds => {
      return (
        ds.images && ds.images.some(i => i.SOPInstanceUID === SOPInstanceUID)
      );
    });

    return displaySet;
  }

  deleteDisplaySet(displaySetInstanceUID) {
    const { activeDisplaySets } = this;

    const displaySetCacheIndex = displaySetCache.findIndex(
      ds => ds.displaySetInstanceUID === displaySetInstanceUID
    );

    const activeDisplaySetsIndex = activeDisplaySets.findIndex(
      ds => ds.displaySetInstanceUID === displaySetInstanceUID
    );

    displaySetCache.splice(displaySetCacheIndex, 1);
    activeDisplaySets.splice(activeDisplaySetsIndex, 1);

    this._broadcastEvent(EVENTS.DISPLAY_SETS_CHANGED, this.activeDisplaySets);
    this._broadcastEvent(EVENTS.DISPLAY_SETS_REMOVED, {
      displaySetInstanceUIDs: [displaySetInstanceUID],
    });
  }

  /**
   * @param {string} displaySetInstanceUID
   * @returns {object} displaySet
   */
  getDisplaySetByUID = displaySetInstanceUid =>
    displaySetCache.find(
      displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUid
    );

  /**
   *
   * @param {*} input
   * @param {*} param1: settings: initialViewportSettings by HP or callbacks after rendering
   * @returns {string[]} - added displaySetInstanceUIDs
   */
  makeDisplaySets = (
    input,
    { batch = false, madeInClient = false, settings = {} } = {}
  ) => {
    if (!input || !input.length) {
      throw new Error('No instances were provided.');
    }

    if (batch && !input[0].length) {
      throw new Error(
        'Batch displaySet creation does not contain array of array of instances.'
      );
    }

    // If array of instances => One instance.
    let displaySetsAdded = [];

    if (batch) {
      for (let i = 0; i < input.length; i++) {
        const instances = input[i];
        const displaySets = this.makeDisplaySetForInstances(
          instances,
          settings
        );

        displaySetsAdded = [...displaySetsAdded, displaySets];
      }
    } else {
      const displaySets = this.makeDisplaySetForInstances(input, settings);

      displaySetsAdded = displaySets;
    }

    const options = {};

    if (madeInClient) {
      options.madeInClient = true;
    }

    // TODO: This is tricky. How do we know we're not resetting to the same/existing DSs?
    // TODO: This is likely run anytime we touch DicomMetadataStore. How do we prevent uneccessary broadcasts?
    if (displaySetsAdded && displaySetsAdded.length) {
      this._broadcastEvent(EVENTS.DISPLAY_SETS_CHANGED, this.activeDisplaySets);
      this._broadcastEvent(EVENTS.DISPLAY_SETS_ADDED, {
        displaySetsAdded,
        options,
      });

      return displaySetsAdded;
    }
  };

  makeDisplaySetForInstances(instancesSrc, settings) {
    let instances = instancesSrc;
    const instance = instances[0];

    const existingDisplaySets =
      this.getDisplaySetsForSeries(instance.SeriesInstanceUID) || [];

    const SOPClassHandlerIds = this.SOPClassHandlerIds;
    let allDisplaySets;

    for (let i = 0; i < SOPClassHandlerIds.length; i++) {
      const SOPClassHandlerId = SOPClassHandlerIds[i];
      const handler = this.extensionManager.getModuleEntry(SOPClassHandlerId);

      if (handler.sopClassUids.includes(instance.SOPClassUID)) {
        // Check if displaySets are already created using this SeriesInstanceUID/SOPClassHandler pair.
        let displaySets = existingDisplaySets.filter(
          displaySet => displaySet.SOPClassHandlerId === SOPClassHandlerId
        );

        if (displaySets.length) {
          this._addActiveDisplaySets(displaySets);
        } else {
          displaySets = handler.getDisplaySetsFromSeries(instances);

          if (!displaySets || !displaySets.length) continue;

          // applying hp-defined viewport settings to the displaysets
          displaySets.forEach(ds => {
            Object.keys(settings).forEach(key => {
              ds[key] = settings[key];
            });
          });

          this._addDisplaySetsToCache(displaySets);
          this._addActiveDisplaySets(displaySets);

          instances = instances.filter(instance => !findInstance(instance, displaySets))
        }

        allDisplaySets = allDisplaySets ? [...allDisplaySets, ...displaySets] : displaySets;

        if (!instances.length) return allDisplaySets;
      }
    }
    return allDisplaySets;
  }
}
