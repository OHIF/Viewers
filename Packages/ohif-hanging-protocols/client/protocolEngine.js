import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
// OHIF Modules
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

/**
 * Import Constants
 */

const { OHIFError } = OHIF.viewerbase;
const { StudyMetadata, SeriesMetadata, InstanceMetadata, StudySummary } = OHIF.viewerbase.metadata;


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
HP.setEngine = function(protocolEngine) {
    ProtocolEngine = protocolEngine;
};

// Define an empty object to store callbacks that are used to retrieve custom attributes
// The simplest example for a custom attribute is the Timepoint type (i.e. baseline or follow-up)
// used in the LesionTracker application.
//
// Timepoint type can be obtained given a studyId, and this is done through a custom callback.
// Developers can define attributes (i.e. attributeId = timepointType) with a name ('Timepoint Type')
// and a callback function that is used to calculate them.
//
// The input to the callback, which is called during viewport-image matching rule evaluation
// is the set of attributes that contains the specified attribute. In our example, timepointType is
// linked to the study attributes, and so the inputs to the callback is an object containing
// the study attributes.
HP.CustomAttributeRetrievalCallbacks = {};

/**
 * Adds a custom attribute to be used in the HangingProtocol UI and matching rules, including a
 * callback that will be used to calculate the attribute value.
 *
 * @param attributeId The ID used to refer to the attribute (e.g. 'timepointType')
 * @param attributeName The name of the attribute to be displayed (e.g. 'Timepoint Type')
 * @param callback The function used to calculate the attribute value from the other attributes at its level (e.g. study/series/image)
 */
HP.addCustomAttribute = function(attributeId, attributeName, callback) {
    HP.CustomAttributeRetrievalCallbacks[attributeId] = {
        name: attributeName,
        callback: callback
    };
};


// Define an empty object to store callbacks that are used to apply custom viewport settings
// after a viewport is rendered.
HP.CustomViewportSettings = {};

/**
 * Adds a custom setting that can be chosen in the HangingProtocol UI and applied to a Viewport
 *
 * @param settingId The ID used to refer to the setting (e.g. 'displayCADMarkers')
 * @param settingName The name of the setting to be displayed (e.g. 'Display CAD Markers')
 * @param options
 * @param callback A function to be run after a viewport is rendered with a series
 */
HP.addCustomViewportSetting = function(settingId, settingName, options, callback) {
    HP.CustomViewportSettings[settingId] = {
        id: settingId,
        text: settingName,
        options: options,
        callback: callback
    };
};

Meteor.startup(function() {
    HP.addCustomViewportSetting('wlPreset', 'Window/Level Preset', Object.keys(OHIF.viewer.wlPresets), function(element, optionValue) {
        if (OHIF.viewer.wlPresets.hasOwnProperty(optionValue)) {
            OHIF.viewerbase.wlPresets.applyWLPreset(optionValue, element);
        }
    });
});

/**
 * Match a Metadata instance against rules using Validate.js for validation.
 * @param  {StudyMetadata|SeriesMetadata|InstanceMetadata} metadataInstance Metadata instance object
 * @param  {Array} rules Array of MatchingRules instances (StudyMatchingRule|SeriesMatchingRule|ImageMatchingRule) for the match
 * @return {Object}      Matching Object with score and details (which rule passed or failed)
 */
HP.match = function(metadataInstance, rules) {

    if (!(metadataInstance instanceof StudyMetadata || metadataInstance instanceof SeriesMetadata || metadataInstance instanceof InstanceMetadata)) {
        throw new OHIFError('HP::match metadataInstance must be an instance of StudyMetadata, SeriesMetadata or InstanceMetadata');
    }

    const options = {
        format: 'grouped'
    };

    const details = {
        passed: [],
        failed: []
    };
    
    let requiredFailed = false;
    let score = 0;
    let instance;

    if (metadataInstance instanceof StudyMetadata) {
        instance = metadataInstance.getFirstInstance();
    } else if (metadataInstance instanceof SeriesMetadata) {
        instance = metadataInstance.getInstanceByIndex(0);
    } else {
        instance = metadataInstance;
    }

    rules.forEach(rule => {
        const attribute = rule.attribute;
        let customAttributeExists = metadataInstance.customAttributeExists(attribute);

        // If the metadataInstance we are testing (e.g. study, series, or instance MetadataInstance) do
        // not contain the attribute specified in the rule, check whether or not they have been
        // defined in the CustomAttributeRetrievalCallbacks Object.
        if (!customAttributeExists && HP.CustomAttributeRetrievalCallbacks.hasOwnProperty(attribute)) {
            const customAttribute = HP.CustomAttributeRetrievalCallbacks[attribute];
            metadataInstance.setCustomAttribute(attribute, customAttribute.callback(metadataInstance));
            customAttributeExists = true;
        }

        // Format the constraint as required by Validate.js
        const testConstraint = {
            [attribute]: rule.constraint
        };

        // Create a single attribute object to be validated, since metadataInstance is an 
        // instance of Metadata (StudyMetadata, SeriesMetadata or InstanceMetadata)
        const attributeValue = customAttributeExists ? metadataInstance.getCustomAttribute(attribute) : instance.getRawValue(attribute);
        const attributeMap = {
            [attribute]: attributeValue + ''
        };

        // Use Validate.js to evaluate the constraints on the specified metadataInstance
        const errorMessages = validate(attributeMap, testConstraint, [options]);

        if (!errorMessages) {
            // If no errorMessages were returned, then validation passed.

            // Add the rule's weight to the total score
            score += rule.weight;

            // Log that this rule passed in the matching details object
            details.passed.push({
                rule
            });
        } else {
            // If errorMessages were present, then validation failed

            // If the rule that failed validation was Required, then
            // mark that a required Rule has failed
            if (rule.required) {
                requiredFailed = true;
            }

            // Log that this rule failed in the matching details object
            // and include any error messages
            details.failed.push({
                rule,
                errorMessages
            });
        }
    });

    // If a required Rule has failed Validation, set the matching score to zero
    if (requiredFailed) {
        score = 0;
    }

    return {
        score,
        details
    };
};

