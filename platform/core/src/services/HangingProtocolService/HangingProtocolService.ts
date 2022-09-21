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
};

type Protocol = HangingProtocol.Protocol | HangingProtocol.ProtocolGenerator;

class HangingProtocolService {
  studies: StudyMetadata[];
  // stores all the protocols (object or function that returns an object) in a map
  protocols: Map<string, Protocol>;
  // the current protocol that is being applied to the viewports in object format
  protocol: HangingProtocol.Protocol;
  stage: number;
  _commandsManager: Record<string, unknown>;
  _servicesManager: Record<string, unknown>;
  protocolEngine: ProtocolEngine;
  hpAlreadyApplied: boolean[] = [];
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
    string,
    HangingProtocol.DisplaySetMatchDetails
  > = new Map();

  /**
   * An array that contains for each viewport (viewportIndex) specified in the
   * hanging protocol, an object of the form
   */
  viewportMatchDetails = [] as HangingProtocol.ViewportMatchDetails[];

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

  public reset() {
    this.studies = [];
    this.protocols = new Map();
    this.hpAlreadyApplied = [];
    this.viewportMatchDetails = [];
    // this.ProtocolEngine.reset()
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
    // @ts-ignore
    for (const protocolId of this.protocols.keys()) {
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

    if (protocol instanceof Function) {
      try {
        const { protocol: generatedProtocol } = this._getProtocolFromGenerator(
          protocol
        );

        return generatedProtocol;
      } catch (error) {
        console.warn(
          `Error while executing protocol generator for protocol ${id}: ${error}`
        );
      }
    } else {
      return protocol;
    }
  }

  /**
   * It adds a protocol to the protocols map object. If a protocol with the given
   * id already exists, warn the user and overwrite it.
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

    if (protocolId) {
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

  public setHangingProtocolAppliedForViewport(i): void {
    this.hpAlreadyApplied[i] = true;
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

  /**
   * It applied the protocol to the current studies and display sets based on the
   * protocolId that is provided.
   * @param protocolId - name of the protocol to be set
   * @param protocol - protocol object (optional), if not provided, the protocol
   * will be retrieved from the list of protocols by its name
   * @param matchingDisplaySets - predefined display sets to be used for the protocol
   */
  public setProtocol(
    protocolId: string,
    protocol?: HangingProtocol.Protocol,
    matchingDisplaySets?: Record<string, HangingProtocol.DisplaySetMatchDetails>
  ): void {
    if (!protocol) {
      const foundProtocol = this.protocols.get(protocolId);

      if (!foundProtocol) {
        console.warn(
          `HangingProtocolService::setProtocol - protocol ${protocolId} not found`
        );
        return;
      }

      if (foundProtocol instanceof Function) {
        try {
          ({ protocol, matchingDisplaySets } = this._getProtocolFromGenerator(
            foundProtocol
          ));
        } catch (error) {
          console.warn(
            `HangingProtocolService::setProtocol - protocol ${protocolId} failed to execute`,
            error
          );
          return;
        }
      } else {
        protocol = foundProtocol;
      }
    }

    this._setProtocol(protocol, matchingDisplaySets);
  }

  private _setProtocol(
    protocol: HangingProtocol.Protocol,
    matchingDisplaySets?: Record<string, HangingProtocol.DisplaySetMatchDetails>
  ): void {
    this.stage = 0;
    this.protocol = protocol;
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
    this._updateViewports(matchingDisplaySets);

    this._broadcastChange(this.EVENTS.PROTOCOL_CHANGED, {
      viewportMatchDetails: this.viewportMatchDetails,
      displaySetMatchDetails: this.displaySetMatchDetails,
      hpAlreadyApplied: this.hpAlreadyApplied,
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

  private _getProtocolFromGenerator(
    protocolGenerator: HangingProtocol.ProtocolGenerator
  ): {
    protocol: HangingProtocol.Protocol;
    matchingDisplaySets: Record<string, HangingProtocol.DisplaySetMatchDetails>;
  } {
    const { protocol, matchingDisplaySets } = protocolGenerator({
      servicesManager: this._servicesManager,
      commandsManager: this._commandsManager,
    });

    const validatedProtocol = this._validateProtocol(protocol);

    return {
      protocol: validatedProtocol,
      matchingDisplaySets,
    };
  }

  /**
   * Updates the viewports with the selected protocol stage.
   */
  _updateViewports(
    matchingDisplaySets?: Record<string, HangingProtocol.DisplaySetMatchDetails>
  ): void {
    // Make sure we have an active protocol with a non-empty array of display sets
    if (!this._getNumProtocolStages()) {
      console.log('No protocol stages - nothing to display');
      return;
    }

    // each time we are updating the viewports, we need to reset the
    // matching applied
    this.hpAlreadyApplied = [];

    // reset displaySetMatchDetails
    this.displaySetMatchDetails = new Map();

    if (matchingDisplaySets) {
      this.displaySetMatchDetails = new Map(
        Object.entries(matchingDisplaySets)
      );
    }

    // Retrieve the current stage
    const stageModel = this._getCurrentStageModel();

    // If the current stage does not fulfill the requirements to be displayed,
    // stop here.
    if (
      !stageModel ||
      !stageModel.viewportStructure ||
      !stageModel.viewports ||
      !stageModel.displaySets ||
      !stageModel.viewports.length
    ) {
      console.log('Stage cannot be applied', stageModel);
      return;
    }

    this.customImageLoadPerformed = false;
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
    for (const displaySet of stageModel.displaySets) {
      // skip matching if already matched
      if (this.displaySetMatchDetails.has(displaySet.id)) {
        continue;
      }

      const { bestMatch, matchingScores } = this._matchImages(displaySet);
      this.displaySetMatchDetails.set(displaySet.id, bestMatch);

      if (bestMatch) {
        bestMatch.matchingScores = matchingScores;
      }
    }

    // Loop through each viewport
    stageModel.viewports.forEach((viewport, viewportIndex) => {
      const { viewportOptions } = viewport;
      this.hpAlreadyApplied.push(false);

      // DisplaySets for the viewport, Note: this is not the actual displaySet,
      // but it is a info to locate the displaySet from the displaySetService
      const displaySetsInfo = [];
      viewport.displaySets.forEach(
        // Todo: why do we have displaySetIndex here? It is not used in the protocol
        // definition
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

      this.viewportMatchDetails[viewportIndex] = {
        viewportOptions,
        displaySetsInfo,
      };
    });
  }

  // Match images given a list of Studies and a Viewport's image matching reqs
  _matchImages(displaySetRules) {
    // TODO: matching is applied on study and series level, instance
    // level matching needs to be added in future

    // Todo: handle fusion viewports by not taking the first displaySet rule for the viewport
    const {
      studyMatchingRules = [],
      seriesMatchingRules,
      findAll = false,
    } = displaySetRules;

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
   * @param {Integer} stageAction An integer value specifying wheater next (1) or previous (-1) stage
   * @return {Boolean} True if new stage has set or false, otherwise
   */
  _setCurrentProtocolStage(stageAction): boolean {
    //reseting the applied protocols
    this.hpAlreadyApplied = [];
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
}

export default HangingProtocolService;
export { EVENTS };
