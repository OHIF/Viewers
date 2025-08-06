import cloneDeep from 'lodash.clonedeep';

import { PubSubService } from '../_shared/pubSubServiceInterface';
import sortBy from '../../utils/sortBy';
import ProtocolEngine from './ProtocolEngine';
import { StudyMetadata } from '../../types/StudyMetadata';
import DisplaySet from '../DisplaySetService/DisplaySet';
import { CommandsManager } from '../../classes';
import * as HangingProtocol from '../../types/HangingProtocol';
import { isDisplaySetFromUrl, sopInstanceLocation } from './custom-attribute/isDisplaySetFromUrl';
import numberOfDisplaySetsWithImages from './custom-attribute/numberOfDisplaySetsWithImages';
import seriesDescriptionsFromDisplaySets from './custom-attribute/seriesDescriptionsFromDisplaySets';
import uuidv4 from '../../utils/uuidv4';
import { getUniqueAttributeFromList } from './lib/getUniqueAttributeFromList';

type Protocol = HangingProtocol.Protocol | HangingProtocol.ProtocolGenerator;

const DEFAULT_VIEWPORT_OPTIONS: HangingProtocol.ViewportOptions = {
  toolGroupId: 'default',
  viewportType: 'stack',
};

export default class HangingProtocolService extends PubSubService {
  static EVENTS = {
    // The PROTOCOL_CHANGED event is fired when the protocol changes
    // and should be immediately applied
    PROTOCOL_CHANGED: 'event::hanging_protocol_changed',
    // The PROTOCOL_RESTORED event is fired instead of a changed event to indicate
    // that an earlier state has been restored as part of a state update, but
    // is not being directly re-applied, but just restored.
    PROTOCOL_RESTORED: 'event::hanging_protocol_restore',
    // The layout has been decided for the hanging protocol - deprecated
    NEW_LAYOUT: 'event::hanging_protocol_new_layout',
    // Fired when the stages within the current protocol are known to have
    // the status set - that is, they are activated (or deactivated).
    STAGE_ACTIVATION: 'event::hanging_protocol_stage_activation',
    CUSTOM_IMAGE_LOAD_PERFORMED: 'event::hanging_protocol_custom_image_load_performed',
  };

  public static REGISTRATION = {
    name: 'hangingProtocolService',
    altName: 'HangingProtocolService',
    create: ({ configuration = {}, commandsManager, servicesManager }) => {
      return new HangingProtocolService(commandsManager, servicesManager);
    },
  };

  studies: StudyMetadata[];
  // stores all the protocols (object or function that returns an object) in a map
  protocols: Map<string, Protocol>;
  // Contains the list of currently active keys
  activeProtocolIds: string[];
  // the current protocol that is being applied to the viewports in object format
  protocol: HangingProtocol.Protocol;
  // The version of the protocol that must not be modified with customizations
  // if it was defined in the protocol definition. This is a copy of the protocol
  // that is used to recompute the computedOptions when necessary as we override
  // the computedOptions in the protocol object itself.
  _originalProtocol: HangingProtocol.Protocol;

  stageIndex = 0;
  _commandsManager: CommandsManager;
  _servicesManager: AppTypes.ServicesManager;
  protocolEngine: ProtocolEngine;
  customViewportSettings = [];
  displaySets: DisplaySet[] = [];
  activeStudy: StudyMetadata;
  debugLogging: false;

  customAttributeRetrievalCallbacks = {
    NumberOfStudyRelatedSeries: {
      name: 'The number of series in the study',
      callback: metadata => metadata.NumberOfStudyRelatedSeries ?? metadata.series?.length,
    },
    NumberOfSeriesRelatedInstances: {
      name: 'The number of instances in the display set',
      callback: metadata => metadata.numImageFrames,
    },
    ModalitiesInStudy: {
      name: 'Gets the array of the modalities for the series',
      callback: metadata => {
        if (metadata.ModalitiesInStudy?.length > 0) {
          return metadata.ModalitiesInStudy;
        }
        if (Array.isArray(metadata.series)) {
          return getUniqueAttributeFromList(metadata.series, 'Modality');
        }
        return [];
      },
    },
    isReconstructable: {
      name: 'Checks if the display set is reconstructable',
      // we can add more advanced checking here
      callback: displaySet => displaySet.isReconstructable ?? false,
    },
    isDisplaySetFromUrl: {
      name: 'Checks if the display set is as specified in the URL',
      callback: isDisplaySetFromUrl,
    },
    sopInstanceLocation: {
      name: 'Gets the position of the specified sop instance',
      callback: sopInstanceLocation,
    },
    seriesDescriptions: {
      name: 'seriesDescriptions',
      description: 'List of Series Descriptions',
      callback: seriesDescriptionsFromDisplaySets,
    },
    numberOfDisplaySetsWithImages: {
      name: 'numberOfDisplaySetsWithImages',
      description: 'Number of displays sets with images',
      callback: numberOfDisplaySetsWithImages,
    },
  };
  listeners = {};
  registeredImageLoadStrategies = {};
  activeImageLoadStrategyName = null;
  customImageLoadPerformed = false;

  /**
   * displaySetMatchDetails = <displaySetId, match>
   * DisplaySetId is the id defined in the hangingProtocol object itself
   * and match is an object that contains information about
   */
  displaySetMatchDetails: Map<
    string, // protocol displaySetId in the displayset selector
    HangingProtocol.DisplaySetMatchDetails
  > = new Map();

  /**
   * An array that contains for each viewport (viewportId) specified in the
   * hanging protocol, an object of the form
   */
  viewportMatchDetails: Map<
    string, // viewportId
    HangingProtocol.ViewportMatchDetails
  > = new Map();

  constructor(commandsManager: CommandsManager, servicesManager: AppTypes.ServicesManager) {
    super(HangingProtocolService.EVENTS);
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
    this.protocols = new Map();
    this.protocolEngine = undefined;
    this.protocol = undefined;
    this.stageIndex = undefined;

    this.studies = [];
  }

  public destroy(): void {
    this.reset();
    this.protocols = new Map();
  }

  public reset(): void {
    this.studies = [];
    this.viewportMatchDetails = new Map();
    this.displaySetMatchDetails = new Map();
    this.protocol = undefined;
    this.stageIndex = undefined;
    this.protocolEngine = undefined;
  }

  /** Leave the hanging protocol in the initialized state */
  public onModeEnter(): void {
    this.reset();
  }

  /**
   * Gets the active protocol information directly, including the direct
   * protocol, stage and active study objects.
   * Should NOT be stored longer term as the protocol
   * object can change internally or be regenerated.
   * Can be used to store the state to recover from exceptions.
   *
   * @returns protocol, stage, activeStudy
   */
  public getActiveProtocol(): {
    protocol: HangingProtocol.Protocol;
    _originalProtocol: HangingProtocol.Protocol;
    stage: HangingProtocol.ProtocolStage;
    stageIndex: number;
    activeStudy?: StudyMetadata;
    viewportMatchDetails: Map<string, HangingProtocol.ViewportMatchDetails>;
    displaySetMatchDetails: Map<string, HangingProtocol.DisplaySetMatchDetails>;
    activeImageLoadStrategyName: string;
  } {
    return {
      protocol: this.protocol,
      _originalProtocol: this._originalProtocol,
      stage: this.protocol?.stages?.[this.stageIndex],
      stageIndex: this.stageIndex,
      activeStudy: this.activeStudy,
      viewportMatchDetails: this.viewportMatchDetails,
      displaySetMatchDetails: this.displaySetMatchDetails,
      activeImageLoadStrategyName: this.activeImageLoadStrategyName,
    };
  }

