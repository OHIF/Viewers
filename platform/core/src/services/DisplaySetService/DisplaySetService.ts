import { PubSubService } from '../_shared/pubSubServiceInterface';
import EVENTS from './EVENTS';

const displaySetCache = [];

/**
 * Filters the instances set by instances not in
 * display sets.  Done in O(n) time.
 */
const filterInstances = (instances, displaySets) => {
  if (!displaySets?.length) return instances;
  const sops = {};
  for (const ds of displaySets) {
    const dsInstances = ds.images || ds.others || ds.instances;
    if (!dsInstances) {
      console.warn('No instances in', ds);
      continue;
    }
    dsInstances.forEach(instance => (sops[instance.SOPInstanceUID] = instance));
  }
  return instances.filter(instance => !sops[instance.SOPInstanceUID]);
};

export default class DisplaySetService extends PubSubService {
  public static REGISTRATION = {
    altName: 'DisplaySetService',
    name: 'displaySetService',
    create: ({ configuration = {} }) => {
      return new DisplaySetService();
    },
  };

  public activeDisplaySets = [];
  // Record if the active display sets changed - used to bulk up change events.
  protected activeChanged = false;

  constructor() {
    super(EVENTS);
  }

  public init(extensionManager, SOPClassHandlerIds): void {
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
      // This test makes adding display sets an N^2 operation, so it might
      // become important to do this in an efficient manner for large
      // numbers of display sets.
      if (!activeDisplaySets.includes(displaySet)) {
        this.activeChanged = true;
        activeDisplaySets.push(displaySet);
      }
    });
  }

  /**
   * Adds new display sets
   */
  public addDisplaySets(...displaySets): string[] {
    this._addDisplaySetsToCache(displaySets);
    this._addActiveDisplaySets(displaySets);
    this.activeChanged = false;
    this._broadcastEvent(EVENTS.DISPLAY_SETS_ADDED, {
      displaySetsAdded: displaySets,
      options: { madeInClient: displaySets[0].madeInClient },
    });
    return displaySets;
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

  getDisplaySetForSOPInstanceUID(
    SOPInstanceUID,
    SeriesInstanceUID,
    frameNumber
  ) {
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

  setDisplaySetMetadataInvalidated(displaySetInstanceUID) {
    const displaySet = this.getDisplaySetByUID(displaySetInstanceUID);

    if (!displaySet) {
      return;
    }

    // broadcast event to update listeners with the new displaySets
    this._broadcastEvent(
      EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
      displaySetInstanceUID
    );
  }

  deleteDisplaySet(displaySetInstanceUID) {
    if (!displaySetInstanceUID) return;
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
    const displaySetsAdded = [];

    if (batch) {
      for (let i = 0; i < input.length; i++) {
        const instances = input[i];
        const displaySets = this.makeDisplaySetForInstances(
          instances,
          settings
        );

        displaySetsAdded.push(...displaySets);
      }
    } else {
      const displaySets = this.makeDisplaySetForInstances(input, settings);

      displaySetsAdded.push(...displaySets);
    }

    const options = {};

    if (madeInClient) {
      options.madeInClient = true;
    }

    if (this.activeChanged) {
      this.activeChanged = false;
      this._broadcastEvent(EVENTS.DISPLAY_SETS_CHANGED, this.activeDisplaySets);
    }
    if (displaySetsAdded?.length) {
      // The response from displaySetsAdded will only contain newly added
      // display sets.
      this._broadcastEvent(EVENTS.DISPLAY_SETS_ADDED, {
        displaySetsAdded,
        options,
      });

      return displaySetsAdded;
    }
  };

  /**
   * The onModeExit returns the display set service to the initial state,
   * that is without any display sets.  To avoid recreating display sets,
   * the mode specific onModeExit is called before this method and should
   * store the active display sets and the cached data.
   */
  onModeExit() {
    this.getDisplaySetCache().length = 0;
    this.activeDisplaySets.length = 0;
  }

  /**
   * Creates new display sets for the instances contained in instancesSrc
   * according to the sop class handlers registered.
   * This is idempotent in that calling it a second time with the
   * same set of instances will not result in new display sets added.
   * However, the response for the subsequent call will be empty as the data
   * is already present.
   * Calling it with some new instances and some existing instances will
   * result in the new instances being added to existing display sets if
   * they support the addInstances call, OR to new instances otherwise.
   * Only the new instances are returned - the others are updated.
   *
   * @param instancesSrc are instances to add
   * @param settings are settings to add
   * @returns Array of the display sets added.
   */
  public makeDisplaySetForInstances(instancesSrc: [], settings): [] {
    // Some of the sop class handlers take a direct reference to instances
    // so make sure it gets copied here so that they have their own ref
    let instances = [...instancesSrc];
    const instance = instances[0];

    const existingDisplaySets =
      this.getDisplaySetsForSeries(instance.SeriesInstanceUID) || [];

    const SOPClassHandlerIds = this.SOPClassHandlerIds;
    const allDisplaySets = [];

    for (let i = 0; i < SOPClassHandlerIds.length; i++) {
      const SOPClassHandlerId = SOPClassHandlerIds[i];
      const handler = this.extensionManager.getModuleEntry(SOPClassHandlerId);

      if (handler.sopClassUids.includes(instance.SOPClassUID)) {
        // Check if displaySets are already created using this SeriesInstanceUID/SOPClassHandler pair.
        let displaySets = existingDisplaySets.filter(
          displaySet => displaySet.SOPClassHandlerId === SOPClassHandlerId
        );

        if (displaySets.length) {
          instances = filterInstances(instances, displaySets);
          for (const ds of displaySets) {
            const addedDs = ds.addInstances?.(instances, this);
            if (addedDs) {
              this.activeChanged = true;
              instances = filterInstances(instances, [ds]);
              this._addActiveDisplaySets([ds]);
              this.setDisplaySetMetadataInvalidated(ds.displaySetInstanceUID);
            }
            if (!instances.length) return allDisplaySets;
          }
          if (instances.length === 0) {
            // Everything is already added - this is just an update caused
            // by something else
            this._addActiveDisplaySets(displaySets);
            return allDisplaySets;
          }
          // There are  still instances to add, and they will get added as
          // a new display set.
        }

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

        instances = filterInstances(instances, displaySets);

        allDisplaySets.push(...displaySets);
        if (!instances.length) return allDisplaySets;
      }
    }
    return allDisplaySets;
  }

  /**
   * Iterates over displaysets and invokes comparator for each element.
   * It returns a list of items that has being succeed by comparator method.
   *
   * @param {function} comparator method to be used on the validation
   * @returns list of displaysets
   */
  getDisplaySetsBy(comparator) {
    const result = [];

    if (typeof comparator !== 'function') {
      return result;
    }

    this.getActiveDisplaySets().forEach(displaySet => {
      if (comparator(displaySet)) {
        result.push(displaySet);
      }
    });

    return result;
  }
}
