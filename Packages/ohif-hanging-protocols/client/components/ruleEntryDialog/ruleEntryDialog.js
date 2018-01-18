import { $ } from 'meteor/jquery';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

import { OHIF } from 'meteor/ohif:core';
import { Viewerbase } from 'meteor/ohif:viewerbase';

const keys = {
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
    Viewerbase.setFocusToActiveViewport();
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

    // Event data to be passed to the event handler
    let eventData;

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

        eventData = currentValue;

        // If a Comparator was found, set the default value of the Comparators select2 box
        // to the comparatorId in the input rule
        if (comparator) {
            // Trigger('change') is used to update the Select2 choice in the UI
            dialog.find('.comparators').val(comparator.id).trigger('change');
        }
    }

    // Trigger('change') is used to update the Select2 choice in the UI and so
    // that the currentValue is updated based on the current attribute
    attributeSelect.trigger('change', eventData);

    // Update the dialog's CSS so that it is visible on the page
    dialog.css('display', 'block');

    // Show the backdrop
    Blaze.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });
};

/**
 * Retrieves the current active element's imageId using Cornerstone
 */
function getActiveViewportImageId() {
    const enabledElement = Viewerbase.viewportUtils.getEnabledElementForActiveElement();

    if (!enabledElement) {
        return;
    }

    // Return the enabled element's imageId
    return enabledElement.image.imageId;
}

function getAbstractPriorValue(imageId) {
    // @TypeSafeStudies
    // Retrieves the first study of the collection using the given sort order.
    // Since we're only interrested in the first record, "null" will be used
    // as search criteria (thus no actual search will be made).
    const currentStudy = OHIF.viewer.Studies.findBy(null, {
        sort: [ ['studyDate', 'desc'] ]
    });

    if (!currentStudy) {
        return;
    }

    const priorStudy = cornerstone.metaData.get('study', imageId);
    if (!priorStudy) {
        return;
    }

    const studies = OHIF.studylist.collections.Studies.find({
        patientId: currentStudy.patientId,
        studyDate: {
            $lt: currentStudy.studyDate
        }
    }, {
        sort: {
            studyDate: -1
        }
    });

    let priorIndex = 0;

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
 * Retrieve the current value of a metadata tag or property. It searches the value in different levels (study, series or instance)
 * @param  {String} tagOrProperty DICOM Tag or Property name (Ex: 'x00100020', 'patientId')
 * @return {Any}              The value of the DICOM tag or property name
 */
const getCurrentTagOrPropertyValue = tagOrProperty => {
    // Retrieve the active viewport's imageId. If none exists, stop here
    const imageId = getActiveViewportImageId();
    if (!imageId) {
        return;
    }

    if (tagOrProperty === 'abstractPriorValue') {
        return getAbstractPriorValue(imageId);
    }

    // Create the object for the instance metadata
    let instance;

    OHIF.viewer.StudyMetadataList.find(studyMetadata => {
        // Search for the instance that has the current imageId
        instance = studyMetadata.findInstance(instance => {
            return instance.getImageId() === imageId;
        });

        // If instance if found stop the search
        return !!instance;
    });

    // No instance found
    if (!instance) {
        return;
    }

    // Get the value for the given tag
    // It searches the value in different levels (study, series or instance)
    const tagOrPropertyValue = instance.getTagValue(tagOrProperty);

    // If not found, is a custom Hanging Protocol attribute
    if (tagOrPropertyValue === void 0) {
        return HP.attributeDefaults[tagOrProperty];
    }

    return tagOrPropertyValue;
};

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
    'change select.attributes'(event, template, currentValue) {
        // Obtain the user-specified attribute to test against
        const attribute = $(event.currentTarget).val();

        // Store it in the ReactiveVar
        template.attribute.set(attribute);

        // Store this attribute in the template data context
        Template.ruleEntryDialog.selectedAttribute = attribute;

        // // Get the level of this dialog
        // var level = Template.ruleEntryDialog.level;

        let value;

        // Preset currentValue, use it
        if (currentValue) {
            value = currentValue;
        }
        else {
            // Retrieve the current value of the attribute for the active viewport model
            value = getCurrentTagOrPropertyValue(attribute);
        }

        // Update the ReactiveVar with the user-specified value
        template.currentValue.set(value);

        // Enforce to update the input value (Otherwise, ReactiveVar does not update input value with the same values)
        const currentValueInput = $('.ruleEntryDialog').find('input.currentValue');
        currentValueInput.val(value);
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
