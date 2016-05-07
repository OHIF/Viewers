/**
 * Removes the first instance of an element from an array, if an equal value exists
 *
 * @param array
 * @param input
 *
 * @returns {boolean} Whether or not the element was found and removed
 */
function removeFromArray(array, input) {
    // If the array is empty, stop here
    if (!array ||
        !array.length) {
        return false;
    }

    array.forEach(function(value, index) {
        if (_.isEqual(value, input)) {
            indexToRemove = index;
            return false;
        }
    });

    if (indexToRemove === undefined) {
        return false;
    }

    array.splice(indexToRemove, 1);
    return true;
}

/**
 * This class represents a Hanging Protocol at the highest level
 *
 * @type {Protocol}
 */
HP.Protocol = class Protocol {
    /**
     * The Constructor for the Class to create a Protocol with the bare
     * minimum information
     *
     * @param name The desired name for the Protocol
     */
    constructor(name) {
        // Create a new UUID for this Protocol
        this.id = uuid.new();

        // Store a value which determines whether or not a Protocol is locked
        // This is probably temporary, since we will eventually have role / user
        // checks for editing. For now we just need it to prevent changes to the
        // default protocols.
        this.locked = false;

        // Apply the desired name
        this.name = name;

        // Set the created and modified dates to Now
        this.createdDate = new Date();
        this.modifiedDate = new Date();

        // If we are logged in while creating this Protocol,
        // store this information as well
        if (Meteor.users && Meteor.userId) {
            this.createdBy = Meteor.userId;
            this.modifiedBy = Meteor.userId;
        }

        // Create two empty Sets specifying which roles
        // have read and write access to this Protocol
        this.availableTo = new Set();
        this.editableBy = new Set();

        // Define empty arrays for the Protocol matching rules
        // and Stages
        this.protocolMatchingRules = [];
        this.stages = [];
        this.numberOfPriorsReferenced = 0;
    }

    updateNumberOfPriorsReferenced() {
        var numPriorsReferenced = 0;

        this.stages.forEach(function(stage) {
            if (!stage.viewports) {
                return;
            }

            stage.viewports.forEach(function(viewport) {
                if (!viewport.studyMatchingRules) {
                    return;
                }

                viewport.studyMatchingRules.forEach(function(rule) {
                    if (rule.attribute === 'abstractPriorValue') {
                        // TODO: Double check here that the abstractPriorValue is not
                        // set as zero
                        numPriorsReferenced++;
                    } else if (rule.attribute === 'relativeTime') {
                        numPriorsReferenced++;
                    }
                });
            });
        });

        this.numberOfPriorsReferenced = numPriorsReferenced;
    }

    /**
     * Method to update the modifiedDate when the Protocol
     * has been changed
     */
    protocolWasModified() {
        // If we are logged in while modifying this Protocol,
        // store this information as well
        if (Meteor.users && Meteor.userId) {
            this.modifiedBy = Meteor.userId;
        }

        this.updateNumberOfPriorsReferenced();

        // Update the modifiedDate with the current Date/Time
        this.modifiedDate = new Date();
    }

    /**
     * Occasionally the Protocol class needs to be instantiated from a JavaScript Object
     * containing the Protocol data. This function fills in a Protocol with the Object
     * data.
     *
     * @param input A Protocol as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        // Check if the input already has an ID
        // If so, keep it. It not, create a new UUID
        this.id = input.id || uuid.new();

        // Assign the input name to the Protocol
        this.name = input.name;

        // Retrieve locked status, use !! to make it truthy
        // so that undefined values will be set to false
        this.locked = !!input.locked;

        // TODO: Check how to regenerate Set from Object
        //this.availableTo = new Set(input.availableTo);
        //this.editableBy = new Set(input.editableBy);

        // If the input contains Protocol matching rules
        if (input.protocolMatchingRules) {
            input.protocolMatchingRules.forEach(ruleObject => {
                // Create new Rules from the stored data
                var rule = new HP.ProtocolMatchingRule();
                rule.fromObject(ruleObject);

                // Add them to the Protocol
                this.protocolMatchingRules.push(rule);
            });
        }

        // If the input contains data for various Stages in the
        // display set sequence
        if (input.stages) {
            input.stages.forEach(stageObject => {
                // Create Stages from the stored data
                var stage = new HP.Stage();
                stage.fromObject(stageObject);

                // Add them to the Protocol
                this.stages.push(stage);
            });
        }
    }

    /**
     * Creates a clone of the current Protocol with a new name
     *
     * Note! This method absolutely cannot be renamed 'clone', because
     * Minimongo's insert method uses 'clone' internally and this
     * somehow causes very bizarre behaviour
     *
     * @param name
     * @returns {Protocol|*}
     */
    createClone(name) {
        // Create a new JavaScript independent of the current Protocol
        var currentProtocol = $.extend({}, this);

        // Create a new Protocol to return
        var clonedProtocol = new HP.Protocol();

        // Apply the desired properties
        currentProtocol.id = clonedProtocol.id;
        clonedProtocol.fromObject(currentProtocol);

        // If we have specified a name, assign it
        if (name) {
            clonedProtocol.name = name;
        }

        // Remove any MongoDB ID the current protocol may have had
        delete clonedProtocol._id;

        // Unlock the clone
        clonedProtocol.locked = false;

        // Return the cloned Protocol
        return clonedProtocol;
    }

    /**
     * Add a Role to the Set of Roles that have access
     * to this Protocol
     *
     * @param role
     */
    addAvailableTo(role) {
        // Add the role's MongoDB _id to the availableTo Set
        this.availableTo.add(role._id);

        // Update the modifiedDate and User that last
        // modified this Protocol
        this.protocolWasModified();
    }

    /**
     * Add a Role to the Set of Roles that have access
     * to this Protocol
     *
     * @param role
     */
    addEditableBy(role) {
        // Add the role's MongoDB _id to the editableBy Set
        this.editableBy.add(role._id);

        // Update the modifiedDate and User that last
        // modified this Protocol
        this.protocolWasModified();
    }

    /**
     * Adds a Stage to this Protocol's display set sequence
     *
     * @param stage
     */
    addStage(stage) {
        this.stages.push(stage);

        // Update the modifiedDate and User that last
        // modified this Protocol
        this.protocolWasModified();
    }

    /**
     * Adds a Rule to this Protocol's array of matching rules
     *
     * @param rule
     */
    addProtocolMatchingRule(rule) {
        this.protocolMatchingRules.push(rule);

        // Update the modifiedDate and User that last
        // modified this Protocol
        this.protocolWasModified();
    }

    /**
     * Removes a Rule from this Protocol's array of matching rules
     *
     * @param rule
     */
    removeProtocolMatchingRule(rule) {
        var wasRemoved = removeFromArray(this.protocolMatchingRules, rule);

        // Update the modifiedDate and User that last
        // modified this Protocol
        if (wasRemoved) {
            this.protocolWasModified();
        }
    }
};

/**
 * This Class represents a Rule to be evaluated given a set of attributes
 * Rules have:
 * - An attribute (e.g. 'seriesDescription')
 * - A constraint Object, in the form required by Validate.js:
 *
 * rule.constraint = {
 *   contains: {
 *      value: 'T-1'
 *      }
 *   };
 *
 *  Note: In this example we use the 'contains' Validator, which is a custom Validator defined in Viewerbase
 *
 * - A value for whether or not they are Required to be matched (default: False)
 * - A value for their relative weighting during Protocol or Image matching (default: 1)
 */
class Rule {
    /**
     * The Constructor for the Class to create a Rule with the bare
     * minimum information
     *
     * @param name The desired name for the Rule
     */
    constructor(attribute, constraint, required, weight) {
        // Create a new UUID for this Rule
        this.id = uuid.new();

        // Set the Rule's weight (defaults to 1)
        this.weight = weight || 1;

        // If an attribute is specified, assign it
        if (attribute) {
            this.attribute = attribute;
        }

        // If a constraint is specified, assign it
        if (constraint) {
            this.constraint = constraint;
        }

        // If a value for 'required' is specified, assign it
        if (required === undefined) {
            // If no value was specified, default to False
            this.required = false;
        } else {
            this.required = required;
        }
    }