  /** Gets the hanging protocol state information, which is a storable
   * state information for the hanging protocol consisting of the:
   * protocolId, stageIndex, stageId and activeStudyUID
   */
  public getState(): HangingProtocol.HPInfo {
    if (!this.protocol) {
      return;
    }
    return {
      protocolId: this.protocol.id,
      stageIndex: this.stageIndex,
      stageId: this.protocol.stages[this.stageIndex].id,
      activeStudyUID: this.activeStudy?.StudyInstanceUID,
    };
  }

  /**
   * Filters the series required for running a hanging protocol.
   *
   * This can be extended in the future with more complex selection rules e.g.
   * N series of a given type, and M of a different type, such as all CT series,
   * and all SR, and then everything else.
   *
   * @param protocolId - The ID of the hanging protocol.
   * @param seriesPromises - An array of promises representing the series.
   * @returns An object containing the required series and the remaining series.
   */
  public filterSeriesRequiredForRun(protocolId, seriesPromises) {
    if (Array.isArray(protocolId)) {
      protocolId = protocolId[0];
    }
    const minSeriesLoadedToRunHP =
      this.getProtocolById(protocolId)?.hpInitiationCriteria?.minSeriesLoaded ||
      seriesPromises.length;
    const requiredSeries = seriesPromises.slice(0, minSeriesLoadedToRunHP);
    const remaining = seriesPromises.slice(minSeriesLoadedToRunHP);
    return {
      requiredSeries,
      remaining,
    };
  }

  /** Gets the protocol with id 'default' */
  public getDefaultProtocol(): HangingProtocol.Protocol {
    return this.getProtocolById('default');
  }

  /** Gets the viewport match details.
   * @deprecated because this method is expected to go away as the HP service
   *    becomes more stateless.
   */
  public getMatchDetails(): HangingProtocol.HangingProtocolMatchDetails {
    return {
      viewportMatchDetails: this.viewportMatchDetails,
      displaySetMatchDetails: this.displaySetMatchDetails,
    };
  }

  /**
   * It loops over the protocols map object, and checks whether the protocol
   * is a function, if so, it executes it and returns the result as a protocol object
   * otherwise it returns the protocol object itself
   *
   * @returns all the hanging protocol registered in the HangingProtocolService
   */
  public getProtocols(): HangingProtocol.Protocol[] {
    // this.protocols is a map of protocols with the protocol id as the key
    // and the protocol or a function that returns a protocol as the value
    const protocols = [];
    const keys = this.activeProtocolIds || this.protocols.keys();
    for (const protocolId of keys) {
      const protocol = this.getProtocolById(protocolId);
      if (protocol) {
        protocols.push(protocol);
      }
    }

    return protocols;
  }

  /**
   * Returns the protocol with the given id, it will get the protocol from the
   * protocols map object and if it is a function, it will execute it and return
   * the result as a protocol object
   *
   * @param protocolId - the id of the protocol
   * @returns protocol - the protocol with the given id
   */
  public getProtocolById(protocolId: string, caseInsensitive = true): HangingProtocol.Protocol {
    if (!protocolId) {
      return;
    }
    if (protocolId === this.protocol?.id) {
      return this.protocol;
    }

    let protocol = this.protocols.get(protocolId);
    if (!protocol && caseInsensitive) {
      const lowerCaseId = protocolId.toLowerCase();
      for (const [key] of this.protocols) {
        if (key.toLowerCase() === lowerCaseId) {
          protocol = this.getProtocolById(key);
          break;
        }
      }
    }

    if (!protocol) {
      throw new Error(`No protocol ${protocolId} found`);
    }

    if (protocol instanceof Function) {
      try {
        const { protocol: generatedProtocol } = this._getProtocolFromGenerator(protocol);

        return generatedProtocol;
      } catch (error) {
        console.warn(
          `Error while executing protocol generator for protocol ${protocolId}: ${error}`
        );
      }
    } else {
      return this._validateProtocol(protocol);
    }
  }

  /**
   * It adds a protocol to the protocols map object. If a protocol with the given
   * id already exists, warn the user and overwrite it.  This can be used to
   * set a new "default" protocol.
   *
   * @param {string} protocolId - The id of the protocol.
   * @param {Protocol} protocol - Protocol - This is the protocol that you want to
   * add to the protocol manager.
   */
  public addProtocol(protocolId: string, protocol: Protocol): void {
    if (this.protocols.has(protocolId)) {
      console.warn(`A protocol with id ${protocolId} already exists. It will be overwritten.`);
    }

    if (!(protocol instanceof Function)) {
      protocol = this._validateProtocol(protocol as HangingProtocol.Protocol);
    }

    this.protocols.set(protocolId, protocol);
  }

  /**
   * Add a given protocol object as active.
   * If active protocols ids is null right now, then the specified
   * protocol will become the only active protocol.
   */
  public addActiveProtocolId(id: string): void {
    if (!id) {
      return;
    }
    if (!this.activeProtocolIds) {
      this.activeProtocolIds = [];
    }
    this.activeProtocolIds.push(id);
  }

  /**
   * Sets the active hanging protocols to use, by name.  If the value is empty,
   * then resets the active protocols to all the named items.
   */
  public setActiveProtocolIds(protocolId?: string[] | string): void {
    if (!protocolId || !protocolId.length) {
      this.activeProtocolIds = null;
      console.log('No active protocols, setting all to active');
      return;
    }
    if (typeof protocolId === 'string') {
      this.setActiveProtocolIds([protocolId]);
      return;
    }
    this.activeProtocolIds = [...protocolId];
  }

  /**
   * Sets the active study.
   * This is the study that the hanging protocol will consider active and
   * may or may not be the study that is being shown by the protocol currently,
   * for example, a prior view hanging protocol will NOT show the active study
   * specifically, but will show another study instead.
   */
  public setActiveStudyUID(activeStudyUID: string) {
    if (!activeStudyUID || activeStudyUID === this.activeStudy?.StudyInstanceUID) {
      return;
    }
    this.activeStudy = this.studies.find(it => it.StudyInstanceUID === activeStudyUID);
    return this.activeStudy;
  }

  public hasStudyUID(studyUID: string): boolean {
    return this.studies.some(it => it.StudyInstanceUID === studyUID);
  }

  public addStudy(study) {
    if (!this.hasStudyUID(study.StudyInstanceUID)) {
      this.studies.push(study);
    }
  }

