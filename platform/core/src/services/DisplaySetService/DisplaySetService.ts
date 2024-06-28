import { ExtensionManager } from '../../extensions';
import { DisplaySet, InstanceMetadata } from '../../types';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import EVENTS from './EVENTS';

const displaySetCache = new Map<string, DisplaySet>();

/**
 * Filters the instances set by instances not in
 * display sets.  Done in O(n) time.
 */
const filterInstances = (
  instances: InstanceMetadata[],
  displaySets: DisplaySet[]
): InstanceMetadata[] => {
  const dsInstancesSOP = new Set();
  displaySets.forEach(ds => {
    const dsInstances = ds.instances;
    if (!dsInstances) {
      console.warn('No instances in', ds);
    } else {
      dsInstances.forEach(instance => dsInstancesSOP.add(instance.SOPInstanceUID));
    }
  });

  return instances.filter(instance => !dsInstancesSOP.has(instance.SOPInstanceUID));
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
  public unsupportedSOPClassHandler;
  extensionManager: ExtensionManager;

  protected activeDisplaySetsMap = new Map<string, DisplaySet>();

  // Record if the active display sets changed - used to group change events so
  // that fewer events need to be fired when creating multiple display sets
  protected activeDisplaySetsChanged = false;

  constructor() {
    super(EVENTS);
    this.unsupportedSOPClassHandler =
      '@ohif/extension-default.sopClassHandlerModule.not-supported-display-sets-handler';
  }

  public init(extensionManager, SOPClassHandlerIds): void {
    this.extensionManager = extensionManager;
    this.SOPClassHandlerIds = SOPClassHandlerIds;
    this.activeDisplaySets = [];
    this.activeDisplaySetsMap.clear();
  }

  _addDisplaySetsToCache(displaySets: DisplaySet[]) {
    displaySets.forEach(displaySet => {
      displaySetCache.set(displaySet.displaySetInstanceUID, displaySet);
    });
  }

  _addActiveDisplaySets(displaySets: DisplaySet[]) {
    const { activeDisplaySets, activeDisplaySetsMap } = this;

    displaySets.forEach(displaySet => {
      if (!activeDisplaySetsMap.has(displaySet.displaySetInstanceUID)) {
        this.activeDisplaySetsChanged = true;
        activeDisplaySets.push(displaySet);
        activeDisplaySetsMap.set(displaySet.displaySetInstanceUID, displaySet);
      }
    });
  }

  /**
   * Sets the handler for unsupported sop classes
   * @param sopClassHandlerUID
   */
  public setUnsuportedSOPClassHandler(sopClassHandler) {
    this.unsupportedSOPClassHandler = sopClassHandler;
  }

  /**
   * Adds new display sets directly, as specified.
   * Use this function when the display sets are created externally directly
   * rather than using the default sop class handlers to create display sets.
   */
  public addDisplaySets(...displaySets: DisplaySet[]): string[] {
    this._addDisplaySetsToCache(displaySets);
    this._addActiveDisplaySets(displaySets);

    // The activeDisplaySetsChanged flag is only seen if we add display sets
    // so, don't broadcast the change if all the display sets were pre-existing.
    this.activeDisplaySetsChanged = false;
    this._broadcastEvent(EVENTS.DISPLAY_SETS_ADDED, {
      displaySetsAdded: displaySets,
      options: { madeInClient: displaySets[0].madeInClient },
    });
    return displaySets;
  }

  public getDisplaySetCache(): Map<string, DisplaySet> {
    return displaySetCache;
  }

  public getMostRecentDisplaySet(): DisplaySet {
    return this.activeDisplaySets[this.activeDisplaySets.length - 1];
  }

  public getActiveDisplaySets(): DisplaySet[] {
    return this.activeDisplaySets;
  }

  public getDisplaySetsForSeries = (seriesInstanceUID: string): DisplaySet[] => {
    return [...displaySetCache.values()].filter(
      displaySet => displaySet.SeriesInstanceUID === seriesInstanceUID
    );
  };

  public getDisplaySetForSOPInstanceUID(
    sopInstanceUID: string,
    seriesInstanceUID: string,
    frameNumber?: number
  ): DisplaySet {
    const displaySets = seriesInstanceUID
      ? this.getDisplaySetsForSeries(seriesInstanceUID)
      : [...this.getDisplaySetCache().values()];

    const displaySet = displaySets.find(ds => {
      return ds.images && ds.images.some(i => i.SOPInstanceUID === sopInstanceUID);
    });

    return displaySet;
  }

  public setDisplaySetMetadataInvalidated(
    displaySetInstanceUID: string,
    invalidateData = true
  ): void {
    const displaySet = this.getDisplaySetByUID(displaySetInstanceUID);

    if (!displaySet) {
      return;
    }

    // broadcast event to update listeners with the new displaySets
    this._broadcastEvent(EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED, {
      displaySetInstanceUID,
      invalidateData,
    });
  }

  public deleteDisplaySet(displaySetInstanceUID) {
    if (!displaySetInstanceUID) {
      return;
    }
    const { activeDisplaySets, activeDisplaySetsMap } = this;

    const activeDisplaySetsIndex = activeDisplaySets.findIndex(
      ds => ds.displaySetInstanceUID === displaySetInstanceUID
    );

    displaySetCache.delete(displaySetInstanceUID);
    activeDisplaySets.splice(activeDisplaySetsIndex, 1);
    activeDisplaySetsMap.delete(displaySetInstanceUID);

    this._broadcastEvent(EVENTS.DISPLAY_SETS_CHANGED, this.activeDisplaySets);
    this._broadcastEvent(EVENTS.DISPLAY_SETS_REMOVED, {
      displaySetInstanceUIDs: [displaySetInstanceUID],
    });
  }

  /**
   * @param {string} displaySetInstanceUID
   * @returns {object} displaySet
   */
  public getDisplaySetByUID = (displaySetInstanceUid: string): DisplaySet => {
    if (typeof displaySetInstanceUid !== 'string') {
      throw new Error(
        `getDisplaySetByUID: displaySetInstanceUid must be a string, you passed ${displaySetInstanceUid}`
      );
    }

    return displaySetCache.get(displaySetInstanceUid);
  };

  /**
   *
   * @param {*} input
   * @param {*} param1: settings: initialViewportSettings by HP or callbacks after rendering
   * @returns {string[]} - added displaySetInstanceUIDs
   */
  makeDisplaySets = (input, { batch = false, madeInClient = false, settings = {} } = {}) => {
    if (!input || !input.length) {
      throw new Error('No instances were provided.');
    }

    if (batch && !input[0].length) {
      throw new Error('Batch displaySet creation does not contain array of array of instances.');
    }

    // If array of instances => One instance.
    const displaySetsAdded = [];

    if (batch) {
      for (let i = 0; i < input.length; i++) {
        const instances = input[i];
        const displaySets = this.makeDisplaySetForInstances(instances, settings);

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

    if (this.activeDisplaySetsChanged) {
      this.activeDisplaySetsChanged = false;
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
  public onModeExit(): void {
    this.getDisplaySetCache().clear();
    this.activeDisplaySets.length = 0;
    this.activeDisplaySetsMap.clear();
  }

  /**
   * This function hides the old makeDisplaySetForInstances function to first
   * separate the instances by sopClassUID so each call have only instances
   * with the same sopClassUID, to avoid a series composed by different
   * sopClassUIDs be filtered inside one of the SOPClassHandler functions and
   * didn't appear in the series list.
   * @param instancesSrc
   * @param settings
   * @returns
   */
  public makeDisplaySetForInstances(instancesSrc: InstanceMetadata[], settings): DisplaySet[] {
    // creating a sopClassUID list and for each sopClass associate its respective
    // instance list
    const instancesForSetSOPClasses = instancesSrc.reduce((sopClassList, instance) => {
      if (!(instance.SOPClassUID in sopClassList)) {
        sopClassList[instance.SOPClassUID] = [];
      }
      sopClassList[instance.SOPClassUID].push(instance);
      return sopClassList;
    }, {});
    // for each sopClassUID, call the old makeDisplaySetForInstances with a
    // instance list composed only by instances with the same sopClassUID and
    // accumulate the displaySets in the variable allDisplaySets
    const sopClasses = Object.keys(instancesForSetSOPClasses);
    let allDisplaySets = [];
    sopClasses.forEach(sopClass => {
      const displaySets = this._makeDisplaySetForInstances(
        instancesForSetSOPClasses[sopClass],
        settings
      );
      allDisplaySets = [...allDisplaySets, ...displaySets];
    });
    return allDisplaySets;
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
  private _makeDisplaySetForInstances(instancesSrc: InstanceMetadata[], settings): DisplaySet[] {
    // Some of the sop class handlers take a direct reference to instances
    // so make sure it gets copied here so that they have their own ref
    let instances = [...instancesSrc];
    const instance = instances[0];

    const existingDisplaySets = this.getDisplaySetsForSeries(instance.SeriesInstanceUID) || [];

    const SOPClassHandlerIds = this.SOPClassHandlerIds;
    const allDisplaySets = [];

    // Iterate over the sop class handlers while there are still instances to add
    for (let i = 0; i < SOPClassHandlerIds.length && instances.length; i++) {
      const SOPClassHandlerId = SOPClassHandlerIds[i];
      const handler = this.extensionManager.getModuleEntry(SOPClassHandlerId);

      if (handler.sopClassUids.includes(instance.SOPClassUID)) {
        // Check if displaySets are already created using this SeriesInstanceUID/SOPClassHandler pair.
        let displaySets = existingDisplaySets.filter(
          displaySet => displaySet.SOPClassHandlerId === SOPClassHandlerId
        );

        if (displaySets.length) {
          // This case occurs when there are already display sets, so remove
          // any instances in existing display sets.
          instances = filterInstances(instances, displaySets);
          // See if an existing display set can add this instance to it,
          // for example, if it is a new image to be added to the existing set
          for (const ds of displaySets) {
            const addedDs = ds.addInstances?.(instances, this);
            if (addedDs) {
              this.activeDisplaySetsChanged = true;
              instances = filterInstances(instances, [addedDs]);
              this._addActiveDisplaySets([addedDs]);
              this.setDisplaySetMetadataInvalidated(addedDs.displaySetInstanceUID);
            }
            // This means that all instances already existed or got added to
            // existing display sets, and had an invalidated event fired
            if (!instances.length) {
              return allDisplaySets;
            }
          }

          if (!instances.length) {
            // Everything is already added - this is just an update caused
            // by something else
            this._addActiveDisplaySets(displaySets);
            return allDisplaySets;
          }
        }

        // The instances array still contains some instances, so try
        // creating additional display sets using the sop class handler
        displaySets = handler.getDisplaySetsFromSeries(instances);

        if (!displaySets || !displaySets.length) {
          continue;
        }

        // applying hp-defined viewport settings to the displaysets
        displaySets.forEach(ds => {
          Object.keys(settings).forEach(key => {
            ds[key] = settings[key];
          });
        });

        this._addDisplaySetsToCache(displaySets);
        this._addActiveDisplaySets(displaySets);

        // It is possible that this SOP class handler handled some instances
        // but there may need to be other instances handled by other handlers,
        // so remove the handled instances
        instances = filterInstances(instances, displaySets);

        allDisplaySets.push(...displaySets);
      }
    }
    // applying the default sopClassUID handler
    if (allDisplaySets.length === 0) {
      // applying hp-defined viewport settings to the displaysets
      const handler = this.extensionManager.getModuleEntry(this.unsupportedSOPClassHandler);
      const displaySets = handler.getDisplaySetsFromSeries(instances);
      if (displaySets?.length) {
        displaySets.forEach(ds => {
          Object.keys(settings).forEach(key => {
            ds[key] = settings[key];
          });
        });

        this._addDisplaySetsToCache(displaySets);
        this._addActiveDisplaySets(displaySets);

        allDisplaySets.push(...displaySets);
      }
    }
    return allDisplaySets;
  }

  /**
   * Iterates over displaysets and invokes comparator for each element.
   * It returns a list of items that has being succeed by comparator method.
   *
   * @param comparator - method to be used on the validation
   * @returns list of displaysets
   */
  public getDisplaySetsBy(comparator: (DisplaySet) => boolean): DisplaySet[] {
    const result = [];

    if (typeof comparator !== 'function') {
      throw new Error(`The comparator ${comparator} was not a function`);
    }

    this.getActiveDisplaySets().forEach(displaySet => {
      if (comparator(displaySet)) {
        result.push(displaySet);
      }
    });

    return result;
  }

  /**
   *
   * @param sortFn function to sort the display sets
   * @param direction direction to sort the display sets
   * @returns void
   */
  public sortDisplaySets(
    sortFn: (a: DisplaySet, b: DisplaySet) => number,
    direction: string,
    suppressEvent = false
  ): void {
    this.activeDisplaySets.sort(sortFn);
    if (direction === 'descending') {
      this.activeDisplaySets.reverse();
    }
    if (!suppressEvent) {
      this._broadcastEvent(EVENTS.DISPLAY_SETS_CHANGED, this.activeDisplaySets);
    }
  }
}
