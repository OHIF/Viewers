// Maybe we should use regular StudyList collection?
StudyListSelectedStudies = new Meteor.Collection(null);
StudyListSelectedStudies._debugName = 'StudyListSelectedStudies';

function handleShiftClick(studyRow, data) {
    //log.info('shiftKey');
    var studyInstanceUid = studyRow.attr('studyInstanceUid');

    // Select all rows in between these two rows
    if (StudyList.previouslySelected) {
        var previous = $(StudyList.previouslySelected);
        var rowsInBetween;
        if (previous.index() < studyRow.index()) {
            // The previously selected row is above (lower index) the
            // currently selected row.

            // Fill in the rows upwards from the previously selected row
            rowsInBetween = previous.nextAll('tr');
        } else if (previous.index() > studyRow.index()) {
            // The previously selected row is below the currently
            // selected row.

            // Fill in the rows upwards from the previously selected row
            rowsInBetween = previous.prevAll('tr');
        } else {
            // The rows are the same, deselect the current row.
            // TODO: CHECK THIS, pretty sure this is the wrong behaviour
            StudyListSelectedStudies.remove({});
            StudyList.previouslySelected = undefined;
            return;
        }

        // Loop through the rows in between current and previous selected studies
        rowsInBetween.each(function() {
            var row = $(this);

            if (row.hasClass('active')) {
                // If we find one that is already selected, do nothing
                return;
            }

            // Get the relevant studyInstanceUid
            var studyInstanceUid = row.attr('studyInstanceUid');

            // Retrieve the data context through Blaze
            var data = Blaze.getData(this);

            // Set the current study as selected
            StudyListSelectedStudies.insert(data);
            row.addClass('active');

            // When we reach the currently clicked-on row, stop the loop
            return !row.is(studyRow);
        });
    } else {
        // Set the current study as selected
        StudyListSelectedStudies.insert(data);
        studyRow.addClass('active');
    }
}

function handleCtrlClick(studyRow, data) {
    //log.info('ctrlKey');
    var studyInstanceUid = studyRow.attr('studyInstanceUid');

    if (studyRow.hasClass('active')) {
        studyRow.removeClass('active');

        // Find the current studyInstanceUid in the stored list and remove it
        StudyListSelectedStudies.remove({
            studyInstanceUid: data.studyInstanceUid
        });
    } else {
        // Set the current study as selected
        StudyListSelectedStudies.insert(data);
        studyRow.addClass('active');

        // Set this as the previously selected row, so the user can
        // use Shift to select from this point onwards
        StudyList.previouslySelected = studyRow;
        log.info('StudyList PreviouslySelected set: ' + studyRow.index());
    }
}

Template.studylistStudy.onRendered(function() {
    var instance = this;
    var elem = instance.$('tr.studylistStudy').get(0);

    // Enable HammerJS to allow touch support
    var mc = new Hammer.Manager(elem);
    var doubleTapRecognizer = new Hammer.Tap({
        event: 'doubletap',
        taps: 2,
        interval: 500,
        threshold: 30,
        posThreshold: 30
    });

    mc.add(doubleTapRecognizer);
});

Template.studylistStudy.events({
    'click tr.studylistStudy': function(e) {
        var studyRow = $(e.currentTarget);
        var data = this;

        // Remove the ID so we can directly insert this into our client-side collection
        delete data._id;

        if (e.shiftKey) {
            handleShiftClick(studyRow, data);
        } else if (e.ctrlKey || e.metaKey) {
            handleCtrlClick(studyRow, data);
        } else {
            // Select a single study
            //log.info('Regular click');

            // Clear all selected studies
            StudyListSelectedStudies.remove({});
            $('tr.studylistStudy').removeClass('active');

            // Set the previous study to the currently clicked-on study
            StudyList.previouslySelected = studyRow;
            //log.info('StudyList PreviouslySelected set: ' + studyRow.index());

            // Set the current study as selected
            StudyListSelectedStudies.insert(data);
            studyRow.addClass('active');
        }
    },
    'mousedown tr.studylistStudy': function(e) {
        // This event handler is meant to handle middle-click on a study
        if (e.which !== 2) {
            return;
        }

        var data = this;
        var middleClickOnStudy = StudyList.callbacks.middleClickOnStudy;
        if (middleClickOnStudy && typeof middleClickOnStudy === 'function') {
            middleClickOnStudy(data);
        }
    },
    'dblclick tr.studylistStudy, doubletap tr.studylistStudy': function(e) {
        if (e.which !== undefined && e.which !== 1) {
            return;
        }

        var data = this;
        var dblClickOnStudy = StudyList.callbacks.dblClickOnStudy;

        if (dblClickOnStudy && typeof dblClickOnStudy === 'function') {
            dblClickOnStudy(data);
        }
    },
    'contextmenu tr.studylistStudy, press tr.studylistStudy': function(e, template) {
        $(e.currentTarget).addClass('active');

        if (openStudyContextMenu && typeof openStudyContextMenu === 'function') {
            e.preventDefault();

            openStudyContextMenu(e, template);
            return false;
        }
    }

});