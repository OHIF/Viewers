function closeHandler(dialog) {
    // Hide the dialog
    $(dialog).css('display', 'none');

    // Remove the backdrop
    $('.removableBackdrop').remove();
}

/**
 * This function is used inside the Worklist package to define a right click callback
 *
 * @param e
 * @param template
 */
openStudyContextMenu = function(e, template) {
    var study = $(e.currentTarget);
    Template.studyContextMenu.study = study;

    var dialog = $('#studyContextMenu');

    // Show the nonTargetLesion dialog above
    var dialogProperty = {
        display: 'block'
    };

    // Device is touch device or not
    // If device is touch device, set position center of screen vertically and horizontally
    if (isTouchDevice()) {
        // add dialogMobile class to provide a black, transparent background
        dialog.addClass('dialogMobile');
        dialogProperty.top = 0;
        dialogProperty.left = 0;
        dialogProperty.right = 0;
        dialogProperty.bottom = 0;
    } else {
        dialogProperty.top = e.pageY;// - dialog.outerHeight() - 40;
        dialogProperty.left = e.pageX;// - dialog.outerWidth() / 2;

        var pageHeight = $(window).height();
        dialogProperty.top = Math.max(dialogProperty.top, 0);
        dialogProperty.top = Math.min(dialogProperty.top, pageHeight - dialog.outerHeight());

        var pageWidth = $(window).width();
        dialogProperty.left = Math.max(dialogProperty.left, 0);
        dialogProperty.left = Math.min(dialogProperty.left, pageWidth - dialog.outerWidth());
    }

    dialog.css(dialogProperty);
    dialog.focus();

    log.info(e);
    log.info(template);

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });
};

// Temporary for now
functionList = {};

Template.studyContextMenu.events({
    'click a': function(e) {
        var study = Template.studyContextMenu.study;
        var id = $(e.currentTarget).attr('id');

        var fn = functionList[id];
        if (fn && typeof(fn) === 'function') {
            fn(study);
        }

        var dialog = $('#studyContextMenu');
        closeHandler(dialog);
    }
});