  /**
   * Run the hanging protocol decisions tree on the active study,
   * studies list and display sets, firing a PROTOCOL_CHANGED event when
   * complete to indicate the hanging protocol is ready, and which stage
   * got applied/activated.
   *
   * Also fires a STAGES_ACTIVE event to indicate which stages are able to be
   * activated.
   *
   * @param params is the dataset to run the hanging protocol on.
   * @param params.activeStudy is the "primary" study to hang  This may or may
   *        not be displayed by the actual viewports.
   * @param params.studies is the list of studies to hang.  If absent, will reuse the previous set.
   * @param params.displaySets is the list of display sets associated with
   *        the studies to display in viewports.
   * @param protocol is a specific protocol to apply.
   */
  public run({ studies, displaySets, activeStudy }, protocolId, options = {}) {
    this.studies = [...(studies || this.studies)];
    this.displaySets = displaySets;
    this.setActiveStudyUID(
      activeStudy?.StudyInstanceUID || (activeStudy || this.studies[0])?.StudyInstanceUID
    );

    this.protocolEngine = new ProtocolEngine(
      this.getProtocols(),
      this.customAttributeRetrievalCallbacks
    );

    // Resets the full protocol status here.
    this.protocol = null;

    if (protocolId && typeof protocolId === 'string') {
      const protocol = this.getProtocolById(protocolId);
      this._setProtocol(protocol, options);
    } else {
      const matchedProtocol = this.protocolEngine.run({
        studies: this.studies,
        activeStudy,
        displaySets,
      });
      this._setProtocol(matchedProtocol);
    }

    if (this.protocol?.callbacks?.onProtocolEnter) {
      this._commandsManager.run(this.protocol?.callbacks?.onProtocolEnter);
    }
  }

  /**
   * Returns true, if the hangingProtocol has a custom loading strategy for the images
   * and its callback has been added to the HangingProtocolService
   * @returns A boolean indicating whether a custom image load strategy has been added or not.
   */
  public hasCustomImageLoadStrategy(): boolean {
    return (
      this.activeImageLoadStrategyName !== null &&
      this.registeredImageLoadStrategies[this.activeImageLoadStrategyName] instanceof Function
    );
  }

  /**
   * Returns a boolean indicating whether a custom image load has been performed or not.
   * A custom image load is performed when a custom image load strategy is used to load images.
   * This method is used internally by the HangingProtocolService to determine whether to perform
   * a custom image load or not.
   *
   * @returns A boolean indicating whether a custom image load has been performed or not.
   */
  private getCustomImageLoadPerformed(): boolean {
    return this.customImageLoadPerformed;
  }

  /**
   * Returns a boolean indicating whether a custom image load should be performed or not.
   * A custom image load should be performed if a custom image load strategy has been added to the HangingProtocolService
   * and it has not been performed yet.
   *
   * @returns A boolean indicating whether a custom image load should be performed or not.
   */
  public getShouldPerformCustomImageLoad(): boolean {
    return this.hasCustomImageLoadStrategy() && !this.getCustomImageLoadPerformed();
  }

  /**
   * Set the strategy callback for loading images to the HangingProtocolService
   * @param {string} name strategy name
   * @param {Function} callback image loader callback
   */
  public registerImageLoadStrategy(name, callback): void {
    if (callback instanceof Function && name) {
      this.registeredImageLoadStrategies[name] = callback;
    }
  }

  /**
   * Adds a custom attribute to be used in the HangingProtocol UI and matching rules, including a
   * callback that will be used to calculate the attribute value.
   *
   * @param attributeId The ID used to refer to the attribute (e.g. 'timepointType')
   * @param attributeName The name of the attribute to be displayed (e.g. 'Timepoint Type')
   * @param callback The function used to calculate the attribute value from the other attributes at its level (e.g. study/series/image)
   * @param options to add to the "this" object for the custom attribute retriever
   */
  public addCustomAttribute(
    attributeId: string,
    attributeName: string,
    callback: (metadata: Record<string, unknown>, extraData?: Record<string, unknown>) => unknown,
    options: Record<string, unknown> = {}
  ): void {
    this.customAttributeRetrievalCallbacks[attributeId] = {
      ...options,
      id: attributeId,
      name: attributeName,
      callback,
    };
  }

  /**
   * Executes the callback function for the custom loading strategy for the images
   * if no strategy is set, the default strategy is used
   */
  runImageLoadStrategy(data): boolean {
    const loader = this.registeredImageLoadStrategies[this.activeImageLoadStrategyName];
    const loadedData = loader({
      data,
      displaySetsMatchDetails: this.displaySetMatchDetails,
      viewportMatchDetails: this.viewportMatchDetails,
    });

    // if loader successfully re-arranged the data with the custom strategy
    // and returned the new props, then broadcast them
    if (!loadedData) {
      console.warn('Not able to load data with custom strategy');
      return false;
    }

    this.customImageLoadPerformed = true;
    this._broadcastEvent(this.EVENTS.CUSTOM_IMAGE_LOAD_PERFORMED, loadedData);
    return true;
  }

  _validateProtocol(protocol: HangingProtocol.Protocol): HangingProtocol.Protocol {
    protocol.name = protocol.name ?? protocol.id;
    const { stages } = protocol;

    if (!stages) {
      console.warn('Protocol has not stages:', protocol.id, protocol);
      return;
    }

    for (const id of Object.keys(protocol.displaySetSelectors)) {
      const selector = protocol.displaySetSelectors[id];
      selector.id = id;
      const { seriesMatchingRules } = selector;
      if (!seriesMatchingRules) {
        console.warn('Selector has no series matching rules', protocol.id, id);
        return;
      }
    }

    // Generate viewports automatically as required.
    stages.forEach(stage => {
      if (!stage.viewports) {
        stage.name = stage.name || stage.id;
        stage.viewports = [];
        const { rows, columns } = stage.viewportStructure.properties;

        for (let i = 0; i < rows * columns; i++) {
          const defaultViewport = stage.defaultViewport || protocol.defaultViewport || {};
          stage.viewports.push({
            viewportOptions: {
              ...defaultViewport.viewportOptions,
              viewportId: i === 0 ? 'default' : uuidv4(),
            },
            displaySets: [],
          });
        }
      } else {
        // Clone each viewport to ensure independent objects
        stage.viewports = stage.viewports.map((viewport, index) => {
          const defaultViewport = stage.defaultViewport || protocol.defaultViewport || {};
          const existingViewportId = viewport.viewportOptions?.viewportId;

          return {
            ...viewport,
            viewportOptions: {
              ...defaultViewport.viewportOptions,
              ...viewport.viewportOptions,
              viewportId: existingViewportId
                ? existingViewportId
                : index === 0
                  ? 'default'
                  : uuidv4(),
            },
            displaySets: viewport.displaySets || [],
          };
        });
        stage.viewports.forEach(viewport => {
          viewport.displaySets.forEach(displaySet => {
            displaySet.options = displaySet.options || {};
          });
        });
      }
    });

    return protocol;
  }

  private _getProtocolFromGenerator(protocolGenerator: HangingProtocol.ProtocolGenerator): {
    protocol: HangingProtocol.Protocol;
  } {
    const { protocol } = protocolGenerator({
      servicesManager: this._servicesManager,
      commandsManager: this._commandsManager,
    });

    const validatedProtocol = this._validateProtocol(protocol);

    return {
      protocol: validatedProtocol,
    };
  }

  /**
   * This will return the viewports that need to be updated based on the
   * hanging protocol layout and the displaySetInstanceUID that needs to be updated.
   *
   * This is useful, when for instance we drag and drop a displaySet into a viewport
   * which is in MPR, and we need to update the other viewports that are showing the same
   * layout.
   *
   * However, sometimes since we get out of sync with the hanging protocol layout, when
   * the user use the custom grid layout, we should not update the other viewports, and that is
   * when the isHangingProtocolLayout is set to false.
   *
   * @param viewportId - the id of the viewport that needs to be updated
   * @param displaySetInstanceUID - the displaySetInstanceUID that needs to be updated
   * @param isHangingProtocolLayout - whether the layout is a hanging protocol layout
   * @returns
   */
  getViewportsRequireUpdate(viewportId, displaySetInstanceUID, isHangingProtocolLayout = true) {
    const newDisplaySetInstanceUID = displaySetInstanceUID;
    const defaultReturn = [
      {
        viewportId,
        displaySetInstanceUIDs: [newDisplaySetInstanceUID],
      },
    ];

    if (!isHangingProtocolLayout) {
      return defaultReturn;
    }

    const { displaySetService } = this._servicesManager.services;
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
    if (displaySet?.unsupported) {
      throw new Error('Unsupported displaySet');
    }
    const protocol = this.protocol;
    const protocolStage = protocol.stages[this.stageIndex];
    const protocolViewports = protocolStage.viewports;

    if (!protocolViewports) {
      return defaultReturn;
    }

    const protocolViewport = protocolViewports.find(
      pv => pv.viewportOptions.viewportId === viewportId
    );

    // if no viewport, then we can assume there is no predefined set of
    // rules that should be applied to this viewport while matching
    if (!protocolViewport) {
      return defaultReturn;
    }

    // no support for drag and drop into fusion viewports yet
    // Todo: smart drag and drop would look at the displaySets and
    // replace the same modality type, but later
    if (protocolViewport.displaySets.length > 1) {
      throw new Error('Cannot update viewport with multiple displaySets yet');
    }

    // If there is no displaySet, then we can assume that the viewport
    // is empty and we can just add the new displaySet to it
    if (protocolViewport.displaySets.length === 0) {
      return defaultReturn;
    }

    // If the viewport options says to allow any instance, then we can assume
    // it just updates this viewport.  This is deprecated and will be removed
    if (protocolViewport.viewportOptions.allowUnmatchedView) {
      return defaultReturn;
    }

    // if the viewport is not empty, then we check the displaySets it is showing
    // currently, which means we need to check if the requested updated displaySet
    // follow the same rules as the current displaySets
    const { id: displaySetSelectorId, matchedDisplaySetsIndex = 0 } =
      protocolViewport.displaySets[0];
    const displaySetSelector = protocol.displaySetSelectors[displaySetSelectorId];

    // The display set can allow any view
    if (!displaySetSelector || displaySetSelector.allowUnmatchedView) {
      return defaultReturn;
    }

    // so let's check if the new displaySetInstanceUIDs follow the same rules
    this._validateViewportSpecificMatch(
      {
        displaySetInstanceUIDs: [newDisplaySetInstanceUID],
        viewportOptions: {},
        displaySetOptions: [],
      },
      protocolViewport,
      protocol.displaySetSelectors
    );
    // if we reach here, it means there are some rules that should be applied

    // if we don't have any match details for the displaySetSelector the viewport
    // is currently showing, then we can assume that the new displaySetInstanceUID
    // does not
    if (!this.displaySetMatchDetails.get(displaySetSelectorId)) {
      return defaultReturn;
    }

    const originalProtocol = this._originalProtocol;
    let originalProtocolStage;
    if (!(originalProtocol instanceof Function)) {
      originalProtocolStage = originalProtocol.stages[this.stageIndex];
    }

    // if we reach here, it means that the displaySetInstanceUIDs to be dropped
    // for the desired viewportId are valid, and we can proceed with the update. However
    // we need to check if the displaySets that the viewport were showing
    // was also referenced by other viewports, and if so, we need to update those
    // viewports as well

    // check if displaySetSelectors are used by other viewports, and
    // store the viewportId and displaySetInstanceUIDs that need to be updated
    const viewportsToUpdate = [];
    protocolViewports.forEach((viewport, index) => {
      const viewportNeedsUpdate = viewport.displaySets.some(
        displaySet =>
          displaySet.id === displaySetSelectorId &&
          (displaySet.matchedDisplaySetsIndex || 0) === matchedDisplaySetsIndex
      );

      if (viewportNeedsUpdate) {
        // Try to recompute the viewport options based on the current
        // viewportId that needs update but from its old/original un-computed
        // viewport & displaySet options
        if (originalProtocolStage) {
          const originalViewport = originalProtocolStage.viewports[index];
          const originalViewportOptions = originalViewport.viewportOptions;
          const originalDisplaySetOptions = originalViewport.displaySets;

          viewport.viewportOptions = this.getComputedOptions(originalViewportOptions, [
            newDisplaySetInstanceUID,
          ]);

          viewport.displaySets = this.getComputedOptions(originalDisplaySetOptions, [
            newDisplaySetInstanceUID,
          ]);
        }

        const displaySetInstanceUIDs = [];
        const displaySetOptions = [];

        this._updateDisplaySetInstanceUIDs(
          viewport,
          displaySetSelectorId,
          newDisplaySetInstanceUID,
          this.displaySetMatchDetails,
          displaySetInstanceUIDs,
          displaySetOptions
        );

        viewportsToUpdate.push({
          viewportId: viewport.viewportOptions.viewportId,
          displaySetInstanceUIDs,
          viewportOptions: viewport.viewportOptions,
          displaySetOptions,
        });
      }
    });

    return viewportsToUpdate;
  }

  public runMatchingRules(metadataArray, matchingRules, options) {
    return this.protocolEngine.findMatch(metadataArray, matchingRules, options);
  }

  private _updateDisplaySetInstanceUIDs(
    viewport: HangingProtocol.Viewport,
    displaySetSelectorId: string,
    newDisplaySetInstanceUID: string,
    displaySetMatchDetails: Map<string, HangingProtocol.DisplaySetMatchDetails>,
    displaySetInstanceUIDs: string[],
    displaySetOptions: HangingProtocol.DisplaySetOptions[]
  ) {
    viewport.displaySets.forEach(displaySet => {
      const { id } = displaySet;
      const displaySetMatchDetail = displaySetMatchDetails.get(id);

      const { displaySetInstanceUID: oldDisplaySetInstanceUID } = displaySetMatchDetail;

      const displaySetInstanceUID =
        displaySet.id === displaySetSelectorId
          ? newDisplaySetInstanceUID
          : oldDisplaySetInstanceUID;

      displaySetMatchDetail.displaySetInstanceUID = displaySetInstanceUID;

      displaySetInstanceUIDs.push(displaySetInstanceUID);
      displaySetOptions.push(displaySet);
    });
  }

  /**
   *  Gets a computed options value, or a copy of the options
   * This allows computing values such as the initial image index to use
   * based on custom attribute functions, the same as the validators.
   * Computing individual values is something that can be declared statically
   * as long as the named functions are provided ahead of time, which is much
   * simpler than recomputing the entire protocol.
   */
  public getComputedOptions(
    options: Record<string, unknown> | Array<Record<string, unknown>>,
    displaySetUIDs: string[]
  ): any {
    // Base case: if options is an array, map over the array and recursively call getComputedOptions
    if (Array.isArray(options)) {
      return options.map(option => this.getComputedOptions(option, displaySetUIDs));
    }

    if (options === null) {
      return options;
    }
    if (typeof options !== 'object') {
      return options;
    }

    // If options is an object with a custom attribute, compute a new options object
    if (options.custom) {
      const displaySets = this.displaySets.filter(displaySet =>
        displaySetUIDs.includes(displaySet.displaySetInstanceUID)
      );

      const customKey = options.custom as string;
      if (!(customKey in this.customAttributeRetrievalCallbacks)) {
        throw new Error(
          `Custom key "${customKey}" not found in customAttributeRetrievalCallbacks.`
        );
      }

      const callback = this.customAttributeRetrievalCallbacks[customKey].callback;
      let newOptions = callback.call(options, displaySets);

      if (newOptions === undefined) {
        newOptions = options.defaultValue;
      }

      return this.getComputedOptions(newOptions, displaySetUIDs);
    }

    // If options is an object without a custom attribute, recursively call getComputedOptions on its properties
    const newOptions = {} as Record<string, unknown>;
    for (const key in options) {
      // if not undefined
      if (options[key] !== undefined) {
        newOptions[key] = this.getComputedOptions(options[key], displaySetUIDs);
      }
    }

    return newOptions;
  }

  /**
   * It applied the protocol to the current studies and display sets based on the
   * protocolId that is provided.
   * @param protocolId - name of the registered protocol to be set
   * @param options - options to be passed to the protocol, this is either an array
   * of the displaySetInstanceUIDs to be set on ALL VIEWPORTS OF THE PROTOCOL or an object
   * that contains viewportId as the key and displaySetInstanceUIDs as the value
   * for each viewport that needs to be set.
   * @param errorCallback - callback to be called if there is an error
   * during the protocol application
   *
   * @returns boolean - true if the protocol was applied and no errors were found
   */
  public setProtocol(
    protocolId: string,
    options = {} as HangingProtocol.SetProtocolOptions,
    errorCallback = null
  ): void {
    const foundProtocol = this.protocols.get(protocolId);

    if (!foundProtocol) {
      console.warn(
        `ProtocolEngine::setProtocol - Protocol with id ${protocolId} not found - you should register it first via addProtocol`
      );
      return;
    }

    try {
      const protocol = this._validateProtocol(foundProtocol);

      if (options) {
        this._validateOptions(options);
      }

      this._setProtocol(protocol, options);
    } catch (error) {
      console.log(error);

      if (errorCallback) {
        errorCallback(error);
      }

      throw new Error(error);
    }

    this._commandsManager.run(this.protocol?.callbacks?.onProtocolEnter);
  }

  protected matchActivation(
    matchedViewports: number,
    activation: HangingProtocol.StageActivation = {},
    minViewportsMatched: number
  ): boolean {
    const { displaySetSelectors } = this.protocol;

    const { displaySetSelectorsMatched = [] } = activation;
    for (const dsName of displaySetSelectorsMatched) {
      const displaySetSelector = displaySetSelectors[dsName];
      if (!displaySetSelector) {
        console.warn('No display set selector for', dsName);
        return false;
      }
      const { bestMatch } = this._matchImages(displaySetSelector);
      if (!bestMatch) {
        return false;
      }
    }
    const min = activation.minViewportsMatched ?? minViewportsMatched;

    return matchedViewports >= min;
  }
  /**
   * Updates the stage activation, setting the stageActivation values to
   * 'disabled', 'active', 'passive' where:
   * * disabled means there are insufficient viewports filled to show this
   * * passive means there aren't enough preferred viewports filled to show
   * this stage by default, but it can be manually selected
   * * enabled means there are enough viewports to select this viewport by default
   *
   * The logic is currently simple, just count how many viewports would be
   * filled, and compare to the required/preferred count, but the intent is
   * to allow more complex rules in the future as required.
   *
   * @returns the stage number to apply initially, given the options.
   */
  private _updateStageStatus(options = null as HangingProtocol.SetProtocolOptions) {
    const stages = this.protocol.stages;
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];

      const { matchedViewports } = this._matchAllViewports(stage, options, new Map());
      const activation = stage.stageActivation || {};
      if (this.matchActivation(matchedViewports, activation.passive, 0)) {
        if (this.matchActivation(matchedViewports, activation.enabled, 1)) {
          stage.status = 'enabled';
        } else {
          stage.status = 'passive';
        }
      } else {
        stage.status = 'disabled';
      }
    }

    this._broadcastEvent(this.EVENTS.STAGE_ACTIVATION, {
      protocol: this.protocol,
      stages: this.protocol.stages,
    });
  }

  private _findStageIndex(options = null as HangingProtocol.SetProtocolOptions): number | void {
    const stageId = options?.stageId;
    const protocol = this.protocol;
    const stages = protocol.stages;

    if (stageId) {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        if (stage.id === stageId && stage.status !== 'disabled') {
          return i;
        }
      }
      return;
    }

    const stageIndex = options?.stageIndex;
    if (stageIndex !== undefined) {
      return stages[stageIndex]?.status !== 'disabled' ? stageIndex : undefined;
    }

    let firstNotDisabled: number;

    for (let i = 0; i < stages.length; i++) {
      if (stages[i].status === 'enabled') {
        return i;
      }
      if (firstNotDisabled === undefined && stages[i].status !== 'disabled') {
        firstNotDisabled = i;
      }
    }

    return firstNotDisabled;
  }

  private _setProtocol(
    protocol: HangingProtocol.Protocol,
    options = null as HangingProtocol.SetProtocolOptions
  ): void {
    const old = this.getActiveProtocol();

    try {
      if (!this.protocol || this.protocol.id !== protocol.id) {
        this.stageIndex = options?.stageIndex || 0;
        //Reset load performed to false to re-fire loading strategy at new study opening
        this.customImageLoadPerformed = false;
        this._originalProtocol = this._copyProtocol(protocol);

        // before reassigning the protocol, we need to check if there is a callback
        // on the old protocol that needs to be called
        // Send the notification about updating the state
        if (this.protocol?.callbacks?.onProtocolExit) {
          this._commandsManager.run(this.protocol.callbacks.onProtocolExit);
        }

        this.protocol = protocol;

        const { imageLoadStrategy } = protocol;
        if (imageLoadStrategy) {
          // check if the imageLoadStrategy is a valid strategy
          if (this.registeredImageLoadStrategies[imageLoadStrategy] instanceof Function) {
            this.activeImageLoadStrategyName = imageLoadStrategy;
          }
        } else {
          this.activeImageLoadStrategyName = null;
        }

        this._updateStageStatus(options);
      }

      const stage = this._findStageIndex(options);
      if (stage === undefined) {
        throw new Error(`Can't find applicable stage ${protocol.id} ${options?.stageIndex}`);
      }
      this.stageIndex = stage as number;

      if (this.protocol?.callbacks?.onStageChange) {
        this._commandsManager.run(this.protocol.callbacks.onStageChange);
      }

      this._updateViewports(options);
    } catch (error) {
      console.log(error);
      Object.assign(this, old);
      throw new Error(error);
    }

    if (options?.restoreProtocol !== true) {
      this._broadcastEvent(HangingProtocolService.EVENTS.PROTOCOL_CHANGED, {
        viewportMatchDetails: this.viewportMatchDetails,
        displaySetMatchDetails: this.displaySetMatchDetails,
        protocol: this.protocol,
        stageIdx: this.stageIndex,
        stage: this.protocol.stages[this.stageIndex],
        activeStudyUID: this.activeStudy?.StudyInstanceUID,
      });
    } else {
      this._broadcastEvent(HangingProtocolService.EVENTS.PROTOCOL_RESTORED, {
        protocol: this.protocol,
        stageIdx: this.stageIndex,
        stage: this.protocol.stages[this.stageIndex],
        activeStudyUID: this.activeStudy?.StudyInstanceUID,
      });
    }
  }

  public getStageIndex(protocolId: string, options): number {
    const protocol = this.getProtocolById(protocolId);
    const { stageId, stageIndex } = options;
    if (stageId !== undefined) {
      return protocol.stages.findIndex(it => it.id === stageId);
    }
    if (stageIndex !== undefined) {
      return stageIndex;
    }
    return 0;
  }

  /**
   * Retrieves the number of Stages in the current Protocol or
   * undefined if no protocol or stages are set
   */
  _getNumProtocolStages() {
    if (!this.protocol || !this.protocol.stages || !this.protocol.stages.length) {
      return;
    }

    return this.protocol.stages.length;
  }

  /**
   * Retrieves the current Stage from the current Protocol and stage index
   *
   * @returns {*} The Stage model for the currently displayed Stage
   */
  _getCurrentStageModel() {
    return this.protocol.stages[this.stageIndex];
  }

  /**
   * Gets a new viewport object for missing viewports.  Used to fill
   * new viewports.
   * Looks first for the stage, to see if there is a missingViewport defined,
   * and secondly looks to the overall protocol.
   *
   * Returns a matchInfo object, which can be used to create the actual
   * viewport object (which this class knows nothing about).
   */
  public getMissingViewport(
    protocolId: string,
    stageIdx: number,
    options
  ): HangingProtocol.ViewportMatchDetails {
    if (this.protocol.id !== protocolId) {
      console.warn('setting protocol');
      this.protocol = this.getProtocolById(protocolId);
      this.stageIndex = 0;
    }
    const protocol = this.protocol;
    const stage = protocol.stages[stageIdx] ?? protocol.stages[this.stageIndex];
    const defaultViewport = stage.defaultViewport || protocol.defaultViewport;
    if (!defaultViewport) {
      return;
    }

    const useViewport = { ...defaultViewport };
    return this._matchViewport(useViewport, options);
  }

  /**
   * Gets a sort function that is consistent with the display set sorting performed
   * to match display sets to viewports.
   * @returns a display set sort function
   */
  public getDisplaySetSortFunction(): (displaySetA: DisplaySet, displaySetB: DisplaySet) => number {
    return (displaySetA, displaySetB) => {
      const seriesA = this._getSeriesSortInfoForDisplaySetSort(displaySetA);
      const seriesB = this._getSeriesSortInfoForDisplaySetSort(displaySetB);

      return sortBy(this._getSeriesFieldForDisplaySetSort())(seriesA, seriesB);
    };
  }

  /**
   * Updates the viewports with the selected protocol stage.
   */
  _updateViewports(options = null as HangingProtocol.SetProtocolOptions): void {
    // Make sure we have an active protocol with a non-empty array of display sets
    if (!this._getNumProtocolStages()) {
      throw new Error('No protocol or stages found');
    }

    // each time we are updating the viewports, we need to reset the
    // matching applied
    this.viewportMatchDetails = new Map();
    this.displaySetMatchDetails = new Map();

    // Retrieve the current stage
    const stageModel = this._getCurrentStageModel();

    // If the current stage does not fulfill the requirements to be displayed,
    // stop here.
    if (
      !stageModel ||
      !stageModel.viewportStructure ||
      !stageModel.viewports ||
      !stageModel.viewports.length
    ) {
      console.log('Stage cannot be applied', stageModel);
      return;
    }

    const { layoutType } = stageModel.viewportStructure;
    // Retrieve the properties associated with the current display set's viewport structure template
    // If no such layout properties exist, stop here.
    const layoutProps = stageModel.viewportStructure.properties;
    if (!layoutProps) {
      console.log('No viewportStructure.properties in', stageModel);
      return;
    }

    const { columns: numCols, rows: numRows, layoutOptions = [] } = layoutProps;

    if (this.protocol?.callbacks?.onViewportDataInitialized) {
      this._commandsManager.runCommand('attachProtocolViewportDataListener', {
        protocol: this.protocol,
        stageIndex: this.stageIndex,
      });
    }

    this._broadcastEvent(this.EVENTS.NEW_LAYOUT, {
      layoutType,
      numRows,
      numCols,
      layoutOptions,
    });

    // Loop through each viewport
    this._matchAllViewports(this.protocol.stages[this.stageIndex], options);
  }

  private _matchAllViewports(
    stageModel: HangingProtocol.ProtocolStage,
    options?: HangingProtocol.SetProtocolOptions,
    viewportMatchDetails = this.viewportMatchDetails,
    displaySetMatchDetails = this.displaySetMatchDetails
  ): {
    matchedViewports: number;
    viewportMatchDetails: Map<string, HangingProtocol.ViewportMatchDetails>;
    displaySetMatchDetails: Map<string, HangingProtocol.DisplaySetMatchDetails>;
  } {
    this.activeStudy ||= this.studies[0];
    let matchedViewports = 0;
    stageModel.viewports.forEach(viewport => {
      const viewportId = viewport.viewportOptions.viewportId;
      const matchDetails = this._matchViewport(
        viewport,
        options,
        viewportMatchDetails,
        displaySetMatchDetails
      );
      if (matchDetails) {
        if (
          matchDetails.displaySetsInfo?.length &&
          matchDetails.displaySetsInfo[0].displaySetInstanceUID
        ) {
          matchedViewports++;
        } else {
          console.log('Adding an empty set of display sets for mapping purposes');
          matchDetails.displaySetsInfo = viewport.displaySets.map(it => ({
            displaySetOptions: it,
          }));
        }
        viewportMatchDetails.set(viewportId, matchDetails);
      }
    });
    return {
      matchedViewports,
      viewportMatchDetails,
      displaySetMatchDetails,
    };
  }

  protected findDeduplicatedMatchDetails(
    matchDetails: HangingProtocol.DisplaySetMatchDetails,
    offset: number,
    options: HangingProtocol.SetProtocolOptions = {}
  ): HangingProtocol.DisplaySetMatchDetails {
    if (!matchDetails) {
      return;
    }
    if (offset === 0) {
      return matchDetails;
    }
    const { matchingScores = [] } = matchDetails;
    if (offset === -1) {
      const { inDisplay } = options;
      if (!inDisplay) {
        return matchDetails;
      }
      for (let i = 0; i < matchDetails.matchingScores.length; i++) {
        if (inDisplay.indexOf(matchDetails.matchingScores[i].displaySetInstanceUID) === -1) {
          const match = matchDetails.matchingScores[i];
          return match.matchingScore > 0
            ? {
                matchingScores,
                ...matchDetails.matchingScores[i],
              }
            : null;
        }
      }
      return;
    }
    const matchFound = matchingScores[offset];
    return matchFound ? { ...matchFound, matchingScores } : undefined;
  }

  protected validateDisplaySetSelectMatch(
    match: HangingProtocol.DisplaySetMatchDetails,
    id: string,
    displaySetUID: string
  ): void {
    if (match.displaySetInstanceUID === displaySetUID) {
      return;
    }
    if (!match.matchingScores) {
      throw new Error('No matchingScores found in ' + match);
    }
    for (const subMatch of match.matchingScores) {
      if (subMatch.displaySetInstanceUID === displaySetUID) {
        return;
      }
    }
    throw new Error(`Reused viewport details ${id} with ds ${displaySetUID} not valid`);
  }

  protected _matchViewport(
    viewport: HangingProtocol.Viewport,
    options: HangingProtocol.SetProtocolOptions,
    viewportMatchDetails = this.viewportMatchDetails,
    displaySetMatchDetails = this.displaySetMatchDetails
  ): HangingProtocol.ViewportMatchDetails {
    const displaySetSelectorMap = options?.displaySetSelectorMap || {};
    const { displaySetSelectors = {} } = this.protocol;

    // Matching the displaySets
    for (const displaySet of viewport.displaySets) {
      const { id: displaySetId } = displaySet;

      const displaySetSelector = displaySetSelectors[displaySetId];

      if (!displaySetSelector) {
        console.warn('No display set selector for', displaySetId);
        continue;
      }
      const { bestMatch, matchingScores } = this._matchImages(displaySetSelector);
      displaySetMatchDetails.set(displaySetId, bestMatch);

      if (bestMatch) {
        bestMatch.matchingScores = matchingScores;
      }
    }

    // Loop through each viewport
    const { viewportOptions = DEFAULT_VIEWPORT_OPTIONS } = viewport;
    // DisplaySets for the viewport, Note: this is not the actual displaySet,
    // but it is a info to locate the displaySet from the displaySetService
    const displaySetsInfo = [];
    const { StudyInstanceUID: activeStudyUID } = this.activeStudy;
    viewport.displaySets.forEach(displaySetOptions => {
      const { id, matchedDisplaySetsIndex = 0 } = displaySetOptions;
      const reuseDisplaySetUIDs =
        id && displaySetSelectorMap[`${activeStudyUID}:${id}:${matchedDisplaySetsIndex || 0}`];
      const viewportDisplaySetMain = this.displaySetMatchDetails.get(id);

      const viewportDisplaySet = this.findDeduplicatedMatchDetails(
        viewportDisplaySetMain,
        matchedDisplaySetsIndex,
        options
      );

      // Use the display set provided instead
      if (reuseDisplaySetUIDs) {
        reuseDisplaySetUIDs.forEach(reuseDisplaySetUID => {
          // This display set should have already been validated
          const displaySetInfo: HangingProtocol.DisplaySetInfo = {
            displaySetInstanceUID: reuseDisplaySetUID,
            displaySetOptions,
          };

          displaySetsInfo.push(displaySetInfo);
        });

        return;
      }

      // Use the display set index to allow getting the "next" match, eg
      // matching all display sets, and get the matchedDisplaySetsIndex'th item
      if (viewportDisplaySet) {
        const { displaySetInstanceUID } = viewportDisplaySet;

        const displaySetInfo: HangingProtocol.DisplaySetInfo = {
          displaySetInstanceUID: displaySetInstanceUID,
          displaySetOptions,
        };

        displaySetsInfo.push(displaySetInfo);
      } else {
        console.warn(
          `
             The hanging protocol viewport is requesting to display ${id} displaySet that is not
             matched based on the provided criteria (e.g. matching rules).
            `
        );
      }
    });
    return {
      viewportOptions,
      displaySetsInfo,
    };
  }

  private _validateViewportSpecificMatch(
    displaySetAndViewportOptions: HangingProtocol.DisplaySetAndViewportOptions,
    protocolViewport: HangingProtocol.Viewport,
    displaySetSelectors: Record<string, HangingProtocol.DisplaySetSelector>
  ): void {
    const { displaySetService } = this._servicesManager.services;
    const protocolViewportDisplaySets = protocolViewport.displaySets;
    const numDisplaySetsToSet = displaySetAndViewportOptions.displaySetInstanceUIDs.length;

    if (
      protocolViewportDisplaySets.length > 0 &&
      numDisplaySetsToSet !== protocolViewportDisplaySets.length
    ) {
      throw new Error(
        `The number of displaySets to set ${numDisplaySetsToSet} does not match the number of displaySets in the protocol ${protocolViewportDisplaySets} - not currently implemented`
      );
    }

    displaySetAndViewportOptions.displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

      const { displaySets: displaySetsInfo } = protocolViewport;

      for (const displaySetInfo of displaySetsInfo) {
        const displaySetSelector = displaySetSelectors[displaySetInfo.id];

        if (!displaySetSelector) {
          continue;
        }
        this._validateRequiredSelectors(displaySetSelector, displaySet);
      }
    });
  }

  public areRequiredSelectorsValid(
    displaySetSelectors: HangingProtocol.DisplaySetSelector[],
    displaySet: DisplaySet
  ): boolean {
    let pass = true;
    for (const displaySetSelector of displaySetSelectors) {
      try {
        this._validateRequiredSelectors(displaySetSelector, displaySet);
      } catch (error) {
        pass = false;
        break;
      }
    }
    return pass;
  }

  private _validateRequiredSelectors(
    displaySetSelector: HangingProtocol.DisplaySetSelector,
    displaySet: DisplaySet
  ) {
    const { seriesMatchingRules } = displaySetSelector;

    // only match the required rules
    const requiredRules = seriesMatchingRules.filter(rule => rule.required);
    if (requiredRules.length) {
      const matched = this.protocolEngine.findMatch(displaySet, requiredRules);

      if (!matched || matched.score === 0) {
        throw new Error(
          `The displaySetInstanceUID ${displaySet.displaySetInstanceUID} does not satisfy the required seriesMatching criteria for the protocol`
        );
      }
    }
  }

  _validateOptions(options: HangingProtocol.SetProtocolOptions): void {
    const { displaySetService } = this._servicesManager.services;
    const { displaySetSelectorMap } = options;
    if (displaySetSelectorMap) {
      Object.entries(displaySetSelectorMap).forEach(([key, displaySetInstanceUIDs]) => {
        displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
          const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

          if (!displaySet) {
            throw new Error(
              `The displaySetInstanceUID ${displaySetInstanceUID} is not found in the displaySetService`
            );
          }
        });
      });
    }
  }

  // Match images given a list of Studies and a Viewport's image matching reqs
  protected _matchImages(displaySetRules) {
    // TODO: matching is applied on study and series level, instance
    // level matching needs to be added in future

    // Todo: handle fusion viewports by not taking the first displaySet rule for the viewport
    const { id, studyMatchingRules = [], seriesMatchingRules } = displaySetRules;

    const matchingScores = [];
    let highestSeriesMatchingScore = 0;

    console.log('ProtocolEngine::matchImages', studyMatchingRules, seriesMatchingRules);
    const matchActiveOnly = this.protocol.numberOfPriorsReferenced === -1;
    this.studies.forEach((study, studyInstanceUIDsIndex) => {
      // Skip non-active if active only
      if (matchActiveOnly && this.activeStudy !== study) {
        return;
      }

      const studyDisplaySets = this.displaySets.filter(
        it => it.StudyInstanceUID === study.StudyInstanceUID && !it?.unsupported
      );

      const studyMatchDetails = this.protocolEngine.findMatch(study, studyMatchingRules, {
        studies: this.studies,
        displaySets: studyDisplaySets,
        allDisplaySets: this.displaySets,
        displaySetMatchDetails: this.displaySetMatchDetails,
        studyInstanceUIDsIndex,
      });

      // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
      if (studyMatchDetails.requiredFailed === true) {
        return;
      }

      this.debug('study', study.StudyInstanceUID, 'display sets #', studyDisplaySets.length);
      studyDisplaySets.forEach(displaySet => {
        const { StudyInstanceUID, SeriesInstanceUID, displaySetInstanceUID } = displaySet;
        const seriesMatchDetails = this.protocolEngine.findMatch(
          displaySet,
          seriesMatchingRules,
          // Todo: why we have images here since the matching type does not have it
          {
            studies: this.studies,
            instance: displaySet.images?.[0],
            displaySetMatchDetails: this.displaySetMatchDetails,
            displaySets: studyDisplaySets,
          }
        );

        // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
        if (seriesMatchDetails.requiredFailed === true) {
          this.debug('Display set required failed', displaySet, seriesMatchingRules);
          return;
        }

        this.debug('Found displaySet for rules', displaySet);
        highestSeriesMatchingScore = Math.max(seriesMatchDetails.score, highestSeriesMatchingScore);

        const matchDetails = {
          passed: [],
          failed: [],
        };

        matchDetails.passed = matchDetails.passed.concat(seriesMatchDetails.details.passed);
        matchDetails.passed = matchDetails.passed.concat(studyMatchDetails.details.passed);

        matchDetails.failed = matchDetails.failed.concat(seriesMatchDetails.details.failed);
        matchDetails.failed = matchDetails.failed.concat(studyMatchDetails.details.failed);

        const totalMatchScore = seriesMatchDetails.score + studyMatchDetails.score;

        const imageDetails = {
          StudyInstanceUID,
          SeriesInstanceUID,
          displaySetInstanceUID,
          matchingScore: totalMatchScore,
          matchDetails: matchDetails,
          sortingInfo: {
            score: totalMatchScore,
            study: study.StudyInstanceUID,
            ...this._getSeriesSortInfoForDisplaySetSort(displaySet),
          },
        };

        this.debug('Adding display set', displaySet, imageDetails);
        matchingScores.push(imageDetails);
      });
    });

    if (matchingScores.length === 0) {
      console.log('No match found', id);
    }

    // Sort the matchingScores
    const sortingFunction = sortBy(
      {
        name: 'score',
        reverse: true,
      },
      {
        name: 'study',
        reverse: true,
      },
      this._getSeriesFieldForDisplaySetSort()
    );
    matchingScores.sort((a, b) => sortingFunction(a.sortingInfo, b.sortingInfo));

    const bestMatch = matchingScores[0];

    console.log('ProtocolEngine::matchImages bestMatch', bestMatch, matchingScores);

    return {
      bestMatch,
      matchingScores,
    };
  }

  private _getSeriesSortInfoForDisplaySetSort(displaySet) {
    return {
      [this._getSeriesFieldForDisplaySetSort().name]:
        displaySet.SeriesNumber != null
          ? parseInt(displaySet.SeriesNumber)
          : parseInt(displaySet.seriesNumber),
    };
  }

  private _getSeriesFieldForDisplaySetSort() {
    return { name: 'series' };
  }

  /**
   * Check if the next stage is available
   * @return {Boolean} True if next stage is available or false otherwise
   */
  _isNextStageAvailable() {
    const numberOfStages = this._getNumProtocolStages();

    return this.stageIndex + 1 < numberOfStages;
  }

  /**
   * Check if the previous stage is available
   * @return {Boolean} True if previous stage is available or false otherwise
   */
  _isPreviousStageAvailable(): boolean {
    return this.stageIndex - 1 >= 0;
  }

  /**
   * Changes the current stage to a new stage index in the display set sequence.
   * It checks if the next stage exists.
   *
   * @param {Integer} stageAction An integer value specifying whether next (1) or previous (-1) stage
   * @return {Boolean} True if new stage has set or false, otherwise
   */
  _setCurrentProtocolStage(
    stageAction: number,
    options: HangingProtocol.SetProtocolOptions
  ): boolean {
    // Check if previous or next stage is available
    let i;
    for (
      i = this.stageIndex + stageAction;
      i >= 0 && i < this.protocol.stages.length;
      i += stageAction
    ) {
      if (this.protocol.stages[i].status !== 'disabled') {
        break;
      }
    }
    if (i < 0 || i >= this.protocol.stages.length) {
      return false;
    }

    // Sets the new stage
    this.stageIndex = i;

    // Log the new stage
    this.debug(`ProtocolEngine::setCurrentProtocolStage stage = ${this.stageIndex}`);

    // Since stage has changed, we need to update the viewports
    // and redo matchings
    this._updateViewports(options);

    // Everything went well, broadcast the update, exactly identical to
    // HP applied
    this._broadcastEvent(this.EVENTS.PROTOCOL_CHANGED, {
      viewportMatchDetails: this.viewportMatchDetails,
      displaySetMatchDetails: this.displaySetMatchDetails,
      protocol: this.protocol,
      stageIdx: this.stageIndex,
      stage: this.protocol.stages[this.stageIndex],
    });
    return true;
  }

  /** Set this.debugLogging to true to show debug level logging - needed
   * to be able to figure out why hanging protocols are or are not applying.
   */
  debug(...args): void {
    if (this.debugLogging) {
      console.log(...args);
    }
  }

  _copyProtocol(protocol: Protocol) {
    return cloneDeep(protocol);
  }
}
