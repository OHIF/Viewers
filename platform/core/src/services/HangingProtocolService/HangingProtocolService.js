import cloneDeep from 'lodash.clonedeep';
import pubSubServiceInterface from '../_shared/pubSubServiceInterface';
import sortBy from '../../utils/sortBy.js';
import ProtocolEngine from './ProtocolEngine';
import ThemeProtocols from './themeProtocolProvider';
import ConfigPoint from 'config-point';

const EVENTS = {
  STAGE_CHANGE: 'event::hanging_protocol_stage_change',
  NEW_LAYOUT: 'event::hanging_protocol_new_layout',
};

const VIEWPORT_SETTING_TYPES = {
  PROPS: 'props',
  VIEWPORT: 'viewport',
};

class HangingProtocolService {
  constructor(commandsManager) {
    this._commandsManager = commandsManager;
    this.protocols = [];
    this.ProtocolEngine = undefined;
    this.protocol = undefined;
    this.stage = undefined;
    this.matchDetails = [];
    this.hpAlreadyApplied = [];
    this.studies = [];
    this.customViewportSettings = [];
    this.customAttributeRetrievalCallbacks = {};
    this.listeners = {};
    Object.defineProperty(this, 'EVENTS', {
      value: EVENTS,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.assign(this, pubSubServiceInterface);
  }

  listenThemeProtocols(point) {

    this.addProtocols(point.protocols);
  }

  reset() {
    this.studies = [];
    this.protocols = [];
    this.hpAlreadyApplied = [];
    this.matchDetails = [];

    if (!this._listenThemeProtocols) {
      this._listenThemeProtocols = this.listenThemeProtocols.bind(this);
    }
    ConfigPoint.addLoadListener(ThemeProtocols, this._listenThemeProtocols);
    // this.ProtocolEngine.reset()
  }

  getState() {
    return [this.matchDetails, this.hpAlreadyApplied];
  }

  getProtocols() {
    return this.protocols;
  }

  addProtocols(protocols) {
    protocols.forEach(protocol => {
      if (this.protocols.indexOf(protocol) === -1) {
        protocol.id = protocol.id || protocol.name;
        // Automatically compute some number of attributes if they
        // aren't present.  Makes defining new HPs easier.
        protocol.name = protocol.name || protocol.id;
        const { stages } = protocol;

        // Generate viewports automatically as required.
        stages.forEach(stage => {
          if (!stage.viewports) {
            const viewport = stage.viewport || {};
            stage.viewports = [];
            const { rows, columns } = stage.viewportStructure.properties;

            for (let i = 0; i < rows * columns; i++) {
              stage.viewports.push(viewport);
            }
          }
        });
        this.protocols.push(protocol);
      }
    });
  }

  run(studyMetaData, protocol) {
    if (!this.studies.includes(studyMetaData)) {
      this.studies.push(studyMetaData);
    }
    // copy here so we don't mutate it
    const metaData = Object.assign({}, studyMetaData);

    this.ProtocolEngine = new ProtocolEngine(
      this.protocols,
      this.customAttributeRetrievalCallbacks
    );

    // if there is no pre-defined protocol
    if (!protocol || protocol.id === undefined) {
      const matchedProtocol = this.ProtocolEngine.run(metaData);
      this._setProtocol(matchedProtocol);
      return;
    }

    this._setProtocol(protocol);
  }

  setHangingProtocolAppliedForViewport(i) {
    this.hpAlreadyApplied[i] = true;
  }

  /**
   * Adds a custom setting that can be chosen in the HangingProtocol UI and applied to a Viewport
   *
   * @param settingId The ID used to refer to the setting (e.g. 'displayCADMarkers')
   * @param settingName The name of the setting to be displayed (e.g. 'Display CAD Markers')
   * @param options
   * @param callback A function to be run after a viewport is rendered with a series
   */
  addCustomViewportSetting(...params) {
    this.customViewportSettings.push(...params);
  }

  /**
   * Adds a custom attribute to be used in the HangingProtocol UI and matching rules, including a
   * callback that will be used to calculate the attribute value.
   *
   * @param attributeId The ID used to refer to the attribute (e.g. 'timepointType')
   * @param attributeName The name of the attribute to be displayed (e.g. 'Timepoint Type')
   * @param callback The function used to calculate the attribute value from the other attributes at its level (e.g. study/series/image)
   */
  addCustomAttribute(attributeId, attributeName, callback) {
    this.customAttributeRetrievalCallbacks[attributeId] = {
      name: attributeName,
      callback: callback,
    };
  }

  /**
   * Switches to the next protocol stage in the display set sequence
   */
  nextProtocolStage() {
    console.log('ProtocolEngine::nextProtocolStage');

    if (!this._setCurrentProtocolStage(1)) {
      console.log('ProtocolEngine::nextProtocolStage failed');
    }
  }

  /**
   * Switches to the previous protocol stage in the display set sequence
   */
  previousProtocolStage() {
    console.log('ProtocolEngine::previousProtocolStage');

    if (!this._setCurrentProtocolStage(-1)) {
      console.log('ProtocolEngine::previousProtocolStage failed');
    }
  }

  _setProtocol(protocol) {
    // TODO: Add proper Protocol class to validate the protocols
    // which are entered manually
    this.stage = 0;
    this.protocol = protocol;
    this._updateViewports(protocol);
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

  _updateViewports() {
    // Make sure we have an active protocol with a non-empty array of display sets
    if (!this._getNumProtocolStages()) {
      return;
    }

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
      return;
    }

    // Retrieve the layoutTemplate associated with the current display set's viewport structure
    // If no such template name exists, stop here.
    // const layoutTemplateName = stageModel.viewportStructure.getLayoutTemplateName();
    const layoutTemplateName = 'gridLayout';
    if (!layoutTemplateName) {
      return;
    }

    // Retrieve the properties associated with the current display set's viewport structure template
    // If no such layout properties exist, stop here.
    const layoutProps = stageModel.viewportStructure.properties;
    if (!layoutProps) {
      return;
    }

    const { columns: numCols, rows: numRows } = layoutProps;
    this._broadcastChange(this.EVENTS.NEW_LAYOUT, {
      numRows,
      numCols,
    });

    // Empty the matchDetails associated with the ProtocolEngine.
    // This will be used to store the pass/fail details and score
    // for each of the viewport matching procedures

    // Loop through each viewport
    const alreadyMatched = [];
    stageModel.viewports.forEach((viewport, viewportIndex) => {
      this.hpAlreadyApplied.push(false);
      const details = this._matchImages(viewport, alreadyMatched);

      let currentMatch = details.bestMatch;

      const currentViewportData = {
        viewportIndex,
        SeriesInstanceUID: currentMatch && currentMatch.SeriesInstanceUID,
      };

      // Viewport Settings
      //
      // protocol defined callback
      viewport.viewportSettings = viewport.viewportSettings || [];
      const protocolCallbacks = viewport.viewportSettings.filter(
        setting => setting.type === VIEWPORT_SETTING_TYPES.PROPS
      );
      // manually added callback
      const customCallbacks = this.customViewportSettings.filter(
        setting => setting.type === VIEWPORT_SETTING_TYPES.PROPS
      );
      const callbacks = protocolCallbacks.concat(customCallbacks);

      // if we have callbacks to applied at the app level or at the HP level
      if (callbacks.length) {
        currentViewportData.renderedCallback = (element, ToolBarService) => {
          callbacks.forEach(setting => {
            const { commandName, options } = setting;
            options.viewportIndex = viewportIndex;
            options.element = element;
            // Toolbar service to handle tool activation
            if (commandName === 'setToolActive') {
              ToolBarService.recordInteraction(options);
              return;
            }
            // other commands
            this._commandsManager.runCommand(commandName, options);
          });
        };
      }

      // initial viewport settings defined by protocol
      const protocolInitialViewport = viewport.viewportSettings.filter(
        setting => setting.type === VIEWPORT_SETTING_TYPES.VIEWPORT
      );
      // custom added initial viewport settings
      const customInitialViewport = this.customViewportSettings.filter(
        setting => setting.type === VIEWPORT_SETTING_TYPES.VIEWPORT
      );
      // TODO: conflict might happen between protocol and custom viewport settings
      const viewportSettings = protocolInitialViewport.concat(
        customInitialViewport
      );

      if (viewportSettings.length) {
        const initialViewport = {};
        viewportSettings.forEach(setting => {
          const { options } = setting;
          if (!options) return;
          // Do not manipulate the hp settings
          const viewportOptions = cloneDeep(options);
          Object.entries(viewportOptions).forEach(([key, value]) => {
            initialViewport[key] = value;
          });
        });
        currentViewportData.initialViewport = initialViewport;
      }

      this.matchDetails[viewportIndex] = currentViewportData;
    });
  }

  // Match images given a list of Studies and a Viewport's image matching reqs
  _matchImages(viewport, existingMatches) {
    console.log('ProtocolEngine::matchImages');

    // TODO: matching is applied on study and series level,
    // instance level matching needs to be added in future

    const { studyMatchingRules = [], seriesMatchingRules = [] } = viewport;

    const matchingScores = [];
    let highestStudyMatchingScore = 0;
    let highestSeriesMatchingScore = 0;

    this.studies.forEach(study => {
      const studyMatchDetails = this.ProtocolEngine.findMatch(
        study,
        studyMatchingRules
      );

      // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
      if (
        studyMatchDetails.requiredFailed === true ||
        studyMatchDetails.score < highestStudyMatchingScore
      ) {
        return;
      }

      highestStudyMatchingScore = studyMatchDetails.score;

      // TODO - use display sets instead of series, as that will use the
      // correct re-grouped information.
      study.series.forEach(aSeries => {
        if (existingMatches && existingMatches.indexOf(aSeries) != -1) {
          return;
        }
        const seriesMatchDetails = this.ProtocolEngine.findMatch(
          aSeries,
          seriesMatchingRules
        );

        // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
        if (
          seriesMatchDetails.requiredFailed === true ||
          seriesMatchDetails.score < highestSeriesMatchingScore
        ) {
          return;
        }

        highestSeriesMatchingScore = seriesMatchDetails.score;

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
          StudyInstanceUID: study.StudyInstanceUID,
          SeriesInstanceUID: aSeries.SeriesInstanceUID,
          matchingScore: totalMatchScore,
          matchDetails: matchDetails,
          displaySet: aSeries,
          sortingInfo: {
            score: totalMatchScore,
            study: study.StudyInstanceUID,
            series: parseInt(aSeries.SeriesNumber),
          },
        };

        matchingScores.push(imageDetails);
      });
    });

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
    if (bestMatch?.displaySet) existingMatches.push(bestMatch.displaySet);
    console.log('ProtocolEngine::matchImages bestMatch', bestMatch);

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
  _isPreviousStageAvailable() {
    return this.stage - 1 >= 0;
  }

  /**
   * Changes the current stage to a new stage index in the display set sequence.
   * It checks if the next stage exists.
   *
   * @param {Integer} stageAction An integer value specifying wheater next (1) or previous (-1) stage
   * @return {Boolean} True if new stage has set or false, otherwise
   */
  _setCurrentProtocolStage(stageAction) {
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
    console.log(
      `ProtocolEngine::setCurrentProtocolStage stage = ${this.stage}`
    );

    // Since stage has changed, we need to update the viewports
    // and redo matchings
    this._updateViewports();

    // Everything went well
    this._broadcastChange(this.EVENTS.STAGE_CHANGE, {
      matchDetails: this.matchDetails,
      hpAlreadyApplied: this.hpAlreadyApplied,
    });
    return true;
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
