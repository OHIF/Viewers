import { Blaze } from 'meteor/blaze';
import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';

import { Viewerbase } from 'meteor/ohif:viewerbase';

const keys = {
    ESC: 27,
    ENTER: 13
};

/**
 * Close the specified dialog element and returns the browser
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
 * Displays and updates the UI of the Text Entry Dialog given a new title,
 * instructions, and doneCallback
 *
 * @param title Title of the dialog box
 * @param instructions Instructions to display to the user
 * @param doneCallback Function to execute when the dialog has been closed
 */
openTextEntryDialog = function(title, instructions, currentValue, doneCallback) {
    // Get the lesion location dialog
    var dialog = $('.textEntryDialog');

    // Clear any input that is still on the page
    var currentValueInput = dialog.find('input.currentValue');
    currentValueInput.val(currentValue);

    // Store the Dialog DOM data, rule level and rule in the template data
    Template.textEntryDialog.dialog = dialog;
    Template.textEntryDialog.title = title;
    Template.textEntryDialog.instructions = instructions;
    Template.textEntryDialog.doneCallback = doneCallback;

    dialog.find('.title').html(title);
    dialog.find('.instructions').html(instructions);

    // Update the dialog's CSS so that it is visible on the page
    dialog.css('display', 'block');

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });
};

Template.textEntryDialog.onRendered(() => {
    const instance = Template.instance();
    const dialog = instance.$('.settingEntryDialog');
    dialog.draggable();
});

Template.textEntryDialog.events({
    /**
     * Save the user-specified text
     *
     */
    'click .save': function() {
        // Retrieve the input properties to the template
        var dialog = Template.textEntryDialog.dialog;
        var currentValue = dialog.find('input.currentValue').val();

        // If currentValue input is undefined, prevent saving this rule
        if (currentValue === undefined) {
            return;
        }

        var doneCallback = Template.textEntryDialog.doneCallback;
        if (doneCallback) {
            doneCallback(currentValue);
        }

        // Close the dialog
        closeHandler(Template.textEntryDialog.dialog);
    },
    /**
     * Allow the user to click the Cancel button to close the dialog
     */
    'click .cancel': function() {
        closeHandler(Template.textEntryDialog.dialog);
    },
    /**
     * Allow Esc keydown events to close the dialog
     *
     * @param event The Keydown event details
     * @returns {boolean} Return false to prevent bubbling of the event
     */
    'keydown .textEntryDialog': function(event) {
        var dialog = Template.textEntryDialog.dialog;

        // If Esc key is pressed, close the dialog
        if (event.which === keys.ESC) {
            closeHandler(dialog);
            return false;
        } else if (event.which === keys.ENTER) {
            var currentValue = dialog.find('input.currentValue').val();

            // If currentValue input is undefined, prevent saving this rule
            if (currentValue === undefined) {
                return;
            }

            var doneCallback = Template.textEntryDialog.doneCallback;
            if (doneCallback) {
                doneCallback(currentValue);
            }

            closeHandler(dialog);
            return false;
        }
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

        // Update the template data with the current value
        Template.textEntryDialog.currentValue = input.val();
    }
});
