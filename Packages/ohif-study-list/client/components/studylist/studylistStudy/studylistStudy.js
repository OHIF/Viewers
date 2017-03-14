import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { OHIF } from 'meteor/ohif:core';

// Maybe we should use regular StudyList collection?
StudyListSelectedStudies = new Meteor.Collection(null);
StudyListSelectedStudies._debugName = 'StudyListSelectedStudies';

function isStudySelected(study) {
    // Search StudyListSelectedStudies for given study and return true if found
    let count = StudyListSelectedStudies.find({
        studyInstanceUid: study.studyInstanceUid
    }).count();
    return count > 0;
}

function doClearStudySelections() {
    // Clear all selected studies
    StudyListSelectedStudies.remove({});
    $('tr.studylistStudy').removeClass('active');
}

function doSelectRow(studyRow, data) {
    // Insert current study into selection list if it's not there already...
    if (!isStudySelected(data)) {
        StudyListSelectedStudies.insert(data);
    }
    // Make sure the study row has "active" class
    studyRow.addClass('active');
    // Set this as the previously selected row, so the user can
    // use Shift to select from this point onwards
    StudyList.previouslySelected = studyRow;
}

function doSelectSingleRow(studyRow, data) {
    // Clear all selected studies
    doClearStudySelections();
    // ... And add selected row to selection list
    doSelectRow(studyRow, data);
}

function doUnselectRow(studyRow, data) {
    // Find the current studyInstanceUid in the stored list and remove it
    StudyListSelectedStudies.remove({
        studyInstanceUid: data.studyInstanceUid
    });
    studyRow.removeClass('active');
}

function handleShiftClick($studyRow, data) {
    //OHIF.log.info('shiftKey');

    let study, previous = StudyList.previouslySelected ? $(StudyList.previouslySelected) : null;
    if (previous && previous.length > 0) {
        study = Blaze.getData(previous.get(0));
        if (!isStudySelected(study)) {
            previous = void 0; // undefined
            StudyList.previouslySelected = previous;
        }
    }

    // Select all rows in between these two rows
    if (previous) {
        let $rowsInBetween;
        if (previous.index() < $studyRow.index()) {
            // The previously selected row is above (lower index) the
            // currently selected row.

            // Fill in the rows upwards from the previously selected row
            $rowsInBetween = previous.nextAll('tr');
        } else if (previous.index() > $studyRow.index()) {
            // The previously selected row is below the currently
            // selected row.

            // Fill in the rows upwards from the previously selected row
            $rowsInBetween = previous.prevAll('tr');
        } else {
            // nothing to do since previous.index() === $studyRow.index()
            // the user is shift-clicking the same row...
            return;
        }

        // Loop through the rows in between current and previous selected studies
        $rowsInBetween.forEach(row => {
            const $row = $(row);

            if ($row.hasClass('active')) {
                // If we find one that is already selected, do nothing
                return;
            }

            // Get the relevant studyInstanceUid
            let studyInstanceUid = $row.attr('studyInstanceUid');

            // Retrieve the data context through Blaze
            let data = Blaze.getData(this);

            // Set the current study as selected
            doSelectRow($row, data);

            // When we reach the currently clicked-on $row, stop the loop
            return !$row.is($studyRow);
        });
    } else {
        // Set the current study as selected
        doSelectSingleRow($studyRow, data);
    }
}

function handleCtrlClick(studyRow, data) {
    //OHIF.log.info('ctrlKey');
    if (isStudySelected(data)) {
        doUnselectRow(studyRow, data);
    } else {
        doSelectRow(studyRow, data);
        OHIF.log.info('StudyList PreviouslySelected set: ' + studyRow.index());
    }
}

Template.studylistStudy.onRendered(function() {
    let instance = this,
        data = instance.data,
        row = instance.$('tr.studylistStudy').first();

    // Enable HammerJS to allow touch support
    let mc = new Hammer.Manager(row.get(0)),
        doubleTapRecognizer = new Hammer.Tap({
            event: 'doubletap',
            taps: 2,
            interval: 500,
            threshold: 30,
            posThreshold: 30
        });
    mc.add(doubleTapRecognizer);

    // Check if current row has been previously selected
    if (isStudySelected(data)) {
        doSelectRow(row, data);
    }

});

Template.studylistStudy.events({
    'click tr.studylistStudy'(event, instance) {
        const $studyRow = $(event.currentTarget);
        const data = instance.data;

        // Remove the ID so we can directly insert this into our client-side collection
        delete data._id;

        if (event.shiftKey) {
            handleShiftClick($studyRow, data);
        } else if (event.ctrlKey || event.metaKey) {
            handleCtrlClick($studyRow, data);
        } else {
            doSelectSingleRow($studyRow, data);
        }
    },

    'mousedown tr.studylistStudy'(event, instance) {
        // This event handler is meant to handle middle-click on a study
        if (event.which !== 2) {
            return;
        }

        const middleClickOnStudy = StudyList.callbacks.middleClickOnStudy;
        if (middleClickOnStudy && typeof middleClickOnStudy === 'function') {
            middleClickOnStudy(instance.data);
        }
    },

    'dblclick tr.studylistStudy, doubletap tr.studylistStudy'(event, instance) {
        if (event.which !== undefined && event.which !== 1) {
            return;
        }

        const dblClickOnStudy = StudyList.callbacks.dblClickOnStudy;

        if (dblClickOnStudy && typeof dblClickOnStudy === 'function') {
            dblClickOnStudy(instance.data);
        }
    },

    'contextmenu tr.studylistStudy, press tr.studylistStudy'(event, instance) {
        const $studyRow = $(event.currentTarget);

        if (!isStudySelected(instance.data)) {
            doSelectSingleRow($studyRow, instance.data);
        }

        event.preventDefault();
        OHIF.ui.showDropdown(OHIF.studylist.dropdown.getItems(), {
            event,
            menuClasses: 'dropdown-menu-left'
        });
        return false;
    }
});
