import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
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
        visibility: 'hidden',
        position: 'fixed',
        'z-index': 10000,
    }).bounded().focus();

    // Postpone position change to allow boundaries restriction
    Meteor.defer(() => {
        $dropdownMenu.css({
            visibility: 'visible',
            left: `${event.clientX}px`,
            top: `${event.clientY}px`
        }).trigger('spatialChanged');
    });
};

/**
 * Exports all selected studies on the studylist
 */
function exportSelectedStudies($study, event) {
    const selectedStudies = OHIF.studylist.getSelectedStudies();
    const studiesCount = selectedStudies.length;
    const studyText = studiesCount > 1 ? 'Studies' : 'Study';

    OHIF.ui.showDialog('dialogConfirm', {
        element: event.element,
        title: `Export ${studyText}`,
        message: `Would you like to export ${studiesCount} ${studyText.toLowerCase()}?`
    }).then(() => {
        OHIF.studylist.exportStudies(selectedStudies);
    });
}

/**
 * Display series details of study in modal
 */
function viewSeriesDetails() {
    const selectedStudies = OHIF.studylist.getSelectedStudies();

    if (!selectedStudies) {
        return;
    }

    OHIF.ui.showDialog('seriesDetailsModal', { selectedStudies });
}

Template.studyContextMenu.events({
    'click a'(event, instance) {
        const $target = $(event.currentTarget);

        if ($target.hasClass('disabled')) {
            return;
        }

        const id = $target.attr('id');
        if (id in StudyList.functions) {
            const fn = StudyList.functions[id];
            if (typeof fn === 'function') {
                fn(Template.studyContextMenu.$study, event);
            }
        }
    }
});
