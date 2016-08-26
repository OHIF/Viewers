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
 */
openStudyContextMenu = function(e) {
    Worklist.functions['exportSelectedStudies'] = exportSelectedStudies;
    Worklist.functions['viewSeriesDetails'] = viewSeriesDetails;


    Template.studyContextMenu.study = $(e.currentTarget);

    var dialog = $('#studyContextMenu');

    // Show the nonTargetLesion dialog above
    var dialogProperty = {
        display: 'block'
    };

    var pageHeight = $(document).height();
    dialogProperty.top = Math.max(e.pageY, 0);
    dialogProperty.top = Math.min(dialogProperty.top, pageHeight - dialog.outerHeight());

    var pageWidth = $(document).width();
    dialogProperty.left = Math.max(e.pageX, 0);
    dialogProperty.left = Math.min(dialogProperty.left, pageWidth - dialog.outerWidth());

    // Device is touch device or not
    // If device is touch device, set position center of screen vertically and horizontally
    if (isTouchDevice()) {
        // add dialogMobile class to provide a black, transparent background
        dialog.addClass('dialogMobile');
        dialogProperty.top = 0;
        dialogProperty.left = 0;
        dialogProperty.right = 0;
        dialogProperty.bottom = 0;
        dialogProperty.margin = 'auto';
    }

    dialog.css(dialogProperty);
    dialog.focus();

    // Show the backdrop
    UI.render(Template.removableBackdrop, document.body);

    // Make sure the context menu is closed when the user clicks away
    $('.removableBackdrop').one('mousedown touchstart', function() {
        closeHandler(dialog);
    });
};

/**
 * Exports all selected studies on the worklist
 */
function exportSelectedStudies() {
    var selectedStudies = WorklistSelectedStudies.find({}, {
            sort: {
                studyDate: 1
            }
        }).fetch() || [];

    exportStudies(selectedStudies);
}

/**
 * Display series details of study in modal
 */
function viewSeriesDetails() {
    var selectedStudies = WorklistSelectedStudies.find({}, {
        sort: {
            studyDate: 1
        }
    }).fetch();

    if (!selectedStudies) {
        return;
    }

    Modal.show('viewSeriesDetailsModal', {
        selectedStudies: selectedStudies
    });
}

Template.studyContextMenu.events({
    'click a': function(e) {
        var study = Template.studyContextMenu.study;
        var id = $(e.currentTarget).attr('id');

        var fn = Worklist.functions[id];
        if (fn && typeof(fn) === 'function') {
            fn(study);
        }

        var dialog = $('#studyContextMenu');
        closeHandler(dialog);
    }
});

Template.studyContextMenu.helpers({
    'studyListFunctionsEnabled': function() {
        var studyListFunctionsEnabled = Meteor.settings && Meteor.settings.public && Meteor.settings.public.ui &&
            Meteor.settings.public.ui.studyListFunctionsEnabled || false;        return studyListFunctionsEnabled;
    }
});