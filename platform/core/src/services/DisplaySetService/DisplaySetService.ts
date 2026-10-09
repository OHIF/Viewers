import { groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import type {
  CreateDisplaySetSplitRulesOptions,
  GroupInstancesOptions,
  InstanceGroup,
  NaturalizedInstance,
  SplitRuleSet,
} from '@cornerstonejs/metadata';
import { ExtensionManager } from '../../extensions';
import { DisplaySet, InstanceMetadata, ReferencedSeriesSequence } from '../../types';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import EVENTS from './EVENTS';
import * as displaySetStore from './displaySetStore';
import { compileSplitRules, SplitRuleRunError } from './compileSplitRules';
import type {
  CompiledSplitRules,
  SplitRuleCompileError,
  SplitRuleCustomizationEntry,
} from './compileSplitRules';

/** Memoizes compiled split rules by the identity of the customization value. */
const compiledSplitRulesCache = new WeakMap<object, CompiledSplitRules>();

/** The title of the notification that reports a split rule error. */
const SPLIT_RULE_ERROR_TITLE = 'Display set split rules';

/**
 * A split rule that failed at run time for a study (SP-SAFE-3). While the
 * record exists, the service creates no further display sets for the study.
 */
type SplitRuleFailure = {
  /** The `splitRules` customization value that failed; a different value clears the record. */
  ruleSource: object;
  ruleId?: string;
  field?: string;
  seriesInstanceUID?: string;
  message: string;
};

/**
 * What `createDisplaySetFromGroup` is told about the group it builds.
 */
export type CreateDisplaySetFromGroupContext = {
  /** Position of the group in the engine's group list for this split. */
  splitNumber: number;
  /**
   * The host comparator the engine used to order the group (the customization's
   * `compareInstances`). A factory that re-sorts the display set must apply it
   * again, or the re-sort discards the order the engine computed.
   */
  compareInstances?: GroupInstancesOptions['compareInstances'];
};

/**
 * Value shape of the `useMetadataDisplaySet` customization.  When `enabled`,
 * series instances are split into display sets by the
 * `@cornerstonejs/metadata` split-rules engine before (instead of, for the
 * instances the rules match) the registered SOP class handlers.  Instances
 * not matched by any rule fall through to the legacy handler loop unchanged.
 *
 * A rule error stops display set creation, and never falls back to the SOP
 * class handlers (a fallback gives a grouping that looks correct but is not
 * the grouping the deployment intended):
 *
 * - a rule that does not compile, or has a priority that is not a number or
 *   null (SP-SAFE-7): no display sets at all - SEG and SR included - while
 *   that `splitRules` value is in effect;
 * - a rule that throws at run time, in the engine or in
 *   `createDisplaySetFromGroup` / `extendInstances` (SP-SAFE-3): no further
 *   display sets for the study. The display sets that exist stay.
 *
 * Either error shows one persistent error notification that names the rule
 * (and the series, for a run-time error).
 */
export type UseMetadataDisplaySetCustomization = {
  /** Default false — the legacy SOP class handler path is used exclusively. */
  enabled?: boolean;
  /**
   * Rules for `groupInstancesBySplitRules`, keyed by rule id. Each rule has a
   * `priority`: rules run in ascending priority, and the first matching rule
   * wins per instance. The default rules use `1..n`; a priority below 0 runs
   * before them, above 10000 after them, and `null` turns a rule off.
   *
   * An entry is `@cornerstonejs/metadata` raw selector data, a rule that code
   * has already compiled, or a mix of functions and data. Every entry is
   * compiled by `createDisplaySetSplitRules` (see {@link compileSplitRules}),
   * which keeps a function as is. An entry that does not compile is not
   * dropped: it stops display set creation.
   */
  splitRules?: Record<string, SplitRuleCustomizationEntry>;
  /**
   * Named instance classifiers that raw rules reference with
   * `{ classifier: '<name>' }`. Code, supplied by an extension - for example
   * `stackImage` from `@ohif/extension-default`.
   */
  classifiers?: CreateDisplaySetSplitRulesOptions['classifiers'];
  /**
   * Named series functions that raw series facts reference with
   * `{ name, function: '<name>' }`, in addition to the built-in
   * `planeGeometry` and `timeClusters`. Code, supplied by an extension.
   */
  seriesFunctions?: CreateDisplaySetSplitRulesOptions['seriesFunctions'];
  /** Named `customAttributes` recipes that raw rules reference with `preset`. */
  customAttributePresets?: CreateDisplaySetSplitRulesOptions['customAttributePresets'];
  /** Factory converting a matched instance group into an OHIF display set. */
  createDisplaySetFromGroup?: (
    group: InstanceGroup,
    context: CreateDisplaySetFromGroupContext
  ) => DisplaySet | undefined;
  /**
   * The base instance order the engine applies to every rule, before any rule's
   * own `compareInstances`. A whole-list sort, because OHIF's default order is
   * one — `sortImagesByPatientPosition` picks a reference instance and projects
   * onto its normal, which no pairwise comparator expresses.
   *
   * Optional. The display set factory applies OHIF's default order itself (it
   * needs `isReconstructable`, which only exists once the display set is built),
   * so supplying this changes the order the *engine* walks runs in — and hence
   * which display sets a `runBy` rule produces — rather than the final frame
   * order. Unset, the engine's acquisition order applies.
   */
  sortInstances?: GroupInstancesOptions['sortInstances'];
  /**
   * A comparator the engine consults after a rule's own `compareInstances` and
   * before falling back to the base order. Returning 0 declines to have an
   * opinion rather than asserting equality.
   */
  compareInstances?: GroupInstancesOptions['compareInstances'];
};

/** The customization after {@link compileSplitRules}: the rules the engine takes. */
type CompiledSplitConfig = Omit<UseMetadataDisplaySetCustomization, 'splitRules'> & {
  splitRules?: SplitRuleSet;
  /** The `splitRules` customization value the rules came from. */
  splitRulesSource?: object;
  /** The rules that did not compile. Not empty means: create no display sets. */
  compileErrors?: SplitRuleCompileError[];
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

  /**
   * The split rule failures at run time, by StudyInstanceUID (SP-SAFE-3). A
   * study in this map gets no further display sets. A record clears when the
   * `splitRules` value changes, and on `onModeExit`.
   */
  protected splitRuleFailures = new Map<string, SplitRuleFailure>();

  /**
   * The `splitRules` values whose compile errors this mode already reported,
   * so that the notification shows once and not once per series.
   */
  protected reportedSplitRuleSets = new WeakSet<object>();

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
   *
   * It also clears the split rule errors: the next mode starts with no
   * blocked study, and reports a rule set that still has compile errors again.
   */
  public onModeExit(): void {
    displaySetStore.clearDisplaySets();
    this.activeDisplaySets.length = 0;
    this.activeDisplaySetsMap.clear();
    this.splitRuleFailures.clear();
    this.reportedSplitRuleSets = new WeakSet();
  }

  /**
   * This function hides the old makeDisplaySetForInstances function to first
   * separate the instances by sopClassUID so each call have only instances
   * with the same sopClassUID, to avoid a series composed by different
   * sopClassUIDs be filtered inside one of the SOPClassHandler functions and
   * didn't appear in the series list.
   *
   * With the `useMetadataDisplaySet` customization enabled, a split rule error
   * stops display set creation here, before the SOP class handlers too:
   *
   * - a rule set with a compile error creates no display sets (SP-SAFE-7);
   * - a study with a rule that failed at run time gets no further display sets
   *   (SP-SAFE-3).
   *
   * @param instancesSrc
   * @param settings
   * @returns
   */
  public makeDisplaySetForInstances(instancesSrc: InstanceMetadata[], settings): DisplaySet[] {
    let allDisplaySets = [];

    const splitConfig = this._getMetadataSplitCustomization();
    this._clearStaleSplitRuleFailures(splitConfig?.splitRulesSource);
    if (splitConfig?.compileErrors?.length) {
      this._reportSplitRuleCompileErrors(splitConfig);
      return allDisplaySets;
    }

    let remaining = this._withoutFailedStudies(instancesSrc);

    // When the `useMetadataDisplaySet` customization is enabled, split the
    // series with the `@cornerstonejs/metadata` split-rules engine first.
    // The splitter sees a whole series across SOP classes (rules may
    // aggregate series-level facts); instances not matched by any rule fall
    // through to the legacy SOP class handler loop below unchanged.
    if (remaining.length && splitConfig?.enabled && splitConfig.splitRules) {
      const { displaySets, unmatched } = this._makeDisplaySetsWithSplitRules(
        remaining,
        splitConfig,
        settings
      );
      allDisplaySets.push(...displaySets);
      // A rule that failed during this call stops its study here too: the
      // unmatched instances of that study do not go to the SOP class handlers.
      remaining = this._withoutFailedStudies(unmatched);
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
   * Reads the `useMetadataDisplaySet` customization, when available, with its
   * split rules compiled by the `@cornerstonejs/metadata` raw selector
   * compiler (see {@link compileSplitRules}). The compile errors come back in
   * `compileErrors`; the caller must not split with an incomplete rule set.
   */
  private _getMetadataSplitCustomization(): CompiledSplitConfig | undefined {
    const config = this.servicesManager?.services?.customizationService?.getCustomization(
      'useMetadataDisplaySet'
    ) as UseMetadataDisplaySetCustomization | undefined;
    if (!config?.enabled || !config.splitRules || typeof config.splitRules !== 'object') {
      return { ...config, splitRules: undefined };
    }
    let compiled = compiledSplitRulesCache.get(config.splitRules);
    if (!compiled) {
      compiled = compileSplitRules(config.splitRules, {
        classifiers: config.classifiers,
        seriesFunctions: config.seriesFunctions,
        customAttributePresets: config.customAttributePresets,
      });
      compiledSplitRulesCache.set(config.splitRules, compiled);
    }
    return {
      ...config,
      splitRules: compiled.rules,
      splitRulesSource: config.splitRules,
      compileErrors: compiled.errors,
    };
  }

  /**
   * Shows the compile errors of a rule set, once for each `splitRules` value
   * in a mode (SP-SAFE-7, SP-PIPE-13). The message names every rule that
   * failed, because {@link compileSplitRules} compiles each rule alone.
   */
  private _reportSplitRuleCompileErrors(config: CompiledSplitConfig): void {
    const source = config.splitRulesSource;
    if (!source || this.reportedSplitRuleSets.has(source)) {
      return;
    }
    this.reportedSplitRuleSets.add(source);
    const details = config.compileErrors
      .map(({ ruleId, message }) => (ruleId === undefined ? message : `'${ruleId}': ${message}`))
      .join('; ');
    const ruleIds = config.compileErrors
      .map(({ ruleId }) => ruleId)
      .filter(ruleId => ruleId !== undefined);
    const names = ruleIds.length
      ? `${ruleIds.length === 1 ? 'split rule' : 'split rules'} ${ruleIds
          .map(ruleId => `'${ruleId}'`)
          .join(', ')} ${ruleIds.length === 1 ? 'has an error' : 'have errors'}`
      : 'split rules have an error';
    const message =
      `No display sets were created, because the useMetadataDisplaySet ${names}. ` +
      `Correct or remove the rule, then load the study again. ${details}`;
    console.error(`DisplaySetService: ${message}`, config.compileErrors);
    this._showSplitRuleError(message);
  }

  /**
   * Records a split rule failure at run time for the study of the series, and
   * shows it once (SP-SAFE-3, SP-PIPE-9). The study then gets no further
   * display sets; the display sets that exist stay (SP-DET-3).
   *
   * @param failedRuleId - the rule of the group that the service placed when
   *   the error happened, for an error that does not name its rule itself.
   * @param failedStep - the service step that failed, for the same case.
   */
  private _recordSplitRuleFailure(
    seriesInstances: InstanceMetadata[],
    config: CompiledSplitConfig,
    error: unknown,
    failedRuleId?: string,
    failedStep?: string
  ): void {
    const { StudyInstanceUID, SeriesInstanceUID } = seriesInstances[0] ?? {};
    if (this.splitRuleFailures.has(StudyInstanceUID)) {
      return;
    }
    const named = error instanceof SplitRuleRunError;
    const ruleId = named ? error.ruleId : failedRuleId;
    const field = named ? error.field : failedStep;
    const reason = named
      ? error.cause instanceof Error
        ? error.cause.message
        : String(error.cause)
      : error instanceof Error
        ? error.message
        : String(error);
    const where = ruleId
      ? `The split rule '${ruleId}' failed${field ? ` in '${field}'` : ''}`
      : `The split rules failed${field ? ` in '${field}'` : ''}`;
    const message =
      `${where} for series ${SeriesInstanceUID}: ${reason}. ` +
      `No further display sets are created for study ${StudyInstanceUID}.`;
    this.splitRuleFailures.set(StudyInstanceUID, {
      ruleSource: config.splitRulesSource,
      ruleId,
      field,
      seriesInstanceUID: SeriesInstanceUID,
      message,
    });
    console.error(`DisplaySetService: ${message}`, error);
    this._showSplitRuleError(message);
  }

  /**
   * Removes the run-time failures of a rule set that is no longer in effect:
   * the corrected rules get a new chance for the study.
   */
  private _clearStaleSplitRuleFailures(currentSource: object | undefined): void {
    for (const [studyInstanceUID, failure] of this.splitRuleFailures) {
      if (failure.ruleSource !== currentSource) {
        this.splitRuleFailures.delete(studyInstanceUID);
      }
    }
  }

  /** The instances whose study has no split rule failure. */
  private _withoutFailedStudies(instances: InstanceMetadata[]): InstanceMetadata[] {
    if (!instances?.length || !this.splitRuleFailures.size) {
      return instances ?? [];
    }
    return instances.filter(instance => !this.splitRuleFailures.has(instance.StudyInstanceUID));
  }

  /**
   * Shows a split rule error that stays on screen until the user closes it.
   * The notification service is absent in some unit tests.
   */
  private _showSplitRuleError(message: string): void {
    this.servicesManager?.services?.uiNotificationService?.show({
      title: SPLIT_RULE_ERROR_TITLE,
      message,
      type: 'error',
      // Sonner keeps a toast with an infinite duration until the user closes it.
      duration: Infinity,
      autoClose: false,
      // The service shows each failure once; do not let the provider hide it.
      allowDuplicates: true,
    });
  }

  /**
   * Splits `instancesSrc` into display sets using the customization-provided
   * split rules, reconciling with display sets created by earlier calls for
   * the same series (keyed by the deterministic, rule-namespaced `splitKey`).
   *
   * **Existing display sets only grow.** An instance that already has a display
   * set stays in it. A later call - with new instances, or after the rules
   * changed - only places the instances that are new to the series:
   *
   * - into the existing display set that holds the other instances of their
   *   group (via its `extendInstances` attribute, which fires the invalidation
   *   event), else the one with their group's `splitKey`;
   * - otherwise into a new display set of their own.
   *
   * So the result can differ from a split of the complete series from the
   * start: for example a new clip that lands in the middle of a run of single
   * images gets its own display set, and the run's display set keeps the
   * singles on both sides of it. Repeated calls with the same instances add
   * nothing.
   *
   * Splitting is performed one series at a time: unlike the legacy loop (which
   * partitions by SOP class first), the splitter is handed a whole series so
   * rules can aggregate series-level facts, and both the reconciliation key and
   * the rules' `series()` facts are series-scoped (the upstream defaults read
   * `instances[0].Modality`).  Mixed-series input is therefore partitioned
   * rather than assumed away.
   *
   * ### `splitKey` / `splitNumber` stability
   *
   * `splitKey` is namespaced with the rule's id, and holds no position: a
   * `runBy` run is keyed by its first instance, not by its ordinal. It is the
   * key of the group that CREATED the display set; a display set that grew
   * keeps it. `splitNumber` is only an index into the engine's group list and
   * shifts when a new group appears, so it must not be used as a stable
   * identity in `customAttributes`.
   *
   * ### A rule that fails at run time
   *
   * When a rule throws for a series - in the engine, or in the display set
   * factory, which calls the rule's `customAttributes` - the series does NOT
   * go to the SOP class handlers. The service records the failure for the
   * study and shows it (see {@link _recordSplitRuleFailure}); the later series
   * of the study in this call, and its later calls, create no display sets.
   * The display sets that exist stay, including those the failing series
   * created before the error.
   *
   * @returns the newly created display sets and the instances not matched by
   * any split rule (which must flow to the legacy SOP class handler loop).
   */
  private _makeDisplaySetsWithSplitRules(
    instancesSrc: InstanceMetadata[],
    config: CompiledSplitConfig,
    settings
  ): { displaySets: DisplaySet[]; unmatched: InstanceMetadata[] } {
    const bySeries = new Map<string, InstanceMetadata[]>();
    for (const instance of instancesSrc) {
      const seriesInstanceUID = instance.SeriesInstanceUID;
      const series = bySeries.get(seriesInstanceUID);
      if (series) {
        series.push(instance);
      } else {
        bySeries.set(seriesInstanceUID, [instance]);
      }
    }

    const displaySets: DisplaySet[] = [];
    const unmatched: InstanceMetadata[] = [];
    for (const seriesInstances of bySeries.values()) {
      if (this.splitRuleFailures.has(seriesInstances[0].StudyInstanceUID)) {
        // An earlier series of this call failed: no further display sets.
        continue;
      }
      const result = this._splitSeriesIntoDisplaySets(seriesInstances, config, settings);
      displaySets.push(...result.displaySets);
      unmatched.push(...result.unmatched);
    }
    return { displaySets, unmatched };
  }

  /**
   * Splits the instances of a SINGLE series. See
   * {@link _makeDisplaySetsWithSplitRules} for the reconciliation semantics,
   * and for what happens when a rule fails.
   */
  private _splitSeriesIntoDisplaySets(
    instancesSrc: InstanceMetadata[],
    config: CompiledSplitConfig,
    settings
  ): { displaySets: DisplaySet[]; unmatched: InstanceMetadata[] } {
    const added: DisplaySet[] = [];
    // The group and the step in progress, to name the rule of an error that
    // the display set factory throws without a rule name.
    let currentRuleId: string | undefined;
    let currentStep: string | undefined;
    try {
      return this._placeSeriesGroups(instancesSrc, config, settings, added, (ruleId, step) => {
        currentRuleId = ruleId;
        currentStep = step;
      });
    } catch (error) {
      this._recordSplitRuleFailure(instancesSrc, config, error, currentRuleId, currentStep);
      // The display sets made before the error stay; nothing goes to the SOP
      // class handlers.
      return { displaySets: added, unmatched: [] };
    }
  }

  /**
   * The body of {@link _splitSeriesIntoDisplaySets}: groups the series, and
   * places each group. It pushes each new display set into `added` as soon as
   * the service stores it, so the caller keeps them when a later group throws.
   * `onStep` receives the rule and the service step before each factory call.
   */
  private _placeSeriesGroups(
    instancesSrc: InstanceMetadata[],
    config: CompiledSplitConfig,
    settings,
    added: DisplaySet[],
    onStep: (ruleId: string | undefined, step: string | undefined) => void
  ): { displaySets: DisplaySet[]; unmatched: InstanceMetadata[] } {
    const unmatched: InstanceMetadata[] = [];
    const groups: InstanceGroup[] = groupInstancesBySplitRules(
      instancesSrc as unknown as NaturalizedInstance[],
      config.splitRules,
      instance => unmatched.push(instance as unknown as InstanceMetadata),
      // Ordering the engine applies to every rule, so the instance order it
      // walks runs in - and so which display sets a `runBy` rule produces -
      // matches the order the display sets end up in. Optional: with neither
      // supplied the engine's own acquisition order applies, which is what the
      // legacy handler effectively used for run detection.
      {
        sortInstances: config.sortInstances,
        compareInstances: config.compareInstances,
      }
    );

    const uidOf = (instance: { SOPInstanceUID?: string }) => instance.SOPInstanceUID;
    const seriesDisplaySets = this.getDisplaySetsForSeries(instancesSrc[0].SeriesInstanceUID);

    // Where each instance already lives. An instance never moves: a re-split
    // only places the instances that are new to the series.
    const homeOf = new Map<string, DisplaySet>();
    const inOtherDisplaySet = new Set<string>();
    const byKey = new Map<string, DisplaySet>();
    for (const displaySet of seriesDisplaySets) {
      if (!displaySet.splitKey) {
        displaySet.instances?.forEach(instance => inOtherDisplaySet.add(uidOf(instance)));
        continue;
      }
      byKey.set(displaySet.splitKey, displaySet);
      displaySet.instances?.forEach(instance => {
        if (!homeOf.has(uidOf(instance))) {
          homeOf.set(uidOf(instance), displaySet);
        }
      });
    }
    const isNew = (instance: InstanceMetadata) =>
      !homeOf.has(uidOf(instance)) && !inOtherDisplaySet.has(uidOf(instance));

    groups.forEach((group, splitNumber) => {
      const groupInstances = group.instances as unknown as InstanceMetadata[];
      const newInstances = groupInstances.filter(isNew);

      if (!newInstances.length) {
        // Idempotent re-run: every instance already has a display set.
        const homes = new Set(groupInstances.map(instance => homeOf.get(uidOf(instance))));
        homes.delete(undefined);
        this._addActiveDisplaySets([...homes]);
        return;
      }

      // The display set that already holds the group's other instances, else
      // the one with the group's key (a caller that passed only the new
      // instances). Either way the existing display set only grows.
      const target =
        groupInstances.map(instance => homeOf.get(uidOf(instance))).find(Boolean) ??
        byKey.get(group.splitKey);
      onStep(group.matchedRule.id, 'extendInstances');
      let home = target && this._extendSplitDisplaySet(target, newInstances, group, config);

      if (!home) {
        // No display set to extend: the new instances form a display set of
        // their own. The group's older instances stay where they are.
        onStep(group.matchedRule.id, 'createDisplaySetFromGroup');
        home = config.createDisplaySetFromGroup?.(
          { ...group, instances: newInstances as unknown as NaturalizedInstance[] },
          { splitNumber, compareInstances: config.compareInstances }
        );
        if (!home) {
          return;
        }
        // applying hp-defined viewport settings to the displaysets
        Object.keys(settings).forEach(key => {
          home[key] = settings[key];
        });
        this._addDisplaySetsToCache([home]);
        this._addActiveDisplaySets([home]);
        added.push(home);
        if (!byKey.has(group.splitKey)) {
          byKey.set(group.splitKey, home);
        }
      }
      newInstances.forEach(instance => homeOf.set(uidOf(instance), home));
    });

    // An instance that already has a split display set stays there, even when
    // the rules no longer match it.
    return {
      displaySets: added,
      unmatched: unmatched.filter(instance => !homeOf.has(uidOf(instance))),
    };
  }

  /**
   * Adds new instances to an existing split-rule display set, through its
   * `extendInstances` hook, and publishes the change.
   *
   * The series context of the re-split goes with the instances. Every rule of
   * the split shares one context, so the context fits the display set even
   * when another rule placed the new instances.
   *
   * @returns the display set, or undefined when it has no `extendInstances`
   *   hook or the hook declines the instances.
   */
  private _extendSplitDisplaySet(
    displaySet: DisplaySet,
    newInstances: InstanceMetadata[],
    group: InstanceGroup,
    config: CompiledSplitConfig
  ): DisplaySet | undefined {
    const updated = displaySet.extendInstances?.(
      newInstances,
      {
        series: group.series,
        compareInstances: config.compareInstances,
      },
      this
    );
    if (!updated) {
      return undefined;
    }
    this.activeDisplaySetsChanged = true;
    this._addDisplaySetsToCache([updated]);
    this._addActiveDisplaySets([updated]);
    this.setDisplaySetMetadataInvalidated(updated.displaySetInstanceUID);
    return updated;
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
