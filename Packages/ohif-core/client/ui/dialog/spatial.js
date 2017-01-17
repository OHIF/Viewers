import { OHIF } from 'meteor/ohif:core';

OHIF.ui.repositionDialog = ($modal, x, y) => {
    const $dialog = $modal.find('.modal-dialog');

    // Remove the margins and set its position as fixed
    $dialog.css({
        margin: 0,
        position: 'fixed'
    }).bounded();

    // Temporarily show the modal
    const isVisible = $modal.is(':visible');
    $modal.show();

    // Calculate the center position on screen
    const height = $dialog.outerHeight();
    const width = $dialog.outerWidth();
    const left = parseInt(x - (width / 2));
    const top = parseInt(y - (height / 2));

    // Reposition the modal and readjust it to the window boundaries if needed
    $dialog.css({
        left,
        top
    }).trigger('spatialChanged').one('transitionend', () => $dialog.trigger('spatialChanged'));

    // Switch the modal to its previous visibility state
    $modal.toggle(isVisible);
};
