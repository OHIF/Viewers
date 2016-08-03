var keys = {
    ESC: 27
};

/**
 * Close the specified dialog element and return browser
 * focus to the active viewport.
 *
 * @param dialog The DOM element of the dialog to close
 */
function closeHandler(dialog) {
    // Hide the lesion dialog
    $(dialog).css('display', 'none');

    // Remove the backdrop
    $('.removableBackdrop').remove();

    // Restore the focus to the active viewport
    setFocusToActiveViewport();
}

/**
 * Displays and updates the UI of the Rule Entry Dialog given a new set of
 * attributes, the rule level (protocol, study, series, or instance), and an
 * optional rule to edit.
 *
 * @param attributes List of attributes the user can set
 * @param level Level of the Rule to create / edit
 * @param rule Optional Rule
 */
openRuleEntryDialog = function(attributes, level, rule) {
    // Get the lesion location dialog
    var dialog = $('.ruleEntryDialog');

    // Clear any input that is still on the page
    var currentValueInput = dialog.find('input.currentValue');
    currentValueInput.val('');

    // Store the Dialog DOM data, rule level and rule in the template data
    Template.ruleEntryDialog.dialog = dialog;
    Template.ruleEntryDialog.level = level;
    Template.ruleEntryDialog.rule = rule;

    // Initialize the Select2 search box for the attribute list
    var attributeSelect = dialog.find('.attributes');
    attributeSelect.html('').select2({
        data: attributes,
        placeholder: 'Select an attribute',
        allowClear: true
    });

    // If a rule has been provided, set the value of the attribute Select2 input
    // to the attribute set in the rule.
    if (rule && rule.attribute) {
        attributeSelect.val(rule.attribute);
    }

    // Trigger('change') is used to update the Select2 choice in the UI and so
    // that the currentValue is updated based on the current attribute
    attributeSelect.trigger('change');

    // If a rule has been provided, use its constraint to find the relevant Comparator
    if (rule && rule.constraint) {
        var validator = Object.keys(rule.constraint)[0];
        var validatorOption = Object.keys(rule.constraint[validator])[0];
        var comparator = Comparators.findOne({
            validator: validator,
            validatorOption: validatorOption
        });

        // Set the current value input based on the rule constraint
        var currentValue = rule.constraint[validator][validatorOption];
        currentValueInput.val(currentValue);
    }

    // If a Comparator was found, set the default value of the Comparators select2 box
    // to the comparatorId in the input rule
    if (comparator) {
        // Trigger('change') is used to update the Select2 choice in the UI
        dialog.find('.comparators').val(comparator.id).trigger('change');
    }

    // Update the dialog's CSS so that it is visible on the page
    dialog.css('display', 'block');

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });
};

/**
 * Retrieves the current active element's imageId using Cornerstone
 */
function getActiveViewportImageId() {
    // Retrieve the active viewport index from the Session
    var activeViewport = Session.get('activeViewport');
    if (activeViewport === undefined) {
        return;
    }

    // Obtain the list of all Viewports on the page
    var viewports = $('.imageViewerViewport');

    // Retrieve the active viewport element
    var element = viewports.get(activeViewport);
    if (!element) {
        return;
    }

    // Obtain the enabled element from Cornerstone
    try {
        var enabledElement = cornerstone.getEnabledElement(element);
        if (!enabledElement) {
            return;
        }
    } catch(error) {
        log.warn(error);
        return;
    }
    // Return the enabled element's imageId
    return enabledElement.image.imageId;
}

function getAbstractPriorValue(imageId) {
    var currentStudy = ViewerStudies.findOne({}, {
        sort: {
            studyDate: -1
        },
        limit: 1
    });

    if (!currentStudy) {
        return;
    }

    var priorStudy = cornerstoneTools.metaData.get('study', imageId);
    if (!priorStudy) {
        return;
    }
    
    var studies = WorklistStudies.find({
        patientId: currentStudy.patientId,
        studyDate: {
            $lt: currentStudy.studyDate
        }
    }, {
        sort: {
            studyDate: -1
        }
    });

    var priorIndex = 0;

    // TODO: Check what the abstract prior value should equal for an unrelated study?
    studies.forEach(function(study, index) {
        if (study.studyInstanceUid === priorStudy.studyInstanceUid) {
            // Abstract prior index starts from 1 in the DICOM standard
            // so we add 1 here
            priorIndex = index + 1;
            return false;
        }
    });

    return priorIndex;
}

/**
 * Retrieve the current value of an attribute
 * @returns {*}
 */
function getCurrentAttributeValue(attribute, level) {
    // Retrieve the active viewport's imageId. If none exists, stop here
    var imageId = getActiveViewportImageId();
    if (!imageId) {
        return;
    }

    // If the dialog level is specified as 'protocol', change it to
    // 'study' for metaData retrieval
    if (level === 'protocol') {
        level = 'study';
    }
    
    if (attribute === 'abstractPriorValue') {
        return getAbstractPriorValue(imageId);
    }

    // Retrieve the metadata values for the specified level from
    // the Cornerstone Tools metaData provider
    var metadata = cornerstoneTools.metaData.get(level, imageId);

    if (metadata[attribute] === undefined) {
        return HP.attributeDefaults[attribute];
    }

    return metadata[attribute];
}

Template.ruleEntryDialog.onCreated(function() {
    // Define the ReactiveVars that will be used to link aspects of the UI
    var template = this;
    // Note: currentValue's initial value must be a string so the template renders properly
    template.currentValue = new ReactiveVar('');
    template.attribute = new ReactiveVar();
    template.comparatorId = new ReactiveVar();
});

