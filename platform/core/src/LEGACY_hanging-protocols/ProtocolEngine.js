import OHIFError from '../classes/OHIFError.js';
import metadata from '../classes/metadata/';
import { StudyMetadataSource } from '../classes/StudyMetadataSource.js';
import { isImage } from '../utils/isImage.js';
import { HPMatcher } from './HPMatcher.js';
import { sortByScore } from './lib/sortByScore';
import log from '../log.js';
import sortBy from '../utils/sortBy.js';
import { CustomViewportSettings } from './customViewportSettings';
import Protocol from './classes/Protocol';
import { ProtocolStore } from './protocolStore/classes';

/**
 * Import Constants
 */
const { StudyMetadata, InstanceMetadata } = metadata;

// Useful constants
const ABSTRACT_PRIOR_VALUE = 'abstractPriorValue';

export default class ProtocolEngine {
  matchedProtocols = new Map();
  matchedProtocolScores = {};

  /**
   * Constructor
   * @param  {ProtocolStore} protocolStore Protocol Store used to keep track of all hanging protocols
   * @param  {Array} studies Array of study metadata
   * @param  {Map} priorStudies Map of prior studies
   * @param  {Object} studyMetadataSource Instance of StudyMetadataSource (ohif-viewerbase) Object to get study metadata
   * @param  {Object} options
   */
  constructor(
    protocolStore,
    studies,
    priorStudies,
    studyMetadataSource,
    options = {}
  ) {
    // -----------
    // Type Validations
    if (!(studyMetadataSource instanceof StudyMetadataSource)) {
      throw new OHIFError(
        'ProtocolEngine::constructor studyMetadataSource is not an instance of StudyMetadataSource'
      );
    }

    if (
      !(studies instanceof Array) &&
      !studies.every(study => study instanceof StudyMetadata)
    ) {
      throw new OHIFError(
        "ProtocolEngine::constructor studies is not an array or it's items are not instances of StudyMetadata"
      );
    }

    // --------------
    // Initialization
    this.protocolStore = protocolStore;
    this.studies = studies;
    this.priorStudies = priorStudies instanceof Map ? priorStudies : new Map();
    this.studyMetadataSource = studyMetadataSource;
    this.options = options;

    // Put protocol engine in a known state
    this.reset();

    // Create an array for new stage ids to be stored
    // while editing a stage
    this.newStageIds = [];
  }

  /**
   * Resets the ProtocolEngine to the best match
   */
  reset() {
    const protocol = this.getBestProtocolMatch();

    this.setHangingProtocol(protocol);
  }

  /**
   * Retrieves the current Stage from the current Protocol and stage index
   *
   * @returns {*} The Stage model for the currently displayed Stage
   */
  getCurrentStageModel() {
    return this.protocol.stages[this.stage];
  }

  /**
   * Finds the best protocols from Protocol Store, matching each protocol matching rules
   * with the given study. The best protocol are orded by score and returned in an array
   * @param  {Object} study StudyMetadata instance object
   * @return {Array}       Array of match objects or an empty array if no match was found
   *                       Each match object has the score of the matching and the matched
   *                       protocol
   */
  findMatchByStudy(study) {
    log.trace('ProtocolEngine::findMatchByStudy');

    const matched = [];
    const studyInstance = study.getFirstInstance();

    // Set custom attribute for study metadata
    const numberOfAvailablePriors = this.getNumberOfAvailablePriors(
      study.getObjectID()
    );

    this.protocolStore.getProtocol().forEach(protocol => {
      // Clone the protocol's protocolMatchingRules array
      // We clone it so that we don't accidentally add the
      // numberOfPriorsReferenced rule to the Protocol itself.
      let rules = protocol.protocolMatchingRules.slice();
      if (!rules) {
        return;
      }

      // Check if the study has the minimun number of priors used by the protocol.
      const numberOfPriorsReferenced = protocol.getNumberOfPriorsReferenced();
      if (numberOfPriorsReferenced > numberOfAvailablePriors) {
        return;
      }

      // Run the matcher and get matching details
      const matchedDetails = HPMatcher.match(studyInstance, rules);
      const score = matchedDetails.score;

      // The protocol matched some rule, add it to the matched list
      if (score > 0) {
        matched.push({
          score,
          protocol,
        });
      }
    });

    // If no matches were found, select the default protocol
    if (!matched.length) {
      const defaultProtocol = this.protocolStore.getProtocol('defaultProtocol');

      return [
        {
          score: 1,
          protocol: defaultProtocol,
        },
      ];
    }

    // Sort the matched list by score
    sortByScore(matched);

    log.trace('ProtocolEngine::findMatchByStudy matched', matched);

    return matched;
  }

