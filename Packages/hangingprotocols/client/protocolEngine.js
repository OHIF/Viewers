import { OHIF } from 'meteor/ohif:core';

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
            applyWLPreset(optionValue, element);
        }
    });
});

// Log decisions regarding matching
HP.match = function(attributes, rules) {
    var options = {
        format: 'grouped'
    };

    var score = 0;
    var details = {
        passed: [],
        failed: []
    };

    var requiredFailed = false;

    rules.forEach(rule => {
        var attribute = rule.attribute;

        // If the attributes we are testing (e.g. study, series, or instance attributes) do
        // not contain the attribute specified in the rule, check whether or not they have been
        // defined in the CustomAttributeRetrievalCallbacks Object.

        // TODO: Investigate why attributes.hasOwnProperty(attribute) doesn't work?
        if (attributes[attribute] === undefined &&
            HP.CustomAttributeRetrievalCallbacks.hasOwnProperty(attribute)) {
            var customAttribute = HP.CustomAttributeRetrievalCallbacks[attribute];
            attributes[attribute] = customAttribute.callback(attributes);
        }

        // Format the constraint as required by Validate.js
        var testConstraint = {};
        testConstraint[attribute] = rule.constraint;

        // Use Validate.js to evaluate the constraints on the specified attributes
        var errorMessages = validate(attributes, testConstraint, [options]);

        if (!errorMessages) {
            // If no errorMessages were returned, then validation passed.

            // Add the rule's weight to the total score
            score += rule.weight;

            // Log that this rule passed in the matching details object
            details.passed.push({
                rule: rule
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
                rule: rule,
                errorMessages: errorMessages
            });
        }
    });

    // If a required Rule has failed Validation, set the matching score to zero
    if (requiredFailed) {
        score = 0;
    }

    return {
        score: score,
        details: details
    };
};

var sortByScore = function(arr) {
    arr.sort(function(a, b) {
        return b.score - a.score;
    });
};