Template.ruleEntryDialog.onRendered(function() {
    // Initialize the Comparators Select2 box
    var template = Template.instance();
    template.$('.comparators').select2();

    // Get the default Comparator from the Select2 box and use it to
    // initialize the comparatorId ReactiveVar
    var comparatorId = template.$('.comparators').val();
    template.comparatorId.set(comparatorId);

    const dialog = template.$('.ruleEntryDialog');
    dialog.draggable();
});

Template.ruleEntryDialog.helpers({
    /**
     * Returns the Comparators Collection to the Template with reactive rerendering
     */
    comparators: function() {
        return Comparators.find();
    },
    /**
     * Reactively updates the current value of the selected attribute for the selected image
     *
     * @returns {*} Attribute value for the active image
     */
    currentValue: function() {
        return Template.instance().currentValue.get();
    }
});

Template.ruleEntryDialog.events({
    /**
     * Save a rule that is being edited
     *
     * @param event the Click event
     * @param template The template context
     */
    'click #save': function(event, template) {
        // Retrieve the input properties to the template
        var dialog = Template.ruleEntryDialog.dialog;
        var level = Template.ruleEntryDialog.level;

        // Retrieve the current values for the attribute value and comparatorId
        var attribute = template.attribute.get();
        var comparatorId = template.comparatorId.get();
        var currentValue = template.currentValue.get();

        // If currentValue input is undefined, prevent saving this rule
        if (currentValue === undefined) {
            return;
        }

        // Check if we are editing a rule or creating a new one
        var rule;
        if (Template.ruleEntryDialog.rule) {
            // If we are editing a rule, change the rule data
            rule = Template.ruleEntryDialog.rule;
        } else {
            // If we are creating a rule, obtain the active Viewport model
            // from the Protocol and Stage
            var viewport = getActiveViewportModel();

            // Create a rule depending on the level property of this dialog
            switch (level) {
                case 'protocol':
                    rule = new HP.ProtocolMatchingRule();
                    ProtocolEngine.protocol.addProtocolMatchingRule(rule);
                    break;
                case 'study':
                    rule = new HP.StudyMatchingRule();
                    viewport.studyMatchingRules.push(rule);
                    break;
                case 'series':
                    rule = new HP.SeriesMatchingRule();
                    viewport.seriesMatchingRules.push(rule);
                    break;
                case 'instance':
                    rule = new HP.ImageMatchingRule();
                    viewport.imageMatchingRules.push(rule);
                    break;
            }
        }

        // Find the Comparator from the Comparators Collection given its ID
        var comparator = Comparators.findOne({
            id: comparatorId
        });

        // Create a new constraint to add to the rule
        var constraint = {};
        constraint[comparator.validator] = {};
        constraint[comparator.validator][comparator.validatorOption] = currentValue;

        // Set the attribute and constraint of the rule
        rule.attribute = attribute;
        rule.constraint = constraint;

        // Instruct the Protocol Engine to update the Layout Manager with new data
        var viewportIndex = Session.get('activeViewport');
        ProtocolEngine.updateViewports(viewportIndex);

        // Close the dialog
        closeHandler(dialog);
    },
    /**
     * Allow the user to click the Cancel button to close the dialog
     */
    'click #cancel': function() {
        var dialog = Template.ruleEntryDialog.dialog;
        closeHandler(dialog);
    },
    /**
     * Allow Esc keydown events to close the dialog
     *
     * @param event The Keydown event details
     * @returns {boolean} Return false to prevent bubbling of the event
     */
    'keydown .ruleEntryDialog': function(event) {
        var dialog = Template.ruleEntryDialog.dialog;

        // If Esc key is pressed, close the dialog
        if (event.which === keys.ESC) {
            closeHandler(dialog);
            return false;
        }
    },
    /**
     * Update the currentValue ReactiveVar if the user changes the attribute
     *
     * @param event The Change event for the select box
     * @param template The current template context
     */
    'change select.attributes': function(event, template) {
        // Obtain the user-specified attribute to test against
        var attribute = $(event.currentTarget).val();

        // Store it in the ReactiveVar
        template.attribute.set(attribute);

        // Store this attribute in the template data context
        Template.ruleEntryDialog.selectedAttribute = attribute;

        // Get the level of this dialog
        var level = Template.ruleEntryDialog.level;

        // Retrieve the current value of the attribute for the active viewport model
        var value = getCurrentAttributeValue(attribute, level);

        // Update the ReactiveVar with the user-specified value
        template.currentValue.set(value);
    },
    /**
     * Update the currentValue ReactiveVar if the user changes the attribute value
     *
     * @param event The Change event for the input
     * @param template The current template context
     */
    'change input.currentValue': function(event, template) {
        // Get the DOM element representing the input box
        var input = $(event.currentTarget);

        // Get the current value of the input
        var value = input.val();

        // If the input is of type 'number', parse it as a Float
        if (input.attr('type') === 'number') {
            value = parseFloat(value);
        }

        // Update the ReactiveVar with the user-specified value
        template.currentValue.set(value);
    },
    /**
     * Update the comparatorId ReactiveVar whenever the Comparators select box is changed
     *
     * @param event The Change event for the select box
     * @param template The current template context
     */
    'change select.comparators': function(event, template) {
        // Get the current value of the select box
        var comparatorId = $(event.currentTarget).val();

        // Update the ReactiveVar with the value of the Comparators select box
        template.comparatorId.set(comparatorId);
    }
});
