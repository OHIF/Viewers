import { Blaze } from 'meteor/blaze';

import { toolManager } from './toolManager';
import { viewportUtils } from './viewportUtils';

const changeTextCallback = (data, eventData, doneChangingTextCallback) => {
    // This handles the double-click/long-press event on Spine text marker labels
    const keyPressHandler = e => {
        // If Enter or Esc are pressed, close the dialog
        if (e.which === 13 || e.which === 27) {
            closeHandler();
        }
    };

    // Deactivate textMarker tool after editing a spine label & if spine is not active tool
    const deactivateAfterEdit = () => {
        if (toolManager.getActiveTool() !== 'spine') {
            const element = viewportUtils.getActiveViewportElement();
            cornerstoneTools.textMarker.deactivate(element, 1);
        }
    };

    const closeHandler = () => {
        dialog.get(0).close();
        doneChangingTextCallback(data, select.val());
        deactivateAfterEdit();
        // Reset the focus to the active viewport element
        // This makes the mobile Safari keyboard close
        const element = viewportUtils.getActiveViewportElement();
        $(element).focus();
    };

    const dialog = $('#textMarkerRelabelDialog');

    // Is necessary to use Blaze object to not create 
    // circular depencency with helper object (./helpers)
    if (Blaze._globalHelpers.isTouchDevice()) {
        // Center the dialog on screen on touch devices
        dialog.css({
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 'auto'
        });
        dialog.find('.dialog.arrow').hide();
    } else {
        // Place the dialog above the tool that is being relabelled
        // TODO = Switch this to the tool coordinates, but put back into
        // page coordinates.
        dialog.css({
            top: eventData.currentPoints.page.y - dialog.outerHeight() - 20,
            left: eventData.currentPoints.page.x - dialog.outerWidth() / 2
        });
        dialog.find('.dialog.arrow').show();
    }

    const select = dialog.find('.relabelSelect');
    const confirm = dialog.find('.relabelConfirm');
    const remove = dialog.find('.relabelRemove');

    // If the remove button is clicked, delete this marker
    remove.off('click');
    remove.on('click', () => {
        dialog.get(0).close();
        doneChangingTextCallback(data, undefined, true);
        deactivateAfterEdit();
    });

    dialog.get(0).showModal();
    $('.relabelSelect').val(data.text).trigger('change'); //Update selector to the current

    confirm.off('click');
    confirm.on('click', () => {
        closeHandler();
    });

    // Use keydown since keypress doesn't handle ESC in Chrome
    dialog.off('keydown');
    dialog.on('keydown', keyPressHandler);
};

const textMarkerUtils = {
    changeTextCallback
};

export { textMarkerUtils };