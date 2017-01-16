import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

import { setFocusToActiveViewport } from './setFocusToActiveViewport';

let doneCallbackFunction;

/**
 * Removes the backdrop abd closes opened dialog
 * and focus to the active viewport. If a done callback is set, 
 * it's called before
 * @param  {Boolean} runCallback Indicate if callback function needs to be called. Default: true
 */
const closeHandler = (runCallback = true) => {
    // Check if callback function exists
    if (runCallback && typeof doneCallbackFunction === 'function') {
        doneCallbackFunction();
    }

    // Hide the lesion dialog
    $('#confirmDeleteDialog').css('display', 'none');

    // Remove the backdrop
    $('.removableBackdrop').remove();

    // Remove the callback
    doneCallbackFunction = undefined;

    // Restore the focus to the active viewport
    setFocusToActiveViewport();
};

/**
 * Displays the confirmation dialog template and the removable backdrop element
 *
 * @param doneCallback A callback
 * @param options
 */
const showConfirmDialog = (doneCallback, options) => {
    // Show the backdrop
    options = options || {};
    Blaze.renderWithData(Template.removableBackdrop, options, document.body);

    let confirmDeleteDialog = $('#confirmDeleteDialog');
    confirmDeleteDialog.remove();

    const viewer = document.getElementById('viewer');
    Blaze.renderWithData(Template.confirmDeleteDialog, options, viewer);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', () => {
        // Close dialog without calling callback
        closeHandler(false);
    });

    confirmDeleteDialog = $('#confirmDeleteDialog');
    confirmDeleteDialog.css('display', 'block');
    confirmDeleteDialog.focus();

    // If callback function is defined, save it for closeHandler
    if (doneCallback && typeof doneCallback === 'function') {
        doneCallbackFunction = doneCallback;
    }
};

const dialogUtils = {
    showConfirmDialog,
    closeHandler
};

export { dialogUtils };