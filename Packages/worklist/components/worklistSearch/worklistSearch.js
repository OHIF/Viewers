// Retrieve all studies
search();

var studyDateFrom;
var studyDateTo;
var checkFrom = false;
var checkTo = false;

/**
 * Transforms an input string into a search filter for
 * the Worklist Search call
 *
 * @param filter The input string to be searched for
 * @returns {*}
 */
function getFilter(filter) {
    if(filter && filter.length && filter.substr(filter.length - 1) !== '*') {
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
function replaceUndefinedColumnValue (text) {
    if (text == undefined || text === "undefined") {
        return "";
    } else {
        return text;
    }
}

/**
 * Convert string to study date
 */
function convertStringToStudyDate (dateStr) {
    var y = dateStr.substring(0,4);
    var m = dateStr.substring(4,6);
    var d = dateStr.substring(6,8);
    var newDateStr = y+"/"+m+"/"+d;
    return new Date(newDateStr);
}

/**
 * Runs a search for studies matching the worklist query parameters
 * Inserts the identified studies into the Studies Collection
 */
function search() {
    // Create the filters to be used for the Worklist Search
    var filter = {
        patientName: getFilter($('#patientName').val()),
        patientId: getFilter($('#patientId').val()),
        accessionNumber: getFilter($('#patientAccessionNumber').val())
    };

    // Make sure that modality has a reasonable value, since it is occasionally
    // returned as 'undefined'
    var modality = replaceUndefinedColumnValue($('#modality').val());

    // Clear all current studies
    Studies.remove({});

    Meteor.call('WorklistSearch', filter, function(error, studies) {
        if (!studies) {
            return;
        }

        // Loop through all identified studies
        studies.forEach(function(study) {

            // Search the rest of the parameters that aren't done via the server call
            if(isIndexOf(study.modalities, modality) &&
                (new Date(studyDateFrom).setHours(0,0,0,0) <= convertStringToStudyDate(study.studyDate) || !checkFrom) &&
                (convertStringToStudyDate(study.studyDate) <= new Date(studyDateTo).setHours(0,0,0,0) || !checkTo)) {

                // Insert any matching studies into the Studies Collection
                Studies.insert(study);
            }
        });
    });

}

Template.worklistSearch.events({
    /**
     * Searches for studies given the current state of the form controls
     */
    'click button#btnSearch' :function(event) {
        studyDateFrom = $('#studyDateFrom').val();
        studyDateTo = $('#studyDateTo').val();
        checkFrom = $('#checkFrom').is(':checked');
        checkTo = $('#checkTo').is(':checked');
        search();
    },
    /**
     * Searches for studies with a study date equal to Today
     */
    'click button#btnToday' :function(event) {
        studyDateTo = new Date();
        studyDateFrom =  studyDateTo;
        checkFrom = true;
        checkTo = true;
        search();
    },

    /**
     * Searches for studies in the Last 7 Days
     */
    'click button#btnLastSevenDays' :function() {
        studyDateTo = new Date();
        studyDateFrom =  new Date();
        studyDateFrom.setDate(studyDateFrom.getDate()-7);
        checkFrom = true;
        checkTo = true;
        search();
    },
    /**
     * Clears all input data in the study search panel
     */
    'click button#btnClear' :function(event) {
        $("#searchPanel .form-control").val("");
        $('#checkFrom').prop('checked', false);
        $('#checkTo').prop('checked', false);
    }
});