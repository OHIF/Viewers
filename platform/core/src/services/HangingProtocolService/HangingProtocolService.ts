import uuidv4 from '../../utils/uuidv4';
import pubSubServiceInterface from '../_shared/pubSubServiceInterface';
import sortBy from '../../utils/sortBy';
import ProtocolEngine from './ProtocolEngine';
import StudyMetadata from '../../types/StudyMetadata';
import IDisplaySet from '../DisplaySetService/IDisplaySet';
import { HangingProtocol } from '../../types';

const EVENTS = {
  STAGE_CHANGE: 'event::hanging_protocol_stage_change',
  PROTOCOL_CHANGED: 'event::hanging_protocol_changed',
  NEW_LAYOUT: 'event::hanging_protocol_new_layout',
  CUSTOM_IMAGE_LOAD_PERFORMED:
    'event::hanging_protocol_custom_image_load_performed',
  HANGING_PROTOCOL_APPLIED_FOR_VIEWPORT:
    'event::hanging_protocol_applied_for_viewport',
};

type Protocol = HangingProtocol.Protocol;

class HangingProtocolService {
  studies: StudyMetadata[];
  // stores all the protocols (object or function that returns an object) in a map
  protocols: Map<string, Protocol>;
  // Contains the list of currently active keys
  activeProtocolIds: string[];
  // the current protocol that is being applied to the viewports in object format
  protocol: HangingProtocol.Protocol;
  stage: number;
  _commandsManager: Record<string, unknown>;
  _servicesManager: Record<string, unknown>;
  protocolEngine: ProtocolEngine;
  customViewportSettings = [];
  displaySets: IDisplaySet[] = [];
  activeStudy: Record<string, unknown>;
  debugLogging: false;
  EVENTS: { [key: string]: string };

  customAttributeRetrievalCallbacks = {
    NumberOfStudyRelatedSeries: {
      name: 'The number of series in the study',
      callback: metadata =>
        metadata.NumberOfStudyRelatedSeries ?? metadata.series?.length,
    },
    NumberOfSeriesRelatedInstances: {
      name: 'The number of instances in the display set',
      callback: metadata => metadata.numImageFrames,
    },
    ModalitiesInStudy: {
      name: 'Gets the array of the modalities for the series',
      callback: metadata =>
        metadata.ModalitiesInStudy ??
        (metadata.series || []).reduce((prev, curr) => {
          const { Modality } = curr;
          if (Modality && prev.indexOf(Modality) == -1) prev.push(Modality);
          return prev;
        }, []),
    },
    isReconstructable: {
      name: 'Checks if the display set is reconstructable',
      // we can add more advanced checking here
      callback: displaySet => displaySet.isReconstructable ?? false,
    },
  };
  listeners = {};
  registeredImageLoadStrategies = {};
  activeImageLoadStrategyName = null;
  customImageLoadPerformed = false;

  /**
   * Whether the hanging protocol is applied for the given viewport index,
   * applying means that the displayset(s) is set for the viewport to be shown
   */
  hpAlreadyApplied: Map<number, boolean> = new Map();

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
   * An array that contains for each viewport (viewportIndex) specified in the
   * hanging protocol, an object of the form
   */
  viewportMatchDetails: Map<
    number, // viewportIndex
    HangingProtocol.ViewportMatchDetails
  > = new Map();

  constructor(commandsManager, servicesManager) {
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
    this.protocols = new Map();
    this.protocolEngine = undefined;
    this.protocol = undefined;
    this.stage = undefined;

    this.studies = [];
    Object.defineProperty(this, 'EVENTS', {
      value: EVENTS,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.assign(this, pubSubServiceInterface);
  }

  public destroy() {
    this.reset();
    this.protocols = new Map();
  }

  public reset() {
    this.studies = [];
    this.hpAlreadyApplied = new Map();
    this.viewportMatchDetails = new Map();
    this.displaySetMatchDetails = new Map();
  }

  public getActiveProtocol(): {
    protocol: HangingProtocol.Protocol;
    stage: number;
  } {
    return { protocol: this.protocol, stage: this.stage };
  }

  public getDefaultProtocol(): HangingProtocol.Protocol {
    return this.getProtocolById('default');
  }

  public getMatchDetails(): HangingProtocol.HangingProtocolMatchDetails {
    return {
      viewportMatchDetails: this.viewportMatchDetails,
      displaySetMatchDetails: this.displaySetMatchDetails,
      hpAlreadyApplied: this.hpAlreadyApplied,
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
    // @ts-ignore
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
  public getProtocolById(id: string): HangingProtocol.Protocol {
    const protocol = this.protocols.get(id);

    return protocol;
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
      console.warn(
        `A protocol with id ${protocolId} already exists. It will be overwritten.`
      );
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
  public addActiveProtocol(id: string): void {
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
  public setActiveProtocols(hangingProtocol?: string[] | string): void {
    if (!hangingProtocol || !hangingProtocol.length) {
      this.activeProtocolIds = null;
      console.log('No active protocols, setting all to active');
      return;
    }
    if (typeof hangingProtocol === 'string') {
      this.setActiveProtocols([hangingProtocol]);
      return;
    }
    this.activeProtocolIds = [...hangingProtocol];
  }

  /**
   * Run the hanging protocol decisions tree on the active study,
   * studies list and display sets, firing a hanging protocol event when
   * complete to indicate the hanging protocol is ready.
   *
   * @param params is the dataset to run the hanging protocol on.
   * @param params.activeStudy is the "primary" study to hang  This may or may
   *        not be displayed by the actual viewports.
   * @param params.studies is the list of studies to hang
   * @param params.displaySets is the list of display sets associated with
   *        the studies to display in viewports.
   * @param protocol is a specific protocol to apply.
   * @returns
   */
  public run({ studies, displaySets, activeStudy }, protocolId) {
    this.studies = [...studies];
    this.displaySets = displaySets;
    this.activeStudy = activeStudy || studies[0];

    this.protocolEngine = new ProtocolEngine(
      this.getProtocols(),
      this.customAttributeRetrievalCallbacks
    );

    if (protocolId && typeof protocolId === 'string') {
      const protocol = this.getProtocolById(protocolId);
      this._setProtocol(protocol);
      return;
    }

    const matchedProtocol = this.protocolEngine.run({
      studies: this.studies,
      activeStudy,
      displaySets,
    });
    this._setProtocol(matchedProtocol);
  }

  /**
   * Returns true, if the hangingProtocol has a custom loading strategy for the images
   * and its callback has been added to the HangingProtocolService
   * @returns {boolean} true
   */
  public hasCustomImageLoadStrategy(): boolean {
    return (
      this.activeImageLoadStrategyName !== null &&
      this.registeredImageLoadStrategies[
        this.activeImageLoadStrategyName
      ] instanceof Function
    );
  }

  public getCustomImageLoadPerformed(): boolean {
    return this.customImageLoadPerformed;
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

  setHangingProtocolAppliedForViewport(i, status, suppressEvent = false) {
    this.hpAlreadyApplied.set(i, status);

    const numberOfViewports = this.viewportMatchDetails.size;
    const numberOfViewportsApplied = Array.from(
      this.hpAlreadyApplied.values()
    ).filter(applied => applied).length;

    const progress = Math.round(
      (numberOfViewportsApplied / numberOfViewports) * 100
    );

    this._broadcastChange(this.EVENTS.HANGING_PROTOCOL_APPLIED_FOR_VIEWPORT, {
      progress: progress,
    });
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
    callback: (metadata: any) => any,
    options: Record<string, any> = {}
  ): void {
    this.customAttributeRetrievalCallbacks[attributeId] = {
      ...options,
      id: attributeId,
      name: attributeName,
      callback,
    };
  }

  /**
   * Switches to the next protocol stage in the display set sequence
   */
  public nextProtocolStage(): void {
    console.log('ProtocolEngine::nextProtocolStage');

    if (!this._setCurrentProtocolStage(1)) {
      console.log('ProtocolEngine::nextProtocolStage failed');
    }
  }

  /**
   * Switches to the previous protocol stage in the display set sequence
   */
  public previousProtocolStage(): void {
    console.log('ProtocolEngine::previousProtocolStage');

    if (!this._setCurrentProtocolStage(-1)) {
      console.log('ProtocolEngine::previousProtocolStage failed');
    }
  }

  /**
   * Executes the callback function for the custom loading strategy for the images
   * if no strategy is set, the default strategy is used
   */
  runImageLoadStrategy(data): void {
    const loader = this.registeredImageLoadStrategies[
      this.activeImageLoadStrategyName
    ];
    const loadedData = loader({
      data,
      displaySetsMatchDetails: this.displaySetMatchDetails,
      viewportMatchDetails: this.viewportMatchDetails,
    });

    // if loader successfully re-arranged the data with the custom strategy
    // and returned the new props, then broadcast them
    if (!loadedData) {
      return;
    }

    this.customImageLoadPerformed = true;
    this._broadcastChange(this.EVENTS.CUSTOM_IMAGE_LOAD_PERFORMED, loadedData);
  }

  _validateProtocol(
    protocol: HangingProtocol.Protocol
  ): HangingProtocol.Protocol {
    protocol.id = protocol.id || protocol.name;
    const defaultViewportOptions = {
      toolGroupId: 'default',
      viewportType: 'stack',
    };
    // Automatically compute some number of attributes if they
    // aren't present.  Makes defining new HPs easier.
    protocol.name = protocol.name || protocol.id;
    const { stages } = protocol;

    // Generate viewports automatically as required.
    stages.forEach(stage => {
      if (!stage.viewports) {
        stage.viewports = [];
        const { rows, columns } = stage.viewportStructure.properties;

        for (let i = 0; i < rows * columns; i++) {
          stage.viewports.push({
            viewportOptions: defaultViewportOptions,
            displaySets: [],
          });
        }
      } else {
        stage.viewports.forEach(viewport => {
          viewport.viewportOptions =
            viewport.viewportOptions || defaultViewportOptions;
          if (!viewport.displaySets) {
            viewport.displaySets = [];
          } else {
            viewport.displaySets.forEach(displaySet => {
              displaySet.options = displaySet.options || {};
            });
          }
        });
      }
    });

    return protocol;
  }

  getViewportsRequireUpdate(viewportIndex, displaySetInstanceUID) {
    const newDisplaySetInstanceUID = displaySetInstanceUID;
    const protocol = this.protocol;
    const protocolStage = protocol.stages[this.stage];
    const protocolViewports = protocolStage.viewports;
    const protocolViewport = protocolViewports[viewportIndex];

    const defaultReturn = [
      {
        viewportIndex,
        displaySetInstanceUIDs: [newDisplaySetInstanceUID],
      },
    ];

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

    // if the viewport is not empty, then we check the displaySets it is showing
    // currently, which means we need to check if the requested updated displaySet
    // follow the same rules as the current displaySets
    const displaySetSelectorId = protocolViewport.displaySets[0].id;
    const displaySetSelector =
      protocol.displaySetSelectors[displaySetSelectorId];

    if (!displaySetSelector) {
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

    // if we reach here, it means that the displaySetInstanceUIDs to be dropped
    // in the viewportIndex are valid, and we can proceed with the update. However
    // we need to check if the displaySets that the viewport were showing
    // was also referenced by other viewports, and if so, we need to update those
    // viewports as well

    // check if displaySetSelectors are used by other viewports, and
    // store the viewportIndex and displaySetInstanceUIDs that need to be updated

    const viewportsToUpdate = [];
    protocolViewports.forEach((viewport, index) => {
      let viewportNeedsUpdate;
      for (const displaySet of viewport.displaySets) {
        if (displaySet.id === displaySetSelectorId) {
          viewportNeedsUpdate = true;
          break;
        }
      }

      if (viewportNeedsUpdate) {
        // we can then loop over the displaySets and choose all of them,
        // but for the one that matches the oldDisplaySetInstanceUID we need to
        // replace it with the newDisplaySetInstanceUID
        const {
          displaySetInstanceUIDs,
          displaySetOptions,
        } = viewport.displaySets.reduce(
          (acc, displaySet) => {
            const { id, options } = displaySet;

            let {
              displaySetInstanceUID: displaySetInstanceUIDToUse,
            } = this.displaySetMatchDetails.get(id);

            if (displaySet.id === displaySetSelectorId) {
              displaySetInstanceUIDToUse = newDisplaySetInstanceUID;
            }

            acc.displaySetInstanceUIDs.push(displaySetInstanceUIDToUse);
            acc.displaySetOptions.push(options);

            return acc;
          },
          { displaySetInstanceUIDs: [], displaySetOptions: [] }
        );

        viewportsToUpdate.push({
          viewportIndex: index,
          displaySetInstanceUIDs,
          viewportOptions: viewport.viewportOptions,
          displaySetOptions,
        });
      }
    });

    return viewportsToUpdate;
  }

  /**
   * It applied the protocol to the current studies and display sets based on the
   * protocolId that is provided.
   * @param protocolId - name of the registered protocol to be set
   * @param options - options to be passed to the protocol, this is either an array
   * of the displaySetInstanceUIDs to be set on ALL VIEWPORTS OF THE PROTOCOL or an object
   * that contains viewportIndex as the key and displaySetInstanceUIDs as the value
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

    const protocol = this._validateProtocol(foundProtocol);

    if (options) {
      this._validateOptions(options);
    }

    try {
      this._setProtocol(protocol, options);
    } catch (error) {
      console.error(error);

      if (errorCallback) {
        errorCallback(error);
      }

      throw new Error(error);
    }
  }

  private _setProtocol(
    protocol: HangingProtocol.Protocol,
    options = null as HangingProtocol.SetProtocolOptions
  ): void {
    this.stage = 0;
    const oldProtocol = this.protocol;
    this.protocol = this._copyProtocol(protocol);

    const { imageLoadStrategy } = protocol;
    if (imageLoadStrategy) {
      // check if the imageLoadStrategy is a valid strategy
      if (
        this.registeredImageLoadStrategies[imageLoadStrategy] instanceof
        Function
      ) {
        this.activeImageLoadStrategyName = imageLoadStrategy;
      }
    }

    try {
      this._updateViewports(options);
    } catch (error) {
      this.protocol = oldProtocol;
      throw new Error(error);
    }

    this._broadcastChange(this.EVENTS.PROTOCOL_CHANGED, {
      viewportMatchDetails: this.viewportMatchDetails,
      displaySetMatchDetails: this.displaySetMatchDetails,
      hpAlreadyApplied: this.hpAlreadyApplied,
      protocol: this.protocol,
    });
  }

  /**
   * Retrieves the number of Stages in the current Protocol or
   * undefined if no protocol or stages are set
   */
  _getNumProtocolStages() {
    if (
      !this.protocol ||
      !this.protocol.stages ||
      !this.protocol.stages.length
    ) {
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
    return this.protocol.stages[this.stage];
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
    // Todo: we can have more intelligent invalidation of the hpAlreadyApplied
    // since sometimes we are just updating some viewports and the rest are
    // already applied (e.g. when we are using the drag and drop)
    this.hpAlreadyApplied = new Map();
    this.viewportMatchDetails = new Map();
    this.displaySetMatchDetails = new Map();
    this.customImageLoadPerformed = false;

    if (options) {
      // if the options are defined, we can fill in the displaySetMatchDetails
      // but we need to also check that any displaySetInstanceUIDs that are
      // provided either at viewport level or at the protocol level SATISFIES
      // the required seriesMatching criteria species in the protocol. Otherwise
      // we need to throw an error. This way protocols become more strict and
      // for instance don't allow drag and drop of displaySets that don't match
      // (in MPR protocol we specify in the displaysetSelector that the displaySet
      // to be used should be reconstructable. Or you can specify that the displaySet
      // should be a localizer only for a protocol)

      // options can be either an object with { displaySetInstanceUIDs, viewportOptions, displaySetOptions }
      // options (global options), or an object of objects with viewportIndex
      // as the key and the { displaySetInstanceUIDs, viewportOptions, displaySetOptions } as the value

      // The following function will update the displaySetMatchDetails in place
      this._updateMatchByOptions(this.protocol, options);
    }

    const { displaySetSelectors = {} } = this.protocol;

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

    this._broadcastChange(this.EVENTS.NEW_LAYOUT, {
      layoutType,
      numRows,
      numCols,
      layoutOptions,
    });

    // Matching the displaySets
    for (
      let viewportIndex = 0;
      viewportIndex < numCols * numRows;
      viewportIndex++
    ) {
      if (viewportIndex >= stageModel.viewports.length) {
        // If we have more viewports than display sets, stop here.
        break;
      }

      const viewport = stageModel.viewports[viewportIndex];

      for (const displaySet of viewport.displaySets) {
        const { id: displaySetId } = displaySet;
        // skip matching if already matched (e.g. by options above)
        if (this.displaySetMatchDetails.has(displaySetId)) {
          continue;
        }
        const displaySetSelector = displaySetSelectors[displaySetId];

        if (!displaySetSelector) {
          console.warn('No display set selector for', displaySetId);
          continue;
        }
        const { bestMatch, matchingScores } = this._matchImages(
          displaySetSelector
        );
        this.displaySetMatchDetails.set(displaySetId, bestMatch);

        if (bestMatch) {
          bestMatch.matchingScores = matchingScores;
        }
      }
    }

    // Loop through each viewport
    stageModel.viewports.forEach((viewport, viewportIndex) => {
      const { viewportOptions = {} } = viewport;
      this.hpAlreadyApplied.set(viewportIndex, false);
      // DisplaySets for the viewport, Note: this is not the actual displaySet,
      // but it is a info to locate the displaySet from the displaySetService
      const displaySetsInfo = [];
      viewport.displaySets.forEach(
        ({ id, displaySetIndex = 0, options: displaySetOptions }) => {
          const viewportDisplaySetMain = this.displaySetMatchDetails.get(id);
          // Use the display set index to allow getting the "next" match, eg
          // matching all display sets, and get the displaySetIndex'th item
          const viewportDisplaySet =
            !viewportDisplaySetMain || displaySetIndex === 0
              ? viewportDisplaySetMain
              : viewportDisplaySetMain.matchingScores[displaySetIndex];

          if (viewportDisplaySet) {
            const {
              SeriesInstanceUID,
              displaySetInstanceUID,
            } = viewportDisplaySet;

            const displaySetInfo: HangingProtocol.DisplaySetInfo = {
              SeriesInstanceUID,
              displaySetInstanceUID,
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
        }
      );

      this.viewportMatchDetails.set(viewportIndex, {
        viewportOptions,
        displaySetsInfo,
      });
    });
  }

  _updateMatchByOptions(
    protocol: Protocol,
    options: HangingProtocol.SetProtocolOptions
  ) {
    const { DisplaySetService } = this._servicesManager.services;

    if (options.displaySetInstanceUIDs) {
      this._updateGlobalMatchByOptions(
        options as HangingProtocol.GlobalProtocolOptions,
        protocol,
        DisplaySetService
      );
      return;
    }

    // Todo: I don't think we need the following anymore, since the drag and
    // drop has been reworked to ask HangingProtocolService to check
    // which viewports need to be updated. I don't think there is other use cases
    // other than drag and drop and thumbnails double click that will specify
    // options at viewport level. if there are the following code will need to be
    // uncommented and tested.
    this._updateViewportSpecificMatchByOptions(
      options as HangingProtocol.ViewportSpecificProtocolOptions,
      protocol
    );
  }

  private _updateViewportSpecificMatchByOptions(
    options: HangingProtocol.ViewportSpecificProtocolOptions,
    protocol: HangingProtocol.Protocol
  ) {
    const { DisplaySetService } = this._servicesManager.services;
    const { displaySetSelectors = {} } = protocol;
    const protocolViewports = protocol.stages[this.stage].viewports;

    // if we get here, we can fill in the displaySetMatchDetails
    for (const viewportIndex in options) {
      const displaySetAndViewportOptions = options[viewportIndex];

      const protocolViewport = protocolViewports[viewportIndex];
      // if the protocol already has the viewport
      if (protocolViewport) {
        // if the protocol has a viewport with specific displaySets, we need to check if the
        // displaySetInstanceUIDs are allowed by the protocol
        this._validateViewportSpecificMatch(
          displaySetAndViewportOptions,
          protocolViewport,
          displaySetSelectors
        );

        displaySetAndViewportOptions.displaySetInstanceUIDs.forEach(
          (displaySetInstanceUID, index) => {
            const displaySet = DisplaySetService.getDisplaySetByUID(
              displaySetInstanceUID
            );

            const displaySetId = protocolViewport.displaySets[index].id;

            // since we are setting the displaySetMatchDetails for each viewport
            // directly, a side effect is that any other viewport that is referencing
            // the same displaySetId will also be updated with the new
            // displaySetMatchDetails, but sometimes this is not a desired behavior
            // which is why we are using the syncDataForViewports to determine if
            // we should update the displaySetMatchDetails for all the viewports
            // that are affected by the syncDataForViewports
            if (protocol.syncDataForViewports) {
              this.displaySetMatchDetails.set(displaySetId, {
                SeriesInstanceUID: displaySet.SeriesInstanceUID,
                StudyInstanceUID: displaySet.StudyInstanceUID,
                displaySetInstanceUID: displaySet.displaySetInstanceUID,
                matchDetails: {},
                matchingScores: [],
                sortingInfo: {},
              });
            } else {
              // if the protocol does not have the syncDataForViewports, we need to
              // update the displaySetMatchDetails by introducing the displaySetIndex
              // to the displaySetMatchDetails. This way we can match the displaySetInstanceUIDs
              // for the viewportIndex, but also for the other viewports that are affected
              // by the syncDataForViewports

              const displaySetSelectorId = `${displaySetId}_${uuidv4()}`;

              // update the displaySetId at the viewport
              protocolViewport.displaySets[index].id = displaySetSelectorId;

              this.displaySetMatchDetails.set(displaySetSelectorId, {
                SeriesInstanceUID: displaySet.SeriesInstanceUID,
                StudyInstanceUID: displaySet.StudyInstanceUID,
                displaySetInstanceUID: displaySet.displaySetInstanceUID,
                matchDetails: {},
                matchingScores: [],
                sortingInfo: {},
              });
            }
          }
        );
      } else {
        // if the protocol does not have the viewport, we need to create it
        const newViewport = {
          displaySets: [],
          viewportOptions: {},
        };

        displaySetAndViewportOptions?.displaySetInstanceUIDs?.forEach(
          (displaySetInstanceUID, index) => {
            const displaySet = DisplaySetService.getDisplaySetByUID(
              displaySetInstanceUID
            );

            const displaySetId = `viewport_${viewportIndex}_displaySet_${index}`;

            newViewport.displaySets.push({
              id: displaySetId,
            });

            this.displaySetMatchDetails.set(displaySetId, {
              SeriesInstanceUID: displaySet.SeriesInstanceUID,
              StudyInstanceUID: displaySet.StudyInstanceUID,
              displaySetInstanceUID: displaySet.displaySetInstanceUID,
              matchDetails: {},
              matchingScores: [],
              sortingInfo: {},
            });
          }
        );

        protocolViewports[viewportIndex] = newViewport;
      }
    }
  }

  private _validateViewportSpecificMatch(
    displaySetAndViewportOptions: HangingProtocol.DisplaySetAndViewportOptions,
    protocolViewport: HangingProtocol.Viewport,
    displaySetSelectors: Record<string, HangingProtocol.DisplaySetSelector>
  ) {
    const { DisplaySetService } = this._servicesManager.services;
    const protocolViewportDisplaySets = protocolViewport.displaySets;
    const numDisplaySetsToSet =
      displaySetAndViewportOptions.displaySetInstanceUIDs.length;

    if (
      protocolViewportDisplaySets.length > 0 &&
      numDisplaySetsToSet !== protocolViewportDisplaySets.length
    ) {
      throw new Error(
        `The number of displaySets to set ${numDisplaySetsToSet} does not match the number of displaySets in the protocol ${protocolViewportDisplaySets} - not currently implemented`
      );
    }

    displaySetAndViewportOptions.displaySetInstanceUIDs.forEach(
      displaySetInstanceUID => {
        const displaySet = DisplaySetService.getDisplaySetByUID(
          displaySetInstanceUID
        );

        const { displaySets: displaySetsInfo } = protocolViewport;

        for (const displaySetInfo of displaySetsInfo) {
          const displaySetSelector = displaySetSelectors[displaySetInfo.id];

          if (!displaySetSelector) {
            continue;
          }
          this._validateRequiredSelectors(displaySetSelector, displaySet);
        }
      }
    );
  }

  private _updateGlobalMatchByOptions(
    options: HangingProtocol.GlobalProtocolOptions,
    protocol: Protocol,
    DisplaySetService: any
  ) {
    const { displaySetSelectors = {} } = protocol;
    const protocolViewports = protocol.stages[this.stage].viewports;

    options = options as HangingProtocol.GlobalProtocolOptions;
    // we need to check each displaySetInstanceUIDs to see if it satisfies the
    // seriesMatching criteria
    options.displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
      const displaySet = DisplaySetService.getDisplaySetByUID(
        displaySetInstanceUID
      );

      // match against all the displaySetSelectors defined in the protocol
      for (const displaySetId in displaySetSelectors) {
        const displaySetSelector = displaySetSelectors[displaySetId];
        this._validateRequiredSelectors(displaySetSelector, displaySet);
      }
    });

    // if we get here, we can fill in the displaySetMatchDetails
    // however, there might be a case where we are asked to
    // render multiple displaySets for a single viewport
    // so we need to go back to viewports and start from there
    const newDisplaySetIds: Set<string> = new Set();

    // Todo: this currently work for current stage only
    protocolViewports.forEach(viewport => {
      viewport.displaySets.forEach(displaySetInfo => {
        const { id: displaySetId } = displaySetInfo;
        if (!this.displaySetMatchDetails.has(displaySetId)) {
          newDisplaySetIds.add(displaySetId);
        }
      });
    });

    // Todo: handle override of the viewport and displaySet options
    Array.from(newDisplaySetIds).forEach((displaySetId, index) => {
      const displaySetInstanceUID = options.displaySetInstanceUIDs[index];

      const displaySet = DisplaySetService.getDisplaySetByUID(
        displaySetInstanceUID
      );

      this.displaySetMatchDetails.set(displaySetId, {
        SeriesInstanceUID: displaySet.SeriesInstanceUID,
        StudyInstanceUID: displaySet.StudyInstanceUID,
        displaySetInstanceUID: displaySet.displaySetInstanceUID,
        matchDetails: {},
        matchingScores: [],
        sortingInfo: {},
      });
    });

    /*
       Todo: make it work for the case  where the number of displaySets
       to set is not equal to the number of displaySets in the protocol, we can modify
       the protocol to have the same number of displaySets for each viewport

      if (newDisplaySetIds.size !== numberOfDisplaySetsToSet) {
        // the remaining ones to set
        const remainingDisplaySetMatches = options.slice(
          newDisplaySetIds.size,
          numberOfDisplaySetsToSet
        );

        protocol[this.stage].viewports.forEach(viewport => {
          const { displaySets } = viewport;

          // push the displaySetsToSet to the end of the displaySets array

          remainingDisplaySetMatches.forEach(({ displaySetInstanceUID }) => {
            displaySets.push({
              id: displaySetInstanceUID,
            });
          });
        });

        remainingDisplaySetMatches.forEach(({ displaySetInstanceUID }) => {
          const displaySet = DisplaySetService.getDisplaySetByUID(
            displaySetInstanceUID
          );

          this.displaySetMatchDetails.set(displaySetInstanceUID, {
            SeriesInstanceUID: displaySet.SeriesInstanceUID,
            StudyInstanceUID: displaySet.StudyInstanceUID,
            displaySetInstanceUID: displaySet.displaySetInstanceUID,
            matchDetails: {},
            matchingScores: [],
            sortingInfo: {},
          });
        });
      }

      // Todo: this has a bug where if the protocol defines only one displaySet,
      // but renders a fusion, it cannot go back to one displaySet since its
      // viewport.displaySets.length is 2 and it should remove the second one
      // later
      */
  }

  private _validateRequiredSelectors(
    displaySetSelector: HangingProtocol.DisplaySetSelector,
    displaySet: any
  ) {
    const { seriesMatchingRules } = displaySetSelector;

    if (seriesMatchingRules.length) {
      // only match the required rules
      const requiredRules = seriesMatchingRules.filter(rule => rule.required);

      const matched = this.protocolEngine.findMatch(displaySet, requiredRules);

      if (!matched || matched.score === 0) {
        throw new Error(
          `The displaySetInstanceUID ${displaySet.displaySetInstanceUID} does not satisfy the required seriesMatching criteria for the protocol`
        );
      }
    }
  }

  _validateOptions(options: HangingProtocol.SetProtocolOptions) {
    const { DisplaySetService } = this._servicesManager.services;

    if (options.displaySetInstanceUIDs) {
      options = options as HangingProtocol.GlobalProtocolOptions;

      options.displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
        const displaySet = DisplaySetService.getDisplaySetByUID(
          displaySetInstanceUID
        );

        if (!displaySet) {
          throw new Error(
            `The displaySetInstanceUID ${displaySetInstanceUID} is not found in the displaySetService`
          );
        }
      });
    }
  }

  // Match images given a list of Studies and a Viewport's image matching reqs
  _matchImages(displaySetRules) {
    // TODO: matching is applied on study and series level, instance
    // level matching needs to be added in future

    // Todo: handle fusion viewports by not taking the first displaySet rule for the viewport
    const { studyMatchingRules = [], seriesMatchingRules } = displaySetRules;

    const matchingScores = [];
    let highestStudyMatchingScore = 0;
    let highestSeriesMatchingScore = 0;

    console.log(
      'ProtocolEngine::matchImages',
      studyMatchingRules,
      seriesMatchingRules
    );
    this.studies.forEach(study => {
      const studyDisplaySets = this.displaySets.filter(
        it => it.StudyInstanceUID === study.StudyInstanceUID
      );
      const studyMatchDetails = this.protocolEngine.findMatch(
        study,
        studyMatchingRules,
        { studies: this.studies, displaySets: studyDisplaySets }
      );

      // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
      if (studyMatchDetails.requiredFailed === true) {
        return;
      }

      highestStudyMatchingScore = studyMatchDetails.score;

      this.debug(
        'study',
        study.StudyInstanceUID,
        'display sets #',
        this.displaySets.length
      );
      this.displaySets.forEach(displaySet => {
        const {
          StudyInstanceUID,
          SeriesInstanceUID,
          displaySetInstanceUID,
        } = displaySet;
        if (StudyInstanceUID !== study.StudyInstanceUID) return;
        const seriesMatchDetails = this.protocolEngine.findMatch(
          displaySet,
          seriesMatchingRules,
          // Todo: why we have images here since the matching type does not have it
          { studies: this.studies, instance: displaySet.images?.[0] }
        );

        // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
        if (seriesMatchDetails.requiredFailed === true) {
          this.debug(
            'Display set required failed',
            displaySet,
            seriesMatchingRules
          );
          return;
        }

        this.debug('Found displaySet for rules', displaySet);
        highestSeriesMatchingScore = Math.max(
          seriesMatchDetails.score,
          highestSeriesMatchingScore
        );

        const matchDetails = {
          passed: [],
          failed: [],
        };

        matchDetails.passed = matchDetails.passed.concat(
          seriesMatchDetails.details.passed
        );
        matchDetails.passed = matchDetails.passed.concat(
          studyMatchDetails.details.passed
        );

        matchDetails.failed = matchDetails.failed.concat(
          seriesMatchDetails.details.failed
        );
        matchDetails.failed = matchDetails.failed.concat(
          studyMatchDetails.details.failed
        );

        const totalMatchScore =
          seriesMatchDetails.score + studyMatchDetails.score;

        const imageDetails = {
          StudyInstanceUID,
          SeriesInstanceUID,
          displaySetInstanceUID,
          matchingScore: totalMatchScore,
          matchDetails: matchDetails,
          sortingInfo: {
            score: totalMatchScore,
            study: study.StudyInstanceUID,
            series: parseInt(displaySet.SeriesNumber),
          },
        };

        this.debug('Adding display set', displaySet, imageDetails);
        matchingScores.push(imageDetails);
      });
    });

    if (matchingScores.length === 0) {
      console.log('No match found');
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
      {
        name: 'series',
      }
    );
    matchingScores.sort((a, b) =>
      sortingFunction(a.sortingInfo, b.sortingInfo)
    );

    const bestMatch = matchingScores[0];

    console.log(
      'ProtocolEngine::matchImages bestMatch',
      bestMatch,
      matchingScores
    );

    return {
      bestMatch,
      matchingScores,
    };
  }

  /**
   * Check if the next stage is available
   * @return {Boolean} True if next stage is available or false otherwise
   */
  _isNextStageAvailable() {
    const numberOfStages = this._getNumProtocolStages();

    return this.stage + 1 < numberOfStages;
  }

  /**
   * Check if the previous stage is available
   * @return {Boolean} True if previous stage is available or false otherwise
   */
  _isPreviousStageAvailable(): boolean {
    return this.stage - 1 >= 0;
  }

  /**
   * Changes the current stage to a new stage index in the display set sequence.
   * It checks if the next stage exists.
   *
   * @param {Integer} stageAction An integer value specifying whether next (1) or previous (-1) stage
   * @return {Boolean} True if new stage has set or false, otherwise
   */
  _setCurrentProtocolStage(stageAction): boolean {
    //resetting the applied protocols
    this.hpAlreadyApplied = new Map();
    // Check if previous or next stage is available
    if (stageAction === -1 && !this._isPreviousStageAvailable()) {
      return false;
    } else if (stageAction === 1 && !this._isNextStageAvailable()) {
      return false;
    }

    // Sets the new stage
    this.stage += stageAction;

    // Log the new stage
    this.debug(`ProtocolEngine::setCurrentProtocolStage stage = ${this.stage}`);

    // Since stage has changed, we need to update the viewports
    // and redo matchings
    this._updateViewports();

    // Everything went well
    this._broadcastChange(this.EVENTS.STAGE_CHANGE, {
      viewportMatchDetails: this.viewportMatchDetails,
      hpAlreadyApplied: this.hpAlreadyApplied,
      displaySetMatchDetails: this.displaySetMatchDetails,
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

  /**
   * Broadcasts hanging protocols changes.
   *
   * @param {string} eventName The event name.add
   * @param {object} eventData.source The measurement source.
   * @param {object} eventData.measurement The measurement.
   * @param {boolean} eventData.notYetUpdatedAtSource True if the measurement was edited
   *      within the measurement service and the source needs to update.
   * @return void
   */
  // Todo: why do we have a separate broadcastChange function here?
  _broadcastChange(eventName, eventData) {
    const hasListeners = Object.keys(this.listeners).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[eventName]);

    if (hasListeners && hasCallbacks) {
      this.listeners[eventName].forEach(listener => {
        listener.callback(eventData);
      });
    }
  }

  _copyProtocol(protocol: Protocol) {
    return JSON.parse(JSON.stringify(protocol));
  }

  /**
  _setProtocolLayoutOptions(protocol: Protocol, { numRows, numCols }) {
    const layoutOptions = [];
    const protocolStage = protocol.stages[this.stage];
    const numViewports = protocolStage.viewports.length;

    for (let i = 0; i < numViewports; i++) {
      const { row, col } = unravelIndex(i, numRows, numCols);
      const w = 1 / numCols;
      const h = 1 / numRows;
      const xPos = col * w;
      const yPos = row * h;

      layoutOptions[i] = {
        width: w,
        height: h,
        x: xPos,
        y: yPos,
      };
    }

    // Todo: handle the case where the viewportStructure is not a grid
    protocolStage.viewportStructure.properties.rows = numRows;
    protocolStage.viewportStructure.properties.columns = numCols;
    protocolStage.viewportStructure.properties.layoutOptions = {
      ...layoutOptions,
    };
  }

  _getUpdatedProtocol({
    numRows,
    numCols,
    protocol: oldProtocol,
  }: {
    numRows: number;
    numCols: number;
    protocol: Protocol;
  }): Protocol {
    let newProtocol = this._copyProtocol(oldProtocol);

    const protocolStage = newProtocol.stages[this.stage];

     // The following commented code is a potential improvements to the
     // hanging protocols to intelligently switch between number of rows
     // and columns based on the old state of the protocol. For instance,
     // changing from 2x2 to 2x3 (adding a column) right now reorders the viewports
     // as well, however, it should just add one empty column to the right
     // and leave the rest of the viewports in place. This sounds amazing,
     // but comes at a cost (which we need to tackle later). The cost is that
     // the viewportIndex will change during this smart change of layout. In
     // the example above the viewport at index (2) bottom left, will now be
     // at index (3) bottom left, and since react will re-render the viewport
     // it will reset the viewport's state such as (zoom, pan, windowLevel, imageIndex)
     // and the user will lose their current state. In addition, all our viewportIds
     // are dependent on the viewportIndex, so we will need to update all the viewportIds
     // as well, and you can see how this can get out of hand. Later, we should
     // tackle this problem and make the smart change of layout work.

    // const { rows: oldNumRows, columns: oldNumCols } = newProtocol.stages[
    //   this.stage
    // ].viewportStructure.properties;

    // const oldToNewViewportIndices = getGridMapping(
    //   {
    //     numRows: oldNumRows,
    //     numCols: oldNumCols,
    //   },
    //   {
    //     numRows,
    //     numCols,
    //   }
    // );

    const protocolViewports = protocolStage.viewports;

    if (protocolViewports.length < numRows * numCols) {
      const newViewports = [];

      for (let i = protocolViewports.length; i < numRows * numCols; i++) {
        newViewports.push({
          viewportOptions: {
            toolGroupId: 'default',
            viewportType: 'stack',
          },
          displaySets: [
            {
              id: `viewport-${i}`,
            },
          ],
        });
      }

      protocolStage.viewports = [...protocolViewports, ...newViewports];
    } else if (protocolViewports.length > numRows * numCols) {
      // remove viewports that are not needed
      protocolStage.viewports = protocolViewports.slice(0, numRows * numCols);
    }

    // update the displaySetMatchDetails to reflect the new viewports
    const toRemove = [];
    this.displaySetMatchDetails.forEach(
      (displaySetMatchDetail, displaySetId) => {
        // if the displaySetId is not referenced in the protocolStage viewports
        // we can remove it
        const found = protocolStage.viewports.find(viewport => {
          return viewport.displaySets.find(displaySet => {
            return displaySet.id === displaySetId;
          });
        });

        if (!found) {
          toRemove.push(displaySetId);
        }
      }
    );

    toRemove.forEach(displaySetId => {
      this.displaySetMatchDetails.delete(displaySetId);
    });

    this._setProtocolLayoutOptions(newProtocol, { numRows, numCols });
    newProtocol = this._validateProtocol(newProtocol);

    // Todo: not sure if we need to reset here, or we can smartly update the
    // viewportMatchDetails and hpAlreadyApplied maps
    this.hpAlreadyApplied = new Map();
    this.viewportMatchDetails = new Map();

    return newProtocol;
  }
  */
}

export default HangingProtocolService;
export { EVENTS };