const sortByScore = arr => {
    arr.sort((a, b) => {
        return b.score - a.score;
    });
};

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
        const protocol = this.getBestMatch();
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

    findMatchByStudy(study) {
        OHIF.log.info('ProtocolEngine::findMatchByStudy');

        const matched = [];

        HP.ProtocolStore.getProtocol().forEach(protocol => {
            // Clone the protocol's protocolMatchingRules array
            // We clone it so that we don't accidentally add the
            // numberOfPriorsReferenced rule to the Protocol itself.
            const rules = protocol.protocolMatchingRules.slice(0);
            if (!rules) {
                return;
            }

            // Set custom attribute for study metadata 
            const numberOfPriorsReferenced = this.getNumberOfAvailablePriors(study.getStudyInstanceUID());
            study.setCustomAttribute('numberOfPriorsReferenced', numberOfPriorsReferenced);

            const rule = new HP.ProtocolMatchingRule('numberOfPriorsReferenced', {
                numericality: {
                    greaterThanOrEqualTo: protocol.numberOfPriorsReferenced
                }
            });

            rules.push(rule);

            const matchedDetails = HP.match(study, rules);

            if (matchedDetails.score > 0) {
                matched.push({
                    score: matchedDetails.score,
                    protocol: protocol
                });
            }
        });

        if (!matched.length) {
            const defaultProtocol = HP.ProtocolStore.getProtocol('defaultProtocol');

            return [{
                score: 1,
                protocol: defaultProtocol
            }];
        }

        sortByScore(matched);

        OHIF.log.info('ProtocolEngine::findMatchByStudy matched', matched);

        return matched;
    }

    /**
     * Populates the MatchedProtocols Collection by running the matching procedure
     */
    updateMatches() {
        OHIF.log.info('ProtocolEngine::updateMatches');

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
                    MatchedProtocols.insert(matchedDetail);
                }
            });
        });
    }

    /**
     * Return the best matched Protocol to the current study or set of studies
     * @returns {*}
     */
    getBestMatch() {
        // Run the matching to populate the MatchedProtocols Collection
        this.updateMatches();

        // Retrieve the highest scoring Protocol
        const sorted = MatchedProtocols.find({}, {
            sort: {
                score: -1
            },
            limit: 1
        }).fetch();

        // Highest scoring Protocol
        const bestMatch = sorted[0].protocol;

        OHIF.log.info('ProtocolEngine::getBestMatch bestMatch', bestMatch);
        return bestMatch;
    }

    /**
     * Get the number of prior studies supplied in the priorStudies map property.
     *
     * @param {String} studyInstanceUID The StudyInstanceUID of the study whose priors are needed
     * @returns {number} The number of available prior studies with the same PatientID
     */
    getNumberOfAvailablePriors(studyInstanceUID) {
        const priors = this.getAvailableStudyPriors(studyInstanceUID);
        return priors.length;
    }

    /**
     * Get the array prior studies from a specific study.
     *
     * @param {String} studyInstanceUID The StudyInstanceUID of the study whose priors are needed
     * @returns {Array} The array of available priors or an empty array
     */
    getAvailableStudyPriors(studyInstanceUID) {
        const priors = this.priorStudies.get(studyInstanceUID);
        return priors instanceof Array ? priors : [];
    }

    // Match images given a list of Studies and a Viewport's image matching reqs
    matchImages(viewport) {
        OHIF.log.info('ProtocolEngine::matchImages');

        const { studyMatchingRules, seriesMatchingRules, imageMatchingRules: instanceMatchingRules } = viewport;

        const matchingScores = [];
        const currentStudy = this.studies[0];

        let highestStudyMatchingScore = 0;
        let highestSeriesMatchingScore = 0;
        let highestImageMatchingScore = 0;
        let bestMatch;

        // Set custom attribute for study metadata
        currentStudy.setCustomAttribute('abstractPriorValue', 0);

        studyMatchingRules.forEach(rule => {
            if (rule.attribute === 'abstractPriorValue') {
                const validatorType = Object.keys(rule.constraint)[0];
                const validator = Object.keys(rule.constraint[validatorType])[0];

                let abstractPriorValue = rule.constraint[validatorType][validator];
                abstractPriorValue = parseInt(abstractPriorValue, 10);
                // TODO: Restrict or clarify validators for abstractPriorValue?

                const studies = this.getAvailableStudyPriors(currentStudy.getStudyInstanceUID());

                // TODO: Revisit this later: What about two studies with the same
                // study date?

                let priorStudy;
                if (abstractPriorValue === -1) {
                    priorStudy = studies[studies.length - 1];
                } else {
                    const studyIndex = Math.max(abstractPriorValue - 1, 0);
                    priorStudy = studies[studyIndex];
                }

                // Invalid data
                if (!(priorStudy instanceof StudyMetadata) && !(priorStudy instanceof StudySummary)) {
                    return;
                }

                const priorStudyInstanceUID = priorStudy.getStudyInstanceUID();

                // Check if study metadata is already in studies list
                if (this.studies.find(study => study.getStudyInstanceUID() === priorStudyInstanceUID)) {
                    return;
                }

                // Get study metadata if necessary and load study in the viewer (each viewer should provide it's own load study method)
                this.studyMetadataSource.loadStudy(priorStudy).then(studyMetadata => {
                    // Set the custom attribute abstractPriorValue for the study metadata
                    studyMetadata.setCustomAttribute('abstractPriorValue', abstractPriorValue);

                    // Insert the new study metadata
                    this.studies.push(studyMetadata);

                    // Update the viewport to refresh layout manager with new study
                    this.updateViewports();
                }, error => { 
                    OHIF.log.warn(error);
                    throw new OHIFError(`ProtocolEngine::matchImages could not get study metadata for studyInstanceUID: ${priorStudyInstanceUID}`);
                });
            }
            // TODO: Add relative Date / time
        });

        this.studies.forEach(study => {
            const studyMatchDetails = HP.match(study, studyMatchingRules);
            if ((studyMatchingRules.length && !studyMatchDetails.score) ||
                studyMatchDetails.score < highestStudyMatchingScore) {
                return;
            }

            highestStudyMatchingScore = studyMatchDetails.score;

            study.forEachSeries(series => {
                const seriesMatchDetails = HP.match(series, seriesMatchingRules);
                if ((seriesMatchingRules.length && !seriesMatchDetails.score) ||
                    seriesMatchDetails.score < highestSeriesMatchingScore) {
                    return;
                }

                highestSeriesMatchingScore = seriesMatchDetails.score;

                series.forEachInstance((instance, index) => {
                    // This tests to make sure there is actually image data in this instance
                    // TODO: Change this when we add PDF and MPEG support
                    // See https://ohiforg.atlassian.net/browse/LT-227
                    // sopClassUid = x00080016
                    // rows = x00280010
                    if (!OHIF.viewerbase.isImage(instance.getRawValue('x00080016')) && !instance.getRawValue('x00280010')) {
                        return;
                    }

                    const instanceMatchDetails = HP.match(instance, instanceMatchingRules);

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
                            study: instance.getRawValue('x00080020') + instance.getRawValue('x00080030'), // StudyDate = x00080020 StudyTime = x00080030
                            series: parseInt(instance.getRawValue('x00200011')), // TODO: change for seriesDateTime SeriesNumber = x00200011
                            instance: parseInt(instance.getRawValue('x00200013')) // TODO: change for acquisitionTime InstanceNumber = x00200013
                        }
                    };

                    // Find the displaySet
                    const displaySet = study.findDisplaySet(displaySet => displaySet.images.find(image => image.getSOPInstanceUID() === currentSOPInstanceUID));

                    // If the instance was found, set the displaySet ID
                    if (displaySet) {
                        imageDetails.displaySetInstanceUid = displaySet.getUID();
                        imageDetails.imageId = instance.getImageId();
                    }

                    if ((totalMatchScore > highestImageMatchingScore) || !bestMatch) {
                        highestImageMatchingScore = totalMatchScore;
                        bestMatch = imageDetails;
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
        if (!this.protocol || !this.protocol.stages || !this.protocol.stages.length) {
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
            const details = this.matchImages(viewport);

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
    setHangingProtocol(newProtocol, updateViewports=true) {
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
    }

    /**
     * Changes the current stage to a new stage index in the display set sequence
     *
     * @param stage An integer value specifying the index of the desired Stage
     */
    setCurrentProtocolStage(stage) {
        OHIF.log.info(`ProtocolEngine::setCurrentProtocolStage stage = ${stage}`);

        if (!this.protocol || !this.protocol.stages || !this.protocol.stages.length) {
            return;
        }

        if (stage >= this.protocol.stages.length) {
            return;
        }

        this.stage = stage;
        this.updateViewports();
    }

    /**
     * Retrieves the number of Stages in the current Protocol
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
        this.setCurrentProtocolStage(++this.stage);
    }

    /**
     * Switches to the previous protocol stage in the display set sequence
     */
    previousProtocolStage() {
        this.setCurrentProtocolStage(--this.stage);
    }
};
