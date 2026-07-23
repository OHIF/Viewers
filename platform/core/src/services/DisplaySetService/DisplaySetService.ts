import { groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import type { InstanceGroup, NaturalizedInstance, SplitRule } from '@cornerstonejs/metadata';
import { ExtensionManager } from '../../extensions';
import { DisplaySet, InstanceMetadata, ReferencedSeriesSequence } from '../../types';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import EVENTS from './EVENTS';
import * as displaySetStore from './displaySetStore';
import { normalizeSplitRules } from './normalizeSplitRules';

/** Memoizes normalized split-rule arrays by identity (rules change rarely). */
const normalizedSplitRulesCache = new WeakMap<SplitRule[], SplitRule[]>();

/**
 * Value shape of the `useMetadataDisplaySet` customization.  When `enabled`,
 * series instances are split into display sets by the
 * `@cornerstonejs/metadata` split-rules engine before (instead of, for the
 * instances the rules match) the registered SOP class handlers.  Instances
 * not matched by any rule fall through to the legacy handler loop unchanged.
 */
export type UseMetadataDisplaySetCustomization = {
  /** Default false — the legacy SOP class handler path is used exclusively. */
  enabled?: boolean;
  /** Rules for `groupInstancesBySplitRules`; first matching rule wins per instance. */
  splitRules?: SplitRule[];
  /** Factory converting a matched instance group into an OHIF display set. */
  createDisplaySetFromGroup?: (
    group: InstanceGroup,
    context: { splitNumber: number }
  ) => DisplaySet | undefined;
};

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
    create: ({ servicesManager }) => {
      return new DisplaySetService({ servicesManager });
    },
  };

  public activeDisplaySets = [];
  public unsupportedSOPClassHandler;
  extensionManager: ExtensionManager;
  protected servicesManager?: AppTypes.ServicesManager;

  protected activeDisplaySetsMap = new Map<string, DisplaySet>();

  // Record if the active display sets changed - used to group change events so
  // that fewer events need to be fired when creating multiple display sets
  protected activeDisplaySetsChanged = false;

  constructor({ servicesManager }: { servicesManager?: AppTypes.ServicesManager } = {}) {
    super(EVENTS);
    this.servicesManager = servicesManager;
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
      displaySetStore.setDisplaySet(displaySet);
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

  /**
   * @deprecated Returns a read-only snapshot of the display set store —
   * mutating the returned map has no effect.  Display sets are stored in the
   * `@cornerstonejs/metadata` DISPLAY_SET typed metadata module; use
   * `getDisplaySetByUID`, `getActiveDisplaySets` or `getDisplaySetsBy`
   * instead.
   */
  public getDisplaySetCache(): Map<string, DisplaySet> {
    return displaySetStore.getDisplaySetSnapshot();
  }

  public getMostRecentDisplaySet(): DisplaySet {
    return this.activeDisplaySets[this.activeDisplaySets.length - 1];
  }

  public getActiveDisplaySets(): DisplaySet[] {
    return this.activeDisplaySets;
  }

  /**
   * Gets the set of display sets with this series instance UID
   *
   * <b>WARNING: Do not use this method when you have a referenced series sequence
   * as this method does NOT check sop instances.  Instead, use getDisplaySetsForReference
   * to get those with the correct sop instances in them.</b>
   */
  public getDisplaySetsForSeries = (seriesInstanceUID: string): DisplaySet[] => {
    return displaySetStore
      .getAllDisplaySets()
      .filter(displaySet => displaySet.SeriesInstanceUID === seriesInstanceUID);
  };

  /**
   * Given a reference to a series/sop, returns the set of display sets
   * containing an instance from the references.
   */
  public getDisplaySetsForReferences = (
    references: ReferencedSeriesSequence | ReferencedSeriesSequence[]
  ): DisplaySet[] => {
    const mapSeriesReferences = new Map<string, Set<string>>();
    const referenceArr = Array.isArray(references) ? references : [references];
    for (const seriesRef of referenceArr) {
      const { SeriesInstanceUID, ReferencedInstanceSequence } = seriesRef;
      if (!mapSeriesReferences.has(SeriesInstanceUID)) {
        mapSeriesReferences.set(SeriesInstanceUID, new Set<string>());
      }
      const sops = mapSeriesReferences.get(SeriesInstanceUID);
      for (const sopReference of ReferencedInstanceSequence) {
        sops.add(sopReference.ReferencedSOPInstanceUID);
      }
    }

    return displaySetStore.getAllDisplaySets().filter(displaySet => {
      const sopReferences = mapSeriesReferences.get(displaySet.SeriesInstanceUID);
      if (!sopReferences || !displaySet.instances) {
        return;
      }
      return displaySet.instances.some(instance => sopReferences.has(instance.SOPInstanceUID));
    });
  };

  public getDisplaySetForSOPInstanceUID(
    sopInstanceUID: string,
    seriesInstanceUID: string,
    _frameNumber?: number
  ): DisplaySet {
    const displaySets = seriesInstanceUID
      ? this.getDisplaySetsForSeries(seriesInstanceUID)
      : displaySetStore.getAllDisplaySets();

    const displaySet = displaySets.find(ds => {
      return ds.instances?.some(i => i.SOPInstanceUID === sopInstanceUID);
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

    displaySetStore.deleteDisplaySet(displaySetInstanceUID);
    if (activeDisplaySetsIndex !== -1) {
      activeDisplaySets.splice(activeDisplaySetsIndex, 1);
    }
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

    return displaySetStore.getDisplaySet(displaySetInstanceUid);
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
    const displaySetsAdded = new Array<DisplaySet>();

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
    displaySetStore.clearDisplaySets();
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
    let remaining = instancesSrc;
    let allDisplaySets = [];

    // When the `useMetadataDisplaySet` customization is enabled, split the
    // series with the `@cornerstonejs/metadata` split-rules engine first.
    // The splitter sees the whole series across SOP classes (rules may
    // aggregate series-level facts); instances not matched by any rule fall
    // through to the legacy SOP class handler loop below unchanged.
    const splitConfig = this._getMetadataSplitCustomization();
    if (splitConfig?.enabled && splitConfig.splitRules?.length) {
      const { displaySets, unmatched } = this._makeDisplaySetsWithSplitRules(
        instancesSrc,
        splitConfig,
        settings
      );
      allDisplaySets.push(...displaySets);
      remaining = unmatched;
    }

    if (!remaining.length) {
      return allDisplaySets;
    }

    // creating a sopClassUID list and for each sopClass associate its respective
    // instance list
    const instancesForSetSOPClasses = remaining.reduce((sopClassList, instance) => {
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
   * Reads the `useMetadataDisplaySet` customization, when available, with
   * its split rules normalized from any declarative (JSONC / `$function`)
   * form into `@cornerstonejs/metadata` engine shape.
   */
  private _getMetadataSplitCustomization(): UseMetadataDisplaySetCustomization | undefined {
    const config = this.servicesManager?.services?.customizationService?.getCustomization(
      'useMetadataDisplaySet'
    ) as UseMetadataDisplaySetCustomization | undefined;
    if (!config?.enabled || !Array.isArray(config.splitRules)) {
      return config;
    }
    let splitRules = normalizedSplitRulesCache.get(config.splitRules);
    if (!splitRules) {
      splitRules = normalizeSplitRules(config.splitRules);
      normalizedSplitRulesCache.set(config.splitRules, splitRules);
    }
    return { ...config, splitRules };
  }

  /**
   * Splits `instancesSrc` into display sets using the customization-provided
   * split rules, reconciling with display sets created by earlier calls for
   * the same series (keyed by the deterministic, rule-namespaced `splitKey`).
   *
   * Mirrors the idempotency semantics of `_makeDisplaySetForInstances`:
   * repeated calls with the same instances add nothing; calls with new
   * instances update existing display sets (via their `updateInstances`
   * attribute) and fire the invalidation event; regrouped display sets whose
   * split key disappears are deleted.
   *
   * @returns the newly created display sets and the instances not matched by
   * any split rule (which must flow to the legacy SOP class handler loop).
   */
  private _makeDisplaySetsWithSplitRules(
    instancesSrc: InstanceMetadata[],
    config: UseMetadataDisplaySetCustomization,
    settings
  ): { displaySets: DisplaySet[]; unmatched: InstanceMetadata[] } {
    const unmatched: InstanceMetadata[] = [];
    const groups = groupInstancesBySplitRules(
      instancesSrc as unknown as NaturalizedInstance[],
      config.splitRules,
      instance => unmatched.push(instance as unknown as InstanceMetadata)
    );

    if (!groups.length) {
      return { displaySets: [], unmatched };
    }

    const seriesInstanceUID = instancesSrc[0].SeriesInstanceUID;
    const existingByKey = new Map<string, DisplaySet>();
    for (const displaySet of this.getDisplaySetsForSeries(seriesInstanceUID)) {
      if (displaySet.splitKey) {
        existingByKey.set(displaySet.splitKey, displaySet);
      }
    }

    const added: DisplaySet[] = [];
    const seenKeys = new Set<string>();

    groups.forEach((group, splitNumber) => {
      seenKeys.add(group.splitKey);
      const existing = existingByKey.get(group.splitKey);
      if (existing) {
        const newInstances = filterInstances(group.instances as unknown as InstanceMetadata[], [
          existing,
        ]);
        if (!newInstances.length) {
          // Idempotent re-run - everything is already present.
          this._addActiveDisplaySets([existing]);
          return;
        }
        const updated = existing.updateInstances?.(newInstances, this);
        if (updated) {
          this.activeDisplaySetsChanged = true;
          this._addDisplaySetsToCache([updated]);
          this._addActiveDisplaySets([updated]);
          this.setDisplaySetMetadataInvalidated(updated.displaySetInstanceUID);
          return;
        }
        // No updateInstances support - fall through and recreate the display
        // set under a new UID; the stale one is removed below.
        existingByKey.delete(group.splitKey);
        this.deleteDisplaySet(existing.displaySetInstanceUID);
      }

      const displaySet = config.createDisplaySetFromGroup?.(group, { splitNumber });
      if (!displaySet) {
        return;
      }
      // applying hp-defined viewport settings to the displaysets
      Object.keys(settings).forEach(key => {
        displaySet[key] = settings[key];
      });
      this._addDisplaySetsToCache([displaySet]);
      this._addActiveDisplaySets([displaySet]);
      added.push(displaySet);
    });

    // Regrouping across batches (e.g. a mixed-b-value split only detectable
    // once a later batch arrives) can retire previous split keys.  Only
    // delete a stale display set when all of its instances are present in
    // this call - i.e. they were genuinely regrouped - so partial-list
    // callers never delete display sets they cannot see.
    const incomingSOPInstanceUIDs = new Set(instancesSrc.map(instance => instance.SOPInstanceUID));
    for (const [splitKey, displaySet] of existingByKey) {
      if (seenKeys.has(splitKey)) {
        continue;
      }
      const covered = displaySet.instances?.every(instance =>
        incomingSOPInstanceUIDs.has(instance.SOPInstanceUID)
      );
      if (covered) {
        this.deleteDisplaySet(displaySet.displaySetInstanceUID);
      }
    }

    return { displaySets: added, unmatched };
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
              // Refresh the stored value so the metadata store reflects the
              // merged display set (a pure overwrite).
              this._addDisplaySetsToCache([addedDs]);
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
   * @param direction direction to sort the display sets.  Ascending means
   *    increasing in value, which will typically put the lowest series numbers
   *    first, with low priority display sets last with newest first.
   *    The meaning of this flag may change to leave the image/non-image display
   *    set sorting alone and only affect sorting within groups, or have additional
   *    values for specific changes to the sort.
   * @returns void
   */
  public sortDisplaySets(
    sortFn: (a: DisplaySet, b: DisplaySet) => number,
    direction: 'ascending' | 'descending' = 'ascending',
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
