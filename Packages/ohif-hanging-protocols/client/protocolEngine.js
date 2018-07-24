import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { Session } from 'meteor/session';

// OHIF Modules
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

// Hanging Protocol local imports
import { HPMatcher } from './matcher/HPMatcher';
import { sortByScore } from './lib/sortByScore';
import './customViewportSettings';

/**
 * Import Constants
 */

const { OHIFError, metadata: { StudyMetadata, SeriesMetadata, InstanceMetadata, StudySummary } } = OHIF.viewerbase;

// Useful constants
const ABSTRACT_PRIOR_VALUE = 'abstractPriorValue';

// Define a global variable that will be used to refer to the Protocol Engine
// It must be populated by HP.setEngine when the Viewer is initialized and a ProtocolEngine
// is instantiated on top of the LayoutManager. If the global ProtocolEngine variable remains
// undefined, none of the HangingProtocol functions will operate.
ProtocolEngine = undefined;

/**
 * Sets the ProtocolEngine global given an instantiated ProtocolEngine. This is done so that
 * The functions in the package can depend on a ProtocolEngine variable, but this variable does
 * not have to be exported from the application level.
 *
 * (There may be a better way to do this, but for now this works with no real downside)
 *
 * @param protocolEngine An instantiated ProtocolEngine linked to a LayoutManager from the
 *                       Viewerbase package
 */
HP.setEngine = protocolEngine => {
    ProtocolEngine = protocolEngine;
};

/**
 * Gets the instantiated ProtocolEngine global object
 *
 * @returns protocolEngine An instantiated ProtocolEngine linked to a LayoutManager from the
 *                       Viewerbase package
 */
HP.getEngine = () => {
    return ProtocolEngine;
};

Meteor.startup(() => {
    HP.addCustomViewportSetting('wlPreset', 'Window/Level Preset', Object.create(null), (element, optionValue) => {
        if (_.findWhere(OHIF.viewer.wlPresets, { id: optionValue })) {
            OHIF.viewerbase.wlPresets.applyWLPreset(optionValue, element);
        }
    });
});