  _clearMatchedProtocols() {
    this.matchedProtocols.clear();
    this.matchedProtocolScores = {};
  }
  /**
   * Populates the MatchedProtocols Collection by running the matching procedure
   */
  updateProtocolMatches() {
    log.trace('ProtocolEngine::updateProtocolMatches');

    // Clear all data currently in matchedProtocols
    this._clearMatchedProtocols();

    // For each study, find the matching protocols
    this.studies.forEach(study => {
      const matched = this.findMatchByStudy(study);

      // For each matched protocol, check if it is already in MatchedProtocols
      matched.forEach(matchedDetail => {
        const protocol = matchedDetail.protocol;
        if (!protocol) {
          return;
        }

        // If it is not already in the MatchedProtocols Collection, insert it with its score
        if (!this.matchedProtocols.has(protocol.id)) {
          log.trace(
            'ProtocolEngine::updateProtocolMatches inserting protocol match',
            matchedDetail
          );
          this.matchedProtocols.set(protocol.id, protocol);
          this.matchedProtocolScores[protocol.id] = matchedDetail.score;
        }
      });
    });
  }

  _largestKeyByValue(obj) {
    return Object.keys(obj).reduce((a, b) => (obj[a] > obj[b] ? a : b));
  }

  _getHighestScoringProtocol() {
    if (!Object.keys(this.matchedProtocolScores).length) {
      return this.protocolStore.getProtocol('defaultProtocol');
    }
    const highestScoringProtocolId = this._largestKeyByValue(
      this.matchedProtocolScores
    );
    return this.matchedProtocols.get(highestScoringProtocolId);
  }

  /**
   * Return the best matched Protocol to the current study or set of studies
   * @returns {*}
   */
  getBestProtocolMatch() {
    // Run the matching to populate matchedProtocols Set and Map
    this.updateProtocolMatches();

    // Retrieve the highest scoring Protocol
    const bestMatch = this._getHighestScoringProtocol();

    log.trace('ProtocolEngine::getBestProtocolMatch bestMatch', bestMatch);

    return bestMatch;
  }

  /**
   * Get the number of prior studies supplied in the priorStudies map property.
   *
   * @param {String} studyObjectID The study object ID of the study whose priors are needed
   * @returns {number} The number of available prior studies with the same PatientID
   */
  getNumberOfAvailablePriors(studyObjectID) {
    return this.getAvailableStudyPriors(studyObjectID).length;
  }

  /**
   * Get the array of prior studies from a specific study.
   *
   * @param {String} studyObjectID The study object ID of the study whose priors are needed
   * @returns {Array} The array of available priors or an empty array
   */
  getAvailableStudyPriors(studyObjectID) {
    const priors = this.priorStudies.get(studyObjectID);

    return priors instanceof Array ? priors : [];
  }

