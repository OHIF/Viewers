import { OHIF } from 'meteor/ohif:core';
import { $ } from 'meteor/jquery';

/**
 * This function is used inside the StudyList package to define a right click callback
 *
 * @param event
 */
openStudyContextMenu = event => {
    if (!OHIF.uiSettings.studyListFunctionsEnabled) {
        return;
    }

    StudyList.functions.exportSelectedStudies = exportSelectedStudies;
    StudyList.functions.viewSeriesDetails = viewSeriesDetails;

    Template.studyContextMenu.$study = $(event.currentTarget);

    const dropdown = OHIF.ui.showFormDropdown('studyContextMenu');
    const $dropdown = $(dropdown);
    const $dropdownMenu = $dropdown.children('.dropdown-menu');

    dropdown.oncontextmenu = () => false;

    $dropdownMenu.css({
        position: 'fixed',
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
        'z-index': 10000
    }).bounded().focus();
};

/**
 * Exports all selected studies on the studylist
 */
function exportSelectedStudies() {
    const selectedStudies = OHIF.studylist.getSelectedStudies();

    OHIF.studylist.exportStudies(selectedStudies);
}

/**
 * Display series details of study in modal
 */
function viewSeriesDetails() {
    const selectedStudies = OHIF.studylist.getSelectedStudies();

    if (!selectedStudies) {
        return;
    }

    Modal.show('viewSeriesDetailsModal', {
        selectedStudies: selectedStudies
    });
}

Template.studyContextMenu.events({
    'click a': function(e) {
        var id, fn, target = $(e.currentTarget);

        if (target.hasClass('disabled')) {
            return;
        }

        id = target.attr('id');
        if (id in StudyList.functions) {
            fn = StudyList.functions[id];
            if (typeof fn === 'function') {
                fn(Template.studyContextMenu.$study);
            }
        }

        var dialog = $('#studyContextMenu');
    }
});