HP.ProtocolEngine = class ProtocolEngine {
    /**
     * Constructor
     * @param  {Object} layoutManager  Layout Manager Object
     * @param  {Array} studies        Array of study metadata
     * @param  {Map} priorStudies Map of prior studies
     * @param  {Object} studyMedadataSource Instance of StudyMetadataSource (ohif-viewerbase) Object to get study metadata
     */
    constructor(layoutManager, studies, priorStudies, studyMetadataSource) {

        const { LayoutManager, StudyMetadataSource } = OHIF.viewerbase;
        // -----------
        // Type Validations

        if (!(layoutManager instanceof LayoutManager)) {
            throw new OHIFError('ProtocolEngine::constructor layoutManager is not an instance of LayoutManager');
        }

        if (!(studyMetadataSource instanceof StudyMetadataSource)) {
            throw new OHIFError('ProtocolEngine::constructor studyMetadataSource is not an instance of StudyMetadataSource');
        }

        if (!(studies instanceof Array) && !studies.every(study => study instanceof StudyMetadata)) {
            throw new OHIFError('ProtocolEngine::constructor studies is not an array or it\'s items are not instances of StudyMetadata');
        }

        // --------------
        // Initialization

        this.LayoutManager = layoutManager;
        this.studies = studies;
        this.priorStudies = priorStudies instanceof Map ? priorStudies : new Map();
        this.studyMetadataSource = studyMetadataSource;

        // Put protocol engine in a known states
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
        OHIF.log.info('ProtocolEngine::findMatchByStudy');

        const matched = [];
        const studyInstance = study.getFirstInstance();

        // Set custom attribute for study metadata
        const numberOfAvailablePriors = this.getNumberOfAvailablePriors(study.getObjectID());

        HP.ProtocolStore.getProtocol().forEach(protocol => {
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
                    protocol
                });
            }
        });

        // If no matches were found, select the default protocol
        if (!matched.length) {
            const defaultProtocol = HP.ProtocolStore.getProtocol('defaultProtocol');

            return [{
                score: 1,
                protocol: defaultProtocol
            }];
        }

        // Sort the matched list by score
        sortByScore(matched);

        OHIF.log.info('ProtocolEngine::findMatchByStudy matched', matched);

        return matched;
    }

    /**
     * Populates the MatchedProtocols Collection by running the matching procedure
     */
    updateProtocolMatches() {
        OHIF.log.info('ProtocolEngine::updateProtocolMatches');

        // Clear all data from the MatchedProtocols Collection
        MatchedProtocols.remove({});

        // For each study, find the matching protocols
        this.studies.forEach(study => {
            const matched = this.findMatchByStudy(study);

            // For each matched protocol, check if it is already in MatchedProtocols
            matched.forEach(matchedDetail => {
                const protocol = matchedDetail.protocol;
                if (!protocol) {
                    return;
                }

                const protocolInCollection = MatchedProtocols.findOne({
                    id: protocol.id
                });

                // If it is not already in the MatchedProtocols Collection, insert it with its score
                if (!protocolInCollection) {
                    OHIF.log.info('ProtocolEngine::updateProtocolMatches inserting protocol match', matchedDetail);
                    MatchedProtocols.insert(matchedDetail);
                }
            });
        });
    }

    /**
     * Return the best matched Protocol to the current study or set of studies
     * @returns {*}
     */
    getBestProtocolMatch() {
        // Run the matching to populate the MatchedProtocols Collection
        this.updateProtocolMatches();

        // Retrieve the highest scoring Protocol
        const sorted = MatchedProtocols.find({}, {
            sort: {
                score: -1
            },
            limit: 1
        }).fetch();

        // Highest scoring Protocol
        const bestMatch = sorted[0].protocol;

        OHIF.log.info('ProtocolEngine::getBestProtocolMatch bestMatch', bestMatch);

        return bestMatch;
    }

    /**
     * Get the number of prior studies supplied in the priorStudies map property.
     *
     * @param {String} studyObjectID The study object ID of the study whose priors are needed
     * @returns {number} The number of available prior studies with the same PatientID
     */
    getNumberOfAvailablePriors(studyObjectID) {
        const priors = this.getAvailableStudyPriors(studyObjectID);

        return priors.length;
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
        OHIF.log.info('ProtocolEngine::matchImages');

        const { studyMatchingRules, seriesMatchingRules, imageMatchingRules: instanceMatchingRules } = viewport;

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
                    priorStudies = this.getAvailableStudyPriors(currentStudy.getObjectID());
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
                if (!(priorStudy instanceof StudyMetadata) && !(priorStudy instanceof StudySummary)) {
                    return;
                }

                const priorStudyObjectID = priorStudy.getObjectID();

                // Check if study metadata is already in studies list
                if (this.studies.find(study => study.getObjectID() === priorStudyObjectID)) {
                    return;
                }

                // Get study metadata if necessary and load study in the viewer (each viewer should provide it's own load study method)
                this.studyMetadataSource.loadStudy(priorStudy).then(studyMetadata => {
                    // Set the custom attribute abstractPriorValue for the study metadata
                    studyMetadata.setCustomAttribute(ABSTRACT_PRIOR_VALUE, abstractPriorValue);

                    // Also add custom attribute
                    const firstInstance = studyMetadata.getFirstInstance();
                    if (firstInstance instanceof InstanceMetadata) {
                        firstInstance.setCustomAttribute(ABSTRACT_PRIOR_VALUE, abstractPriorValue);
                    }

                    // Insert the new study metadata
                    this.studies.push(studyMetadata);

                    // Update the viewport to refresh layout manager with new study
                    this.updateViewports(viewportIndex);
                }, error => {
                    OHIF.log.warn(error);
                    throw new OHIFError(`ProtocolEngine::matchImages could not get study metadata for the Study with the following ObjectID: ${priorStudyObjectID}`);
                });
            }
            // TODO: Add relative Date / time
        });

        this.studies.forEach(study => {
            const studyMatchDetails = HPMatcher.match(study.getFirstInstance(), studyMatchingRules);

            // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
            if (studyMatchDetails.requiredFailed === true || studyMatchDetails.score < highestStudyMatchingScore) {
                return;
            }

            highestStudyMatchingScore = studyMatchDetails.score;

            study.forEachSeries(series => {
                const seriesMatchDetails = HPMatcher.match(series.getFirstInstance(), seriesMatchingRules);

                // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
                if (seriesMatchDetails.requiredFailed === true || seriesMatchDetails.score < highestSeriesMatchingScore) {
                    return;
                }

                highestSeriesMatchingScore = seriesMatchDetails.score;

                series.forEachInstance((instance, index) => {
                    // This tests to make sure there is actually image data in this instance
                    // TODO: Change this when we add PDF and MPEG support
                    // See https://ohiforg.atlassian.net/browse/LT-227
                    // sopClassUid = x00080016
                    // rows = x00280010
                    if (!OHIF.viewerbase.isImage(instance.getTagValue('x00080016')) && !instance.getTagValue('x00280010')) {
                        return;
                    }

                    const instanceMatchDetails = HPMatcher.match(instance, instanceMatchingRules);

                    // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed
                    if (instanceMatchDetails.requiredFailed === true) {
                        return;
                    }

                    const matchDetails = {
                        passed: [],
                        failed: []
                    };

                    matchDetails.passed = matchDetails.passed.concat(instanceMatchDetails.details.passed);
                    matchDetails.passed = matchDetails.passed.concat(seriesMatchDetails.details.passed);
                    matchDetails.passed = matchDetails.passed.concat(studyMatchDetails.details.passed);

                    matchDetails.failed = matchDetails.failed.concat(instanceMatchDetails.details.failed);
                    matchDetails.failed = matchDetails.failed.concat(seriesMatchDetails.details.failed);
                    matchDetails.failed = matchDetails.failed.concat(studyMatchDetails.details.failed);

                    const totalMatchScore = instanceMatchDetails.score + seriesMatchDetails.score + studyMatchDetails.score;
                    const currentSOPInstanceUID = instance.getSOPInstanceUID();

                    const imageDetails = {
                        studyInstanceUid: study.getStudyInstanceUID(),
                        seriesInstanceUid: series.getSeriesInstanceUID(),
                        sopInstanceUid: currentSOPInstanceUID,
                        currentImageIdIndex: index,
                        matchingScore: totalMatchScore,
                        matchDetails: matchDetails,
                        sortingInfo: {
                            score: totalMatchScore,
                            study: instance.getTagValue('x00080020') + instance.getTagValue('x00080030'), // StudyDate = x00080020 StudyTime = x00080030
                            series: parseInt(instance.getTagValue('x00200011')), // TODO: change for seriesDateTime SeriesNumber = x00200011
                            instance: parseInt(instance.getTagValue('x00200013')) // TODO: change for acquisitionTime InstanceNumber = x00200013
                        }
                    };

                    // Find the displaySet
                    const displaySet = study.findDisplaySet(displaySet => displaySet.images.find(image => image.getSOPInstanceUID() === currentSOPInstanceUID));

                    // If the instance was found, set the displaySet ID
                    if (displaySet) {
                        imageDetails.displaySetInstanceUid = displaySet.getUID();
                        imageDetails.imageId = instance.getImageId();
                    }

                    matchingScores.push(imageDetails);
                });
            });
        });

        // Sort the matchingScores
        const sortingFunction = OHIF.utils.sortBy({
            name: 'score',
            reverse: true
        }, {
            name: 'study',
            reverse: true
        }, {
            name: 'instance'
        }, {
            name: 'series'
        });
        matchingScores.sort((a, b) => sortingFunction(a.sortingInfo, b.sortingInfo));

        const bestMatch = matchingScores[0];

        OHIF.log.info('ProtocolEngine::matchImages bestMatch', bestMatch);

        return {
            bestMatch,
            matchingScores
        };
    }

    /**
     * Rerenders viewports that are part of the current ProtocolEngine's LayoutManager
     * using the matching rules internal to each viewport.
     *
     * If this function is provided the index of a viewport, only the specified viewport
     * is rerendered.
     *
     * @param viewportIndex
     */
    updateViewports(viewportIndex) {
        OHIF.log.info(`ProtocolEngine::updateViewports viewportIndex: ${viewportIndex}`);

        // Make sure we have an active protocol with a non-empty array of display sets
        if (!this.getNumProtocolStages()) {
            return;
        }

        // Retrieve the current display set in the display set sequence
        const stageModel = this.getCurrentStageModel();

        // If the current display set does not fulfill the requirements to be displayed,
        // stop here.
        if (!stageModel ||
            !stageModel.viewportStructure ||
            !stageModel.viewports ||
            !stageModel.viewports.length) {
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
                ...layoutProps
            };

            const customSettings = [];
            viewportSettingsKeys.forEach(id => {
                const setting = HP.CustomViewportSettings[id];
                if (!setting) {
                    return;
                }

                customSettings.push({
                    id: id,
                    value: viewport.viewportSettings[id]
                });
            });

            currentViewportData.renderedCallback = element => {
                //console.log('renderedCallback for ' + element.id);
                customSettings.forEach(customSetting => {
                    OHIF.log.info(`ProtocolEngine::currentViewportData.renderedCallback Applying custom setting: ${customSetting.id}`);
                    OHIF.log.info(`ProtocolEngine::currentViewportData.renderedCallback with value: ${customSetting.value}`);

                    const setting = HP.CustomViewportSettings[customSetting.id];
                    setting.callback(element, customSetting.value);
                });
            };

            let currentMatch = details.bestMatch;
            let currentPosition = 1;
            const scoresLength = details.matchingScores.length;
            while (currentPosition < scoresLength && _.findWhere(viewportData, {
                imageId: currentMatch.imageId
            })) {
                currentMatch = details.matchingScores[currentPosition];
                currentPosition++;
            }

            if (currentMatch && currentMatch.imageId) {
                currentViewportData.studyInstanceUid = currentMatch.studyInstanceUid;
                currentViewportData.seriesInstanceUid = currentMatch.seriesInstanceUid;
                currentViewportData.sopInstanceUid = currentMatch.sopInstanceUid;
                currentViewportData.currentImageIdIndex = currentMatch.currentImageIdIndex;
                currentViewportData.displaySetInstanceUid = currentMatch.displaySetInstanceUid;
                currentViewportData.imageId = currentMatch.imageId;
            }

            // @TODO Why should we throw an exception when a best match is not found? This was aborting the whole process.
            // if (!currentViewportData.displaySetInstanceUid) {
            //     throw new OHIFError('ProtocolEngine::updateViewports No matching display set found?');
            // }

            viewportData.push(currentViewportData);
        });

        this.LayoutManager.layoutTemplateName = layoutTemplateName;
        this.LayoutManager.layoutProps = layoutProps;
        this.LayoutManager.viewportData = viewportData;

        if (viewportIndex !== undefined && viewportData[viewportIndex]) {
            this.LayoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, viewportData[viewportIndex]);
        } else {
            this.LayoutManager.updateViewports();
        }
    }

    /**
     * Sets the current Hanging Protocol to the specified Protocol
     * An optional argument can also be used to prevent the updating of the Viewports
     *
     * @param newProtocol
     * @param updateViewports
     */
    setHangingProtocol(newProtocol, updateViewports = true) {
        OHIF.log.info('ProtocolEngine::setHangingProtocol newProtocol', newProtocol);
        OHIF.log.info(`ProtocolEngine::setHangingProtocol updateViewports = ${updateViewports}`);

        // Reset the array of newStageIds
        this.newStageIds = [];

        if (HP.Protocol.prototype.isPrototypeOf(newProtocol)) {
            this.protocol = newProtocol;
        } else {
            this.protocol = new HP.Protocol();
            this.protocol.fromObject(newProtocol);
        }

        this.stage = 0;

        // Update viewports by default
        if (updateViewports) {
            this.updateViewports();
        }

        MatchedProtocols.update({}, {
            $set: {
                selected: false
            }
        }, {
            multi: true
        });

        MatchedProtocols.update({
            id: this.protocol.id
        }, {
            $set: {
                selected: true
            }
        });

        Session.set('HangingProtocolName', this.protocol.name);
        Session.set('HangingProtocolStage', this.stage);
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
        OHIF.log.info(`ProtocolEngine::setCurrentProtocolStage stage = ${this.stage}`);

        // Set stage Session variable for reactivity
        Session.set('HangingProtocolStage', this.stage);

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
        if (!this.protocol || !this.protocol.stages || !this.protocol.stages.length) {
            return;
        }

        return this.protocol.stages.length;
    }

    /**
     * Switches to the next protocol stage in the display set sequence
     */
    nextProtocolStage() {
        OHIF.log.info('ProtocolEngine::nextProtocolStage');

        if (!this.setCurrentProtocolStage(1)) {
            // Just for logging purpose
            OHIF.log.info('ProtocolEngine::nextProtocolStage failed');
        }
    }

    /**
     * Switches to the previous protocol stage in the display set sequence
     */
    previousProtocolStage() {
        OHIF.log.info('ProtocolEngine::previousProtocolStage');

        if (!this.setCurrentProtocolStage(-1)) {
            // Just for logging purpose
            OHIF.log.info('ProtocolEngine::previousProtocolStage failed');
        }
    }
};
