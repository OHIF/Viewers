// Local imports
import { removeFromArray } from '../lib/removeFromArray';

/**
 * This Class defines a Viewport in the Hanging Protocol Stage. A Viewport contains
 * arrays of Rules that are matched in the ProtocolEngine in order to determine which
 * images should be hung.
 *
 * @type {Viewport}
 */
HP.Viewport = class Viewport {
    constructor() {
        this.viewportSettings = {};
        this.imageMatchingRules = [];
        this.seriesMatchingRules = [];
        this.studyMatchingRules = [];
    }

    /**
     * Occasionally the Viewport class needs to be instantiated from a JavaScript Object.
     * This function fills in a Viewport with the Object data.
     *
     * @param input The Viewport as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        // If ImageMatchingRules exist, create them from the Object data
        // and add them to the Viewport's imageMatchingRules array
        if (input.imageMatchingRules) {
            input.imageMatchingRules.forEach(ruleObject => {
                var rule = new HP.ImageMatchingRule();
                rule.fromObject(ruleObject);
                this.imageMatchingRules.push(rule);
            });
        }

        // If SeriesMatchingRules exist, create them from the Object data
        // and add them to the Viewport's seriesMatchingRules array
        if (input.seriesMatchingRules) {
            input.seriesMatchingRules.forEach(ruleObject => {
                var rule = new HP.SeriesMatchingRule();
                rule.fromObject(ruleObject);
                this.seriesMatchingRules.push(rule);
            });
        }

        // If StudyMatchingRules exist, create them from the Object data
        // and add them to the Viewport's studyMatchingRules array
        if (input.studyMatchingRules) {
            input.studyMatchingRules.forEach(ruleObject => {
                var rule = new HP.StudyMatchingRule();
                rule.fromObject(ruleObject);
                this.studyMatchingRules.push(rule);
            });
        }

        // If ViewportSettings exist, add them to the current protocol
        if (input.viewportSettings) {
            this.viewportSettings = input.viewportSettings;
        }
    }

    /**
     * Finds and removes a rule from whichever array it exists in.
     * It is not required to specify if it exists in studyMatchingRules,
     * seriesMatchingRules, or imageMatchingRules
     *
     * @param rule
     */
    removeRule(rule) {
        var array;
        if (rule instanceof HP.StudyMatchingRule) {
            array = this.studyMatchingRules;
        } else if (rule instanceof HP.SeriesMatchingRule) {
            array = this.seriesMatchingRules;
        } else if (rule instanceof HP.ImageMatchingRule) {
            array = this.imageMatchingRules;
        }

        removeFromArray(array, rule);
    }
};