Template.worklistResult.helpers({
    /**
     * Returns a sorted instance of the WorklistStudies Collection
     * by Patient name and Study Date in Ascending order.
     */
    studies: function() {
        return WorklistStudies.find({}, {
            sort: {
                patientName: 1,
                studyDate: 1
            }
        });
    }
});

// Retrieve all studies
search();

var studyDateFrom;
var studyDateTo;
var checkFrom = false;
var checkTo = false;
var filter;

/**
 * Transforms an input string into a search filter for
 * the Worklist Search call
 *
 * @param filter The input string to be searched for
 * @returns {*}
 */
function getFilter(filter) {
    if (filter && filter.length && filter.substr(filter.length - 1) !== '*') {
        filter += '*';
    }

    return filter;
}

/**
 * Search for a value in a string
 */
function isIndexOf(mainVal, searchVal) {
    if (mainVal === undefined || mainVal === '' || mainVal.indexOf(searchVal) > -1){
        return true;
    }

    return false;
}

/**
 * Replace object if undefined
 */
function replaceUndefinedColumnValue(text) {
    if (text === undefined || text === 'undefined') {
        return '';
    } else {
        return text;
    }
}

/**
 * Convert string to study date
 */
function convertStringToStudyDate(dateStr) {
    var y = dateStr.substring(0, 4);
    var m = dateStr.substring(4, 6);
    var d = dateStr.substring(6, 8);
    var newDateStr = y + '/' + m + '/' + d;
    return new Date(newDateStr);
}

/**
 * Runs a search for studies matching the worklist query parameters
 * Inserts the identified studies into the WorklistStudies Collection
 */
function search() {
    // Create the filters to be used for the Worklist Search
    filter = {
        patientName: getFilter($('input#patientName').val()),
        patientId: getFilter($('input#patientId').val()),
        accessionNumber: getFilter($('input#accessionNumber').val()),
        studyDescription: getFilter($('input#studyDescription').val())
    };

    // Make sure that modality has a reasonable value, since it is occasionally
    // returned as 'undefined'
    var modality = replaceUndefinedColumnValue($('input#modality').val());

    // Clear all current studies
    WorklistStudies.remove({});

    Meteor.call('WorklistSearch', filter, function(error, studies) {
        if (error) {
            log.warn(error);
            return;
        }

        if (!studies) {
            return;
        }

        // Loop through all identified studies
        studies.forEach(function(study) {

            // Search the rest of the parameters that aren't done via the server call
            if (isIndexOf(study.modalities, modality) &&
                (new Date(studyDateFrom).setHours(0, 0, 0, 0) <= convertStringToStudyDate(study.studyDate) || !checkFrom) &&
                (convertStringToStudyDate(study.studyDate) <= new Date(studyDateTo).setHours(0, 0, 0, 0) || !checkTo)) {

                // Insert any matching studies into the WorklistStudies Collection
                WorklistStudies.insert(study);
            }
        });
    });
}

Template.worklistResult.onCreated(function() {
    var self = this;
    if (Worklist.subscriptions) {
        Worklist.subscriptions.forEach(function(collectionName) {
            self.subscribe(collectionName);
        });
    }
});

Template.worklistResult.events({
    'keydown input': function(e) {
        if (e.which === 13) { //  Enter
            search();
        }
    },
    'onsearch input': function() {
        search();
    }
});

