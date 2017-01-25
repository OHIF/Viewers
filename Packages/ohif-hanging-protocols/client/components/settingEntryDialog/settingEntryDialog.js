import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { $ } from 'meteor/jquery';

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
 * Displays and updates the UI of the Setting Entry Dialog given an
 * optional setting to edit.
 *
 * @param settingObject
 */
openSettingEntryDialog = function(settingObject) {
    // Get the lesion location dialog
    var dialog = $('.settingEntryDialog');

    // Store the Dialog DOM data, setting level and setting in the template data
    Template.settingEntryDialog.dialog = dialog;
    Template.settingEntryDialog.settingObject = settingObject;

    // Initialize the Select2 search box for the attribute list
    var settings = Object.keys(HP.displaySettings);
    settings.concat(Object.keys(HP.CustomViewportSettings));

    var displaySettingsOptions = Object.keys(HP.displaySettings).map(key => {
        return {
            id: key,
            text: HP.displaySettings[key].text
        };
    });

    var customSettingsOptions = Object.keys(HP.CustomViewportSettings).map(key => {
        return {
            id: key,
            text: HP.CustomViewportSettings[key].text
        };
    });

    var settingsOptions = displaySettingsOptions.concat(customSettingsOptions);

    var settingSelect = dialog.find('.settings');
    settingSelect.html('').select2({
        data: settingsOptions,
        placeholder: 'Select a setting',
        allowClear: true
    });

    var settingDetails = {
        options: []
    };

    if (settingObject && HP.displaySettings[settingObject.id]) {
        settingDetails = HP.displaySettings[settingObject.id];
    } else if (settingObject && HP.CustomViewportSettings[settingObject.id]) {
        settingDetails = HP.CustomViewportSettings[settingObject.id];
    }

    var valueSelect = dialog.find('.currentValue');
    valueSelect.html('').select2({
        data: settingDetails.options,
        placeholder: 'Select a value',
        allowClear: true
    });

    // If a setting has been provided, set the value of the attribute Select2 input
    // to the attribute set in the setting.
    if (settingObject && settingObject.id) {
        settingSelect.val(settingObject.id);
    }

    // Trigger('change') is used to update the Select2 choice in the UI
    // This is done after setting the value in case no setting was provided
    settingSelect.trigger('change');

    // If a setting has been provided, display its current value
    if (settingObject && settingObject.value !== undefined) {
        valueSelect.val(settingObject.value).trigger('change');
    }

    // Update the dialog's CSS so that it is visible on the page
    dialog.css('display', 'block');

    // Show the backdrop
    Blaze.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });
};

Template.settingEntryDialog.onCreated(function() {
    // Define the ReactiveVars that will be used to link aspects of the UI
    var template = this;

    // Note: currentValue's initial value must be a string so the template renders properly
    template.currentValue = new ReactiveVar('');
    template.setting = new ReactiveVar();
});

Template.settingEntryDialog.onRendered(function() {
    const template = this;
    const dialog = template.$('.settingEntryDialog');
    dialog.draggable();
});

Template.settingEntryDialog.events({
    /**
     * Save a setting that is being edited
     *
     * @param event the Click event
     * @param template The template context
     */
    'click #save': function(event, template) {
        // Retrieve the input properties to the template
        var dialog = Template.settingEntryDialog.dialog;

        // Retrieve the current values for the id and current value
        var setting = template.setting.get();
        var currentValue = template.currentValue.get();

        // If currentValue input is undefined, prevent saving this setting
        if (currentValue === undefined) {
            return;
        }

        var viewportSetting = {
            id: setting,
            value: currentValue
        };

        // Obtain the active Viewport model from the Protocol and Stage
        var viewport = getActiveViewportModel();

        // Remove any old rules if the ID has been changes
        var originalSettingObject = Template.settingEntryDialog.settingObject;
        if (originalSettingObject && originalSettingObject.id) {
            delete viewport.viewportSettings[originalSettingObject.id];
        }

        // Update the active Viewport model' viewportSettings dictionary
        viewport.viewportSettings[viewportSetting.id] = viewportSetting.value;

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
        var dialog = Template.settingEntryDialog.dialog;
        closeHandler(dialog);  
    },
    /**
     * Allow Esc keydown events to close the dialog
     *
     * @param event The Keydown event details
     * @returns {boolean} Return false to prevent bubbling of the event
     */
    'keydown .settingEntryDialog': function(event) {
        var dialog = Template.settingEntryDialog.dialog;

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
    'change select.settings': function(event, template) {
        // Obtain the user-specified attribute to test against
        var settingId = $(event.currentTarget).val();

        // Store it in the ReactiveVar
        template.setting.set(settingId);

        // Retrieve the current value from the attribute
        var settingDetails = {
            options: []
        };
        if (settingId && HP.displaySettings[settingId]) {
            settingDetails = HP.displaySettings[settingId];
        } else if (settingId && HP.CustomViewportSettings[settingId]) {
            settingDetails = HP.CustomViewportSettings[settingId];
        }

        var dialog = Template.settingEntryDialog.dialog;
        var valueSelect = dialog.find('.currentValue');
        valueSelect.html('').select2({
            data: settingDetails.options,
            placeholder: 'Select a value',
            allowClear: true
        });

        // Update the ReactiveVar with the user-specified value
        if (settingDetails && settingDetails.defaultValue) {
            template.currentValue.set(settingDetails.defaultValue);
            valueSelect.val(settingDetails.defaultValue).trigger('change');
        }
    },
    /**
     * Update the currentValue ReactiveVar if the user changes the current value
     *
     * @param event The Change event for the input
     * @param template The current template context
     */
    'change select.currentValue': function(event, template) {
        // Get the current value of the select box
        var value = $(event.currentTarget).val();

        // Update the ReactiveVar with the user-specified value
        template.currentValue.set(value);
    }
});