HP.ProtocolEngine = class ProtocolEngine {
    constructor(LayoutManager, studies) {
        this.LayoutManager = LayoutManager;
        this.studies = studies;

        this.reset();

        // Create an array for new stage ids to be stored
        // while editing a stage
        this.newStageIds = [];
    }

    /**
     * Resets the ProtocolEngine to the best match
     */
    reset() {
        var protocol = this.getBestMatch();
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
        var matched = [];

        HangingProtocols.find().forEach(protocol => {
            // Clone the protocol's protocolMatchingRules array
            // We clone it so that we don't accidentally add the
            // numberOfPriorsReferenced rule to the Protocol itself.
            var rules = protocol.protocolMatchingRules.slice(0);
            if (!rules) {
                return;
            }

            study.numberOfPriorsReferenced = this.getNumberOfAvailablePriors(study);
            var rule = new HP.ProtocolMatchingRule('numberOfPriorsReferenced', {
                numericality: {
                    greaterThanOrEqualTo: protocol.numberOfPriorsReferenced
                }
            });

            rules.push(rule);

            var matchedDetails = HP.match(study, rules);

            if (matchedDetails.score > 0) {
                matched.push({
                    score: matchedDetails.score,
                    protocol: protocol
                });
            }
        });

        if (!matched.length) {
            var defaultProtocol = HangingProtocols.findOne({
                id: 'defaultProtocol'
            });

            return [{
                score: 1,
                protocol: defaultProtocol
            }];
        }

        sortByScore(matched);
        return matched;
    }

    /**
     * Populates the MatchedProtocols Collection by running the matching procedure
     */
    updateMatches() {
        // Clear all data from the MatchedProtocols Collection
        MatchedProtocols.remove({});

        // For each study, find the matching protocols
        this.studies.forEach(study => {
            var matched = this.findMatchByStudy(study);

            // For each matched protocol, check if it is already in MatchedProtocols
            matched.forEach(function(matchedDetail) {
                var protocol = matchedDetail.protocol;
                var protocolInCollection = MatchedProtocols.findOne({
                    id: protocol.id
                });

                // If it is not already in the MatchedProtocols Collection, insert it
                if (!protocolInCollection) {
                    MatchedProtocols.insert(protocol);
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
        var sorted = MatchedProtocols.find({}, {
            sort: {
                score: -1
            },
            limit: 1
        }).fetch();

        // Return the highest scoring Protocol
        return sorted[0];
    }

    /**
     * Calculates the number of previous studies in the cached Worklist that
     * have the same patientId and an earlier study date
     *
     * @param study The input study
     * @returns {any|*} The number of available prior studies with the same patientId
     */
    getNumberOfAvailablePriors(study) {
        var studies = WorklistStudies.find({
            patientId: study.patientId,
            studyDate: {
                $lt: study.studyDate
            }
        });

        return studies.count();
    }

    findRelatedStudies(protocol, study) {
        if (!protocol.protocolMatchingRules) {
            return;
        }

        var studies = WorklistStudies.find({
            patientId: study.patientId,
            studyDate: {
                $lt: study.studyDate
            }
        }, {
            sort: {
                studyDate: -1
            }
        });

        var related = [];
        var currentDate = moment(study.studyDate, 'YYYYMMDD');

        studies.forEach(function(priorStudy, priorIndex) {
            // Calculate an abstract prior value for the study in question
            if (priorIndex === (studies.length - 1)) {
                priorStudy.abstractPriorValue = -1;
            } else {
                // Abstract prior index starts from 1 in the DICOM standard
                priorStudy.abstractPriorValue = priorIndex + 1;
            }

            // Calculate the relative time using Moment.js
            var priorDate = moment(priorStudy.studyDate, 'YYYYMMDD');
            priorStudy.relativeTime = currentDate.diff(priorDate);

            var details = HP.match(priorStudy, protocol.protocolMatchingRules);
            if (details.score) {
                related.push({
                    score: details.score,
                    study: priorStudy
                });
            }
        });

        sortByScore(related);
        return related.map(function(v) {
            return v.study;
        });
    }

    // Match images given a list of Studies and a Viewport's image matching reqs
    matchImages(viewport) {
        var studyMatchingRules = viewport.studyMatchingRules;
        var seriesMatchingRules = viewport.seriesMatchingRules;
        var instanceMatchingRules = viewport.imageMatchingRules;

        var highestStudyMatchingScore = 0;
        var highestSeriesMatchingScore = 0;
        var highestImageMatchingScore = 0;
        var matchingScores = [];
        var bestMatch;

        var currentStudy = this.studies[0];
        currentStudy.abstractPriorValue = 0;

        studyMatchingRules.forEach(rule => {
            if (rule.attribute === 'abstractPriorValue') {
                var validatorType = Object.keys(rule.constraint)[0];
                var validator = Object.keys(rule.constraint[validatorType])[0];
                var abstractPriorValue = rule.constraint[validatorType][validator];
                abstractPriorValue = parseInt(abstractPriorValue, 10);
                // TODO: Restrict or clarify validators for abstractPriorValue?

                var studies = WorklistStudies.find({
                    patientId: currentStudy.patientId,
                    studyDate: {
                        $lt: currentStudy.studyDate
                    }
                }, {
                    sort: {
                        studyDate: -1
                    }
                }).fetch();

                // TODO: Revisit this later: What about two studies with the same
                // study date?

                var priorStudy;
                if (abstractPriorValue === -1) {
                    priorStudy = studies[studies.length - 1];
                } else {
                    var studyIndex = Math.max(abstractPriorValue - 1, 0);
                    priorStudy = studies[studyIndex];
                }

                if (!priorStudy) {
                    return;
                }

                var alreadyLoaded = ViewerStudies.findOne({
                    studyInstanceUid: priorStudy.studyInstanceUid
                });

                if (!alreadyLoaded) {
                    getStudyMetadata(priorStudy.studyInstanceUid, study => {
                        study.abstractPriorValue = abstractPriorValue;
                        study.displaySets = createStacks(study);
                        ViewerStudies.insert(study);
                        this.studies.push(study);
                        this.matchImages(viewport);
                        this.updateViewports();
                    });
                }
            }
            // TODO: Add relative Date / time
        });

        var lastStudyIndex = this.studies.length - 1;
        this.studies.forEach(function(study) {
            var studyMatchDetails = HP.match(study, studyMatchingRules);
            if ((studyMatchingRules.length && !studyMatchDetails.score) ||
                studyMatchDetails.score < highestStudyMatchingScore) {
                return;
            }

            highestStudyMatchingScore = studyMatchDetails.score;

            study.seriesList.forEach(function(series) {
                var seriesMatchDetails = HP.match(series, seriesMatchingRules);
                if ((seriesMatchingRules.length && !seriesMatchDetails.score) ||
                    seriesMatchDetails.score < highestSeriesMatchingScore) {
                    return;
                }

                highestSeriesMatchingScore = seriesMatchDetails.score;

                series.instances.forEach(function(instance, index) {
                    // This tests to make sure there is actually image data in this instance
                    // TODO: Change this when we add PDF and MPEG support
                    // See https://ohiforg.atlassian.net/browse/LT-227
                    if (!instance.rows || !instance.columns) {
                        return;
                    }

                    var instanceMatchDetails = HP.match(instance, instanceMatchingRules);

                    var matchDetails = {
                        passed: [],
                        failed: []
                    };

                    matchDetails.passed = matchDetails.passed.concat(instanceMatchDetails.details.passed);
                    matchDetails.passed = matchDetails.passed.concat(seriesMatchDetails.details.passed);
                    matchDetails.passed = matchDetails.passed.concat(studyMatchDetails.details.passed);

                    matchDetails.failed = matchDetails.failed.concat(instanceMatchDetails.details.failed);
                    matchDetails.failed = matchDetails.failed.concat(seriesMatchDetails.details.failed);
                    matchDetails.failed = matchDetails.failed.concat(studyMatchDetails.details.failed);

                    var totalMatchScore = instanceMatchDetails.score + seriesMatchDetails.score + studyMatchDetails.score;

                    var imageDetails = {
                        studyInstanceUid: study.studyInstanceUid,
                        seriesInstanceUid: series.seriesInstanceUid,
                        sopInstanceUid: instance.sopInstanceUid,
                        currentImageIdIndex: index,
                        matchingScore: totalMatchScore,
                        matchDetails: matchDetails
                    };

                    if ((totalMatchScore > highestImageMatchingScore) || !bestMatch) {
                        highestImageMatchingScore = totalMatchScore;
                        bestMatch = imageDetails;
                    }

                    matchingScores.push(imageDetails);
                });
            });
        });

        return {
            bestMatch: bestMatch,
            matchingScores: matchingScores
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
        // Make sure we have an active protocol with a non-empty array of display sets
        if (!this.protocol || !this.protocol.stages || !this.protocol.stages.length) {
            return;
        }

        // Retrieve the current display set in the display set sequence
        var stageModel = this.getCurrentStageModel();

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
        var layoutTemplateName = stageModel.viewportStructure.getLayoutTemplateName();
        if (!layoutTemplateName) {
            return;
        }

        // Retrieve the properties associated with the current display set's viewport structure template
        // If no such layout properties exist, stop here.
        var layoutProps = stageModel.viewportStructure.properties;
        if (!layoutProps) {
            return;
        }

        // Create an empty array to store the output viewportData
        var viewportData = [];

        // Empty the matchDetails associated with the ProtocolEngine.
        // This will be used to store the pass/fail details and score
        // for each of the viewport matching procedures
        this.matchDetails = [];

        // Loop through each viewport
        stageModel.viewports.forEach((viewport, viewportIndex) => {
            var details = this.matchImages(viewport);
            this.matchDetails[viewportIndex] = details;

            // Convert any YES/NO values into true/false for Cornerstone
            var cornerstoneViewportParams = {};
            Object.keys(viewport.viewportSettings).forEach(function(key) {
                var value = viewport.viewportSettings[key];
                if (value === 'YES') {
                    value = true;
                } else if (value === 'NO') {
                    value = false;
                }

                cornerstoneViewportParams[key] = value;
            });

            // imageViewerViewports occasionally needs relevant layout data in order to set
            // the element style of the viewport in question
            var currentViewportData = $.extend({
                viewportIndex: viewportIndex,
                viewport: cornerstoneViewportParams
            }, layoutProps);

            var customSettings = [];
            Object.keys(viewport.viewportSettings).forEach(id => {
                var setting = HP.CustomViewportSettings[id];
                if (!setting) {
                    return;
                }

                customSettings.push({
                    id: id,
                    value: viewport.viewportSettings[id]
                });
            });

            currentViewportData.renderedCallback = function(element) {
                //console.log('renderedCallback for ' + element.id);
                customSettings.forEach(function(customSetting) {
                    console.log('Applying custom setting: ' + customSetting.id);
                    console.log('with value: ' + customSetting.value);

                    var setting = HP.CustomViewportSettings[customSetting.id];
                    setting.callback(element, customSetting.value);
                });
            };

            if (details.bestMatch) {
                currentViewportData.studyInstanceUid = details.bestMatch.studyInstanceUid;
                currentViewportData.seriesInstanceUid = details.bestMatch.seriesInstanceUid;
                currentViewportData.sopInstanceUid = details.bestMatch.sopInstanceUid;
                currentViewportData.currentImageIdIndex = details.bestMatch.currentImageIdIndex;
            }

            const study = ViewerStudies.findOne({
                studyInstanceUid: details.bestMatch.studyInstanceUid
            });

            // Find the best matched display set. TODO: Fix this to actually
            // find the most appropriate display set
            study.displaySets.forEach(displaySet => {
                if (displaySet.seriesInstanceUid === details.bestMatch.seriesInstanceUid) {
                    currentViewportData.displaySetInstanceUid = displaySet.displaySetInstanceUid;
                    return false;
                }
            })

            if (!currentViewportData.displaySetInstanceUid) {
                throw "No matching display set found?";
            }

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