    /**
     * Occasionally the Rule class needs to be instantiated from a JavaScript Object.
     * This function fills in a Protocol with the Object data.
     *
     * @param input A Rule as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        // Check if the input already has an ID
        // If so, keep it. It not, create a new UUID
        this.id = input.id || uuid.new();

        // Assign the specified input data to the Rule
        this.required = input.required;
        this.weight = input.weight;
        this.attribute = input.attribute;
        this.constraint = input.constraint;
    }
}

/**
 * The ProtocolMatchingRule Class extends the Rule Class.
 *
 * At present it does not add any new methods or attributes
 * @type {ProtocolMatchingRule}
 */
HP.ProtocolMatchingRule = class ProtocolMatchingRule extends Rule {};

/**
 * A Stage is one step in the Display Set Sequence for a Hanging Protocol
 *
 * Stages are defined as a ViewportStructure and an array of Viewports
 *
 * @type {Stage}
 */
HP.Stage = class Stage {
    constructor(ViewportStructure, name) {
        // Create a new UUID for this Stage
        this.id = uuid.new();

        // Assign the name and ViewportStructure provided
        this.name = name;
        this.viewportStructure = ViewportStructure;

        // Create an empty array for the Viewports
        this.viewports = [];

        // Set the created date to Now
        this.createdDate = new Date();
    }

    /**
     * Creates a clone of the current Stage with a new name
     *
     * Note! This method absolutely cannot be renamed 'clone', because
     * Minimongo's insert method uses 'clone' internally and this
     * somehow causes very bizarre behaviour
     *
     * @param name
     * @returns {Stage|*}
     */
    createClone(name) {
        // Create a new JavaScript independent of the current Protocol
        var currentStage = $.extend({}, this);

        // Create a new Stage to return
        var clonedStage = new HP.Stage();

        // Assign the desired properties
        currentStage.id = clonedStage.id;
        clonedStage.fromObject(currentStage);

        // If we have specified a name, assign it
        if (name) {
            clonedStage.name = name;
        }

        // Return the cloned Stage
        return clonedStage;
    }

    /**
     * Occasionally the Stage class needs to be instantiated from a JavaScript Object.
     * This function fills in a Protocol with the Object data.
     *
     * @param input A Stage as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        // Check if the input already has an ID
        // If so, keep it. It not, create a new UUID
        this.id = input.id || uuid.new();

        // Assign the input name to the Stage
        this.name = input.name;

        // If a ViewportStructure is present in the input, add it from the
        // input data
        this.viewportStructure = new HP.ViewportStructure();
        this.viewportStructure.fromObject(input.viewportStructure);

        // If any viewports are present in the input object
        if (input.viewports) {
            input.viewports.forEach(viewportObject => {
                // Create a new Viewport with their data
                var viewport = new HP.Viewport();
                viewport.fromObject(viewportObject);

                // Add it to the viewports array
                this.viewports.push(viewport);
            });
        }
    }
};

/**
 * The ViewportStructure class represents the layout and layout properties that
 * Viewports are displayed in. ViewportStructure has a type, which corresponds to
 * a layout template, and a set of properties, which depend on the type.
 *
 * @type {ViewportStructure}
 */
HP.ViewportStructure = class ViewportStructure {
    constructor(type, properties) {
        this.type = type;
        this.properties = properties;
    }

    /**
     * Occasionally the ViewportStructure class needs to be instantiated from a JavaScript Object.
     * This function fills in a ViewportStructure with the Object data.
     *
     * @param input The ViewportStructure as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        this.type = input.type;
        this.properties = input.properties;
    }

    /**
     * Retrieve the layout template name based on the layout type
     *
     * @returns {string}
     */
    getLayoutTemplateName() {
        // Viewport structure can be updated later when we build more complex display layouts
        switch (this.type) {
            case 'grid':
                return 'gridLayout';
        }
    }

    /**
     * Retrieve the number of Viewports required for this layout
     * given the layout type and properties
     *
     * @returns {string}
     */
    getNumViewports() {
        // Viewport structure can be updated later when we build more complex display layouts
        switch (this.type) {
            case 'grid':
                // For the typical grid layout, we only need to multiply rows by columns to
                // obtain the number of viewports
                return this.properties.rows * this.properties.columns;
        }   
    }
};

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

/**
 * The ImageMatchingRule class extends the Rule Class.
 *
 * At present it does not add any new methods or attributes
 * @type {ImageMatchingRule}
 */
HP.ImageMatchingRule = class ImageMatchingRule extends Rule {};

/**
 * The SeriesMatchingRule Class extends the Rule Class.
 *
 * At present it does not add any new methods or attributes
 * @type {SeriesMatchingRule}
 */
HP.SeriesMatchingRule = class SeriesMatchingRule extends Rule {};

/**
 * The StudyMatchingRule Class extends the Rule Class.
 *
 * At present it does not add any new methods or attributes
 * @type {StudyMatchingRule}
 */
HP.StudyMatchingRule = class StudyMatchingRule extends Rule {};
