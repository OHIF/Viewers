Session.setDefault('searchResults', {
    showLoadingText: true,
    showNotFoundMessage: false
});

Template.worklistResult.helpers({
    /**
     * Returns a sorted instance of the WorklistStudies Collection
     * by Patient name and Study Date in Ascending order.
     */
    studies: function() {
        var sortOption = Session.get('sortOption');
        if (sortOption) {
            return WorklistStudies.find({}, {
                sort: sortOption
            });
        }

        return WorklistStudies.find({}, {
            sort: {
                patientName: 1,
                studyDate: 1
            }
        });
    },

    showLoadingText: function() {
        return Session.get('searchResults').showLoadingText;
    },

    showNotFoundMessage: function() {
        return Session.get('searchResults').showNotFoundMessage;
    },

    sortingColumnsIcons: function() {
        var sortingColumnsIcons = {};
        Object.keys(Template.instance().sortingColumns.keys).forEach(function(key) {
            var value = Template.instance().sortingColumns.get(key);

            if (value === 1) {
                sortingColumnsIcons[key] = 'fa fa-fw fa-sort-up';
            } else if (value === -1) {
                sortingColumnsIcons[key] = 'fa fa-fw fa-sort-down';
            } else {
                // fa-fw is blank
                sortingColumnsIcons[key] = 'fa fa-fw';
            }
        });
        return sortingColumnsIcons;
    }
});

// Retrieve all studies
search();

var studyDateFrom;
var studyDateTo;
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
        return text.toUpperCase();
    }
}

/**


/**
 * Convert string to study date
 */
function convertStringToStudyDate(dateStr) {
    var y = dateStr.substring(0, 4);
    var m = dateStr.substring(4, 6);
    var d = dateStr.substring(6, 8);
    var newDateStr = m + '/' + d + '/' + y;
    return new Date(newDateStr);
}

/**
 * Runs a search for studies matching the worklist query parameters
 * Inserts the identified studies into the WorklistStudies Collection
 */
function search() {
    // Show loading message
    var searchResults = Session.get('searchResults');
    searchResults.showLoadingText = true;
    searchResults.showNotFoundMessage = false;
    Session.set('searchResults', searchResults);

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

        // Hide loading text
        searchResults.showLoadingText = false;
        Session.set('searchResults', searchResults);

        if (!studies) {
            return;
        }

        // Loop through all identified studies
        studies.forEach(function(study) {
            // Search the rest of the parameters that aren't done via the server call
            if (isIndexOf(study.modalities, modality) &&
                (new Date(studyDateFrom).setHours(0, 0, 0, 0) <= convertStringToStudyDate(study.studyDate) || !studyDateFrom || studyDateFrom === '') &&
                (convertStringToStudyDate(study.studyDate) <= new Date(studyDateTo).setHours(0, 0, 0, 0) || !studyDateTo || studyDateTo === '')) {

                // Convert numberOfStudyRelatedInstance string into integer
                study.numberOfStudyRelatedInstances = parseInt(study.numberOfStudyRelatedInstances);

                // Insert any matching studies into the WorklistStudies Collection
                WorklistStudies.insert(study);
            }
        });

        if (WorklistStudies.find().count() === 0) {
            // Show studyNotFound text
            searchResults.showNotFoundMessage = true;
            Session.set('searchResults', searchResults);
        }

    });
}

Template.worklistResult.onCreated(function() {
    this.sortOption = new ReactiveVar();
    this.sortingColumns = new ReactiveDict();
    // Set sortOption
    var sortOptionSession = Session.get('sortOption');
    if (sortOptionSession) {
        this.sortingColumns.set(sortOptionSession);
    } else {
        this.sortingColumns.set('patientName', 1);
        this.sortingColumns.set('studyDate', 1);
        this.sortingColumns.set('patientId', 0);
        this.sortingColumns.set('accessionNumber', 0);
        this.sortingColumns.set('studyDescription', 0);
        this.sortingColumns.set('modality', 0);
        this.sortingColumns.set('numberOfStudyRelatedInstances', 0);
    }

    var self = this;
    if (Worklist.subscriptions) {
        Worklist.subscriptions.forEach(function(collectionName) {
            self.subscribe(collectionName);
        });
    }
});

Template.worklistResult.onRendered(function() {
    // Initialize daterangepicker
    $('#studyDate').daterangepicker({
        ranges: {
            Today: [moment(), moment()],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()]
        }
    });
});

function resetSortingColumns(template, sortingColumn) {
    Object.keys(template.sortingColumns.keys).forEach(function(key) {
        if (key !== sortingColumn) {
            template.sortingColumns.set(key, null);
        }
    });
}

Template.worklistResult.events({
    'keydown input': function(e) {
        if (e.which === 13) { //  Enter
            search();
        }
    },
    'onsearch input': function() {
        search();
    },
    'change #studyDate': function(e, template) {
        var dateRange = $(e.currentTarget).val();
        // Remove all space chars
        dateRange = dateRange.replace(/ /g, '');
        // Split dateRange into subdates
        var dates = dateRange.split('-');
        studyDateFrom = dates[0];
        studyDateTo = dates[1];

        if (dateRange !== '') {
            search();
        }
    },
    'click div.sortingCell': function(e, template) {
        var elementId = e.currentTarget.id;
        // Remove _ from id
        var columnName = elementId.replace('_', '');

        var sortOption = {};
        resetSortingColumns(template, columnName);
        var columnObject = template.sortingColumns.get(columnName);
        if (columnObject) {
            template.sortingColumns.set(columnName, columnObject * -1);
            sortOption[columnName] = columnObject * -1;
        } else {
            template.sortingColumns.set(columnName, 1);
            sortOption[columnName] = 1;
        }

        template.sortOption.set(sortOption);
        Session.set('sortOption', sortOption);
    }
});