  // Match images given a list of Studies and a Viewport's image matching reqs
  matchImages(viewport, viewportIndex) {
    log.trace('ProtocolEngine::matchImages');

    const {
      studyMatchingRules,
      seriesMatchingRules,
      imageMatchingRules: instanceMatchingRules,
    } = viewport;

    const matchingScores = [];
    const currentStudy = this.studies[0]; // @TODO: Should this be: this.studies[this.currentStudy] ???
    const firstInstance = currentStudy.getFirstInstance();

    let highestStudyMatchingScore = 0;
    let highestSeriesMatchingScore = 0;

    // Set custom attribute for study metadata and it's first instance
    currentStudy.setCustomAttribute(ABSTRACT_PRIOR_VALUE, 0);
    if (firstInstance instanceof InstanceMetadata) {
      firstInstance.setCustomAttribute(ABSTRACT_PRIOR_VALUE, 0);
    }

    // Only used if study matching rules has abstract prior values defined...
    let priorStudies;

    studyMatchingRules.forEach(rule => {
      if (rule.attribute === ABSTRACT_PRIOR_VALUE) {
        const validatorType = Object.keys(rule.constraint)[0];
        const validator = Object.keys(rule.constraint[validatorType])[0];

        let abstractPriorValue = rule.constraint[validatorType][validator];
        abstractPriorValue = parseInt(abstractPriorValue, 10);
        // TODO: Restrict or clarify validators for abstractPriorValue?

        // No need to call it more than once...
        if (!priorStudies) {
          priorStudies = this.getAvailableStudyPriors(
            currentStudy.getObjectID()
          );
        }

        // TODO: Revisit this later: What about two studies with the same
        // study date?

        let priorStudy;
        if (abstractPriorValue === -1) {
          priorStudy = priorStudies[priorStudies.length - 1];
        } else {
          const studyIndex = Math.max(abstractPriorValue - 1, 0);
          priorStudy = priorStudies[studyIndex];
        }

        // Invalid data
        if (!priorStudy instanceof StudyMetadata) {
          return;
        }

        const priorStudyObjectID = priorStudy.getObjectID();

        // Check if study metadata is already in studies list
        if (
          this.studies.find(study => study.getObjectID() === priorStudyObjectID)
        ) {
          return;
        }

        // Get study metadata if necessary and load study in the viewer (each viewer should provide it's own load study method)
        this.studyMetadataSource.loadStudy(priorStudy).then(
          studyMetadata => {
            // Set the custom attribute abstractPriorValue for the study metadata
            studyMetadata.setCustomAttribute(
              ABSTRACT_PRIOR_VALUE,
              abstractPriorValue
            );

            // Also add custom attribute
            const firstInstance = studyMetadata.getFirstInstance();
            if (firstInstance instanceof InstanceMetadata) {
              firstInstance.setCustomAttribute(
                ABSTRACT_PRIOR_VALUE,
                abstractPriorValue
              );
            }

            // Insert the new study metadata
            this.studies.push(studyMetadata);

            // Update the viewport to refresh layout manager with new study
            this.updateViewports(viewportIndex);
          },
          error => {
            log.warn(error);
            throw new OHIFError(
              `ProtocolEngine::matchImages could not get study metadata for the Study with the following ObjectID: ${priorStudyObjectID}`
            );
          }
        );
      }
      // TODO: Add relative Date / time
    });

    this.studies.forEach(study => {
      const studyMatchDetails = HPMatcher.match(
        study.getFirstInstance(),
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

      study.forEachSeries(series => {
        const seriesMatchDetails = HPMatcher.match(
          series.getFirstInstance(),
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

        series.forEachInstance((instance, index) => {
          // This tests to make sure there is actually image data in this instance
          // TODO: Change this when we add PDF and MPEG support
          // See https://ohiforg.atlassian.net/browse/LT-227
          if (
            !isImage(instance.getTagValue('SOPClassUID')) &&
            !instance.getTagValue('Rows')
          ) {
            return;
          }

          const instanceMatchDetails = HPMatcher.match(
            instance,
            instanceMatchingRules
          );

          // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
          if (instanceMatchDetails.requiredFailed === true) {
            return;
          }

          const matchDetails = {
            passed: [],
            failed: [],
          };

          matchDetails.passed = matchDetails.passed.concat(
            instanceMatchDetails.details.passed
          );
          matchDetails.passed = matchDetails.passed.concat(
            seriesMatchDetails.details.passed
          );
          matchDetails.passed = matchDetails.passed.concat(
            studyMatchDetails.details.passed
          );

          matchDetails.failed = matchDetails.failed.concat(
            instanceMatchDetails.details.failed
          );
          matchDetails.failed = matchDetails.failed.concat(
            seriesMatchDetails.details.failed
          );
          matchDetails.failed = matchDetails.failed.concat(
            studyMatchDetails.details.failed
          );

          const totalMatchScore =
            instanceMatchDetails.score +
            seriesMatchDetails.score +
            studyMatchDetails.score;
          const currentSOPInstanceUID = instance.getSOPInstanceUID();

          const imageDetails = {
            StudyInstanceUID: study.getStudyInstanceUID(),
            SeriesInstanceUID: series.getSeriesInstanceUID(),
            SOPInstanceUID: currentSOPInstanceUID,
            currentImageIdIndex: index,
            matchingScore: totalMatchScore,
            matchDetails: matchDetails,
            sortingInfo: {
              score: totalMatchScore,
              study:
                instance.getTagValue('StudyDate') +
                instance.getTagValue('StudyTime'),
              series: parseInt(instance.getTagValue('SeriesNumber')), // TODO: change for seriesDateTime
              instance: parseInt(instance.getTagValue('InstanceNumber')), // TODO: change for acquisitionTime
            },
          };

          // Find the displaySet
          const displaySet = study.findDisplaySet(displaySet =>
            displaySet.images.find(
              image => image.getSOPInstanceUID() === currentSOPInstanceUID
            )
          );

          // If the instance was found, set the displaySet ID
          if (displaySet) {
            imageDetails.displaySetInstanceUID = displaySet.getUID();
            imageDetails.imageId = instance.getImageId();
          }

          matchingScores.push(imageDetails);
        });
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
        name: 'instance',
      },
      {
        name: 'series',
      }
    );
    matchingScores.sort((a, b) =>
      sortingFunction(a.sortingInfo, b.sortingInfo)
    );

    const bestMatch = matchingScores[0];

    log.trace('ProtocolEngine::matchImages bestMatch', bestMatch);

    return {
      bestMatch,
      matchingScores,
    };
  }

  /**
   * Sets the current layout
   *
   * @param {number} numRows
   * @param {number} numColumns
   */
  setLayout(numRows, numColumns) {
    if (numRows < 1 && numColumns < 1) {
      log.error(`Invalid layout ${numRows} x ${numColumns}`);
      return;
    }

    if (typeof this.options.setLayout !== 'function') {
      log.error('Hanging Protocol Engine setLayout callback is not defined');
      return;
    }

    let viewports = [];
    const numViewports = numRows * numColumns;

    for (let i = 0; i < numViewports; i++) {
      viewports.push({});
    }

    this.options.setLayout({ numRows, numColumns, viewports });
  }

  /**
   * Rerenders viewports that are part of the current layout manager
   * using the matching rules internal to each viewport.
   *
   * If this function is provided the index of a viewport, only the specified viewport
   * is rerendered.
   *
   * @param viewportIndex
   */
  updateViewports(viewportIndex) {
    log.trace(
      `ProtocolEngine::updateViewports viewportIndex: ${viewportIndex}`
    );

    // Make sure we have an active protocol with a non-empty array of display sets
    if (!this.getNumProtocolStages()) {
      return;
    }

    // Retrieve the current stage
    const stageModel = this.getCurrentStageModel();

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
    const layoutTemplateName = stageModel.viewportStructure.getLayoutTemplateName();
    if (!layoutTemplateName) {
      return;
    }

    // Retrieve the properties associated with the current display set's viewport structure template
    // If no such layout properties exist, stop here.
    const layoutProps = stageModel.viewportStructure.properties;
    if (!layoutProps) {
      return;
    }

    // Create an empty array to store the output viewportData
    const viewportData = [];

    // Empty the matchDetails associated with the ProtocolEngine.
    // This will be used to store the pass/fail details and score
    // for each of the viewport matching procedures
    this.matchDetails = [];

    // Loop through each viewport
    stageModel.viewports.forEach((viewport, viewportIndex) => {
      const details = this.matchImages(viewport, viewportIndex);

      this.matchDetails[viewportIndex] = details;

      // Convert any YES/NO values into true/false for Cornerstone
      const cornerstoneViewportParams = {};

      // Cache viewportSettings keys
      const viewportSettingsKeys = Object.keys(viewport.viewportSettings);

      viewportSettingsKeys.forEach(key => {
        let value = viewport.viewportSettings[key];
        if (value === 'YES') {
          value = true;
        } else if (value === 'NO') {
          value = false;
        }

        cornerstoneViewportParams[key] = value;
      });

      // imageViewerViewports occasionally needs relevant layout data in order to set
      // the element style of the viewport in question
      const currentViewportData = {
        viewportIndex,
        viewport: cornerstoneViewportParams,
        ...layoutProps,
      };

      const customSettings = [];
      viewportSettingsKeys.forEach(id => {
        const setting = CustomViewportSettings[id];
        if (!setting) {
          return;
        }

        customSettings.push({
          id: id,
          value: viewport.viewportSettings[id],
        });
      });

      currentViewportData.renderedCallback = element => {
        //console.log('renderedCallback for ' + element.id);
        customSettings.forEach(customSetting => {
          log.trace(
            `ProtocolEngine::currentViewportData.renderedCallback Applying custom setting: ${customSetting.id}`
          );
          log.trace(
            `ProtocolEngine::currentViewportData.renderedCallback with value: ${customSetting.value}`
          );

          const setting = CustomViewportSettings[customSetting.id];
          setting.callback(element, customSetting.value);
        });
      };

      let currentMatch = details.bestMatch;
      let currentPosition = 1;
      const scoresLength = details.matchingScores.length;
      while (
        currentPosition < scoresLength &&
        viewportData.find(a => a.imageId === currentMatch.imageId)
      ) {
        currentMatch = details.matchingScores[currentPosition];
        currentPosition++;
      }

      if (currentMatch && currentMatch.imageId) {
        currentViewportData.StudyInstanceUID = currentMatch.StudyInstanceUID;
        currentViewportData.SeriesInstanceUID = currentMatch.SeriesInstanceUID;
        currentViewportData.SOPInstanceUID = currentMatch.SOPInstanceUID;
        currentViewportData.currentImageIdIndex =
          currentMatch.currentImageIdIndex;
        currentViewportData.displaySetInstanceUID =
          currentMatch.displaySetInstanceUID;
        currentViewportData.imageId = currentMatch.imageId;
      }

      // @TODO Why should we throw an exception when a best match is not found? This was aborting the whole process.
      // if (!currentViewportData.displaySetInstanceUID) {
      //     throw new OHIFError('ProtocolEngine::updateViewports No matching display set found?');
      // }

      viewportData.push(currentViewportData);
    });

    this.setLayout(layoutProps.Rows, layoutProps.Columns);

    if (typeof this.options.setViewportSpecificData !== 'function') {
      log.error(
        'Hanging Protocol Engine setViewportSpecificData callback is not defined'
      );
      return;
    }

    // If viewportIndex is defined, then update only that viewport
    if (viewportIndex !== undefined && viewportData[viewportIndex]) {
      this.options.setViewportSpecificData(
        viewportIndex,
        viewportData[viewportIndex]
      );
      return;
    }

    // Update all viewports
    viewportData.forEach(viewportSpecificData => {
      this.options.setViewportSpecificData(
        viewportSpecificData.viewportIndex,
        viewportSpecificData
      );
    });
  }

  /**
   * Sets the current Hanging Protocol to the specified Protocol
   * An optional argument can also be used to prevent the updating of the Viewports
   *
   * @param newProtocol
   * @param updateViewports
   */
  setHangingProtocol(newProtocol, updateViewports = true) {
    log.trace('ProtocolEngine::setHangingProtocol newProtocol', newProtocol);
    log.trace(
      `ProtocolEngine::setHangingProtocol updateViewports = ${updateViewports}`
    );

    // Reset the array of newStageIds
    this.newStageIds = [];

    if (Protocol.prototype.isPrototypeOf(newProtocol)) {
      this.protocol = newProtocol;
    } else {
      this.protocol = new Protocol();
      this.protocol.fromObject(newProtocol);
    }

    this.stage = 0;

    // Update viewports by default
    if (updateViewports) {
      this.updateViewports();
    }
  }

  /**
   * Check if the next stage is available
   * @return {Boolean} True if next stage is available or false otherwise
   */
  isNextStageAvailable() {
    const numberOfStages = this.getNumProtocolStages();

    return this.stage + 1 < numberOfStages;
  }

  /**
   * Check if the previous stage is available
   * @return {Boolean} True if previous stage is available or false otherwise
   */
  isPreviousStageAvailable() {
    return this.stage - 1 >= 0;
  }

  /**
   * Changes the current stage to a new stage index in the display set sequence.
   * It checks if the next stage exists.
   *
   * @param {Integer} stageAction An integer value specifying wheater next (1) or previous (-1) stage
   * @return {Boolean} True if new stage has set or false, otherwise
   */
  setCurrentProtocolStage(stageAction) {
    // Check if previous or next stage is available
    if (stageAction === -1 && !this.isPreviousStageAvailable()) {
      return false;
    } else if (stageAction === 1 && !this.isNextStageAvailable()) {
      return false;
    }

    // Sets the new stage
    this.stage += stageAction;

    // Log the new stage
    log.trace(`ProtocolEngine::setCurrentProtocolStage stage = ${this.stage}`);

    // Since stage has changed, we need to update the viewports
    // and redo matchings
    this.updateViewports();

    // Everything went well
    return true;
  }

  /**
   * Retrieves the number of Stages in the current Protocol or
   * undefined if no protocol or stages are set
   */
  getNumProtocolStages() {
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
   * Switches to the next protocol stage in the display set sequence
   */
  nextProtocolStage() {
    log.trace('ProtocolEngine::nextProtocolStage');

    if (!this.setCurrentProtocolStage(1)) {
      log.trace('ProtocolEngine::nextProtocolStage failed');
    }
  }

  /**
   * Switches to the previous protocol stage in the display set sequence
   */
  previousProtocolStage() {
    log.trace('ProtocolEngine::previousProtocolStage');

    if (!this.setCurrentProtocolStage(-1)) {
      log.trace('ProtocolEngine::previousProtocolStage failed');
    }
  }
}
