Session.setDefault('showLoadingText', true);

Template.worklistResult.helpers({
    /**
     * Returns a sorted instance of the WorklistStudies Collection
     * by Patient name and Study Date in Ascending order.
     */
    studies() {
        const instance = Template.instance();
        let studies;
        let sortOption = {
            patientName: 1,
            studyDate: 1
        };

        // Update sort option if session is defined
        if (Session.get('sortOption')) {
            sortOption = Session.get('sortOption');
        }

        // Pagination parameters
        const rowsPerPage = instance.rowsPerPage.get();
        const currentPage = instance.currentPage.get();
        const offset = rowsPerPage * currentPage;
        const limit = offset + rowsPerPage;

        studies = WorklistStudies.find({}, {
            sort: sortOption
        }).fetch();

        if (!studies) {
            return;
        }

        // Update record count
        instance.recordCount.set(studies.length);

        // Limit studies
        return studies.slice(offset, limit);
    },

    numberOfStudies() {
        return WorklistStudies.find().count();
    },

    sortingColumnsIcons() {
        const instance = Template.instance();
        
        let sortingColumnsIcons = {};
        Object.keys(instance.sortingColumns.keys).forEach(key => {
            const value = instance.sortingColumns.get(key);

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
    const y = dateStr.substring(0, 4);
    const m = dateStr.substring(4, 6);
    const d = dateStr.substring(6, 8);
    const newDateStr = m + '/' + d + '/' + y;
    return new Date(newDateStr);
}

/**
 * Runs a search for studies matching the worklist query parameters
 * Inserts the identified studies into the WorklistStudies Collection
 */
function search() {
    console.log('search()');

    // Show loading message
    Session.set('showLoadingText', true);

    // Create the filters to be used for the Worklist Search
    filter = {
        patientName: getFilter($('input#patientName').val()),
        patientId: getFilter($('input#patientId').val()),
        accessionNumber: getFilter($('input#accessionNumber').val()),
        studyDescription: getFilter($('input#studyDescription').val()),
        studyDateFrom: studyDateFrom,
        studyDateTo: studyDateTo
    };

    // Make sure that modality has a reasonable value, since it is occasionally
    // returned as 'undefined'
    const modality = replaceUndefinedColumnValue($('input#modality').val());

    // Clear all current studies
    WorklistStudies.remove({});

    Meteor.call('WorklistSearch', filter, (error, studies) => {
        console.log('WorklistSearch');
        if (error) {
            log.warn(error);
            return;
        }

        // Hide loading text
        Session.set('showLoadingText', false);

        if (!studies) {
            return;
        }

        // Loop through all identified studies
        studies.forEach(study => {
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
    });
}

Template.worklistResult.onCreated(() => {
    let instance = Template.instance();
    instance.sortOption = new ReactiveVar();
    instance.sortingColumns = new ReactiveDict();

    // Pagination parameters

    // Rows per page is 25 as default
    instance.rowsPerPage = new ReactiveVar(25);

    // Set currentPage indexed 0
    instance.currentPage = new ReactiveVar(0);
    instance.recordCount = new ReactiveVar();

    // Set sortOption
    const sortOptionSession = Session.get('sortOption');
    if (sortOptionSession) {
        instance.sortingColumns.set(sortOptionSession);
    } else {
        instance.sortingColumns.set({
            patientName: 1,
            studyDate: 1,
            patientId: 0,
            accessionNumber: 0,
            studyDescription: 0,
            modality: 0,
            numberOfStudyRelatedInstances: 0
        });
    }

    if (Worklist.subscriptions) {
        Worklist.subscriptions.forEach(collectionName => {
            instance.subscribe(collectionName);
        });
    }
});

Template.worklistResult.onRendered(() => {
    const instance = Template.instance();

    // Initialize daterangepicker
    instance.$('#studyDate').daterangepicker({
        ranges: {
            Today: [moment(), moment()],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()]
        }
    });

    // Retrieve all studies
    search();
});

function resetSortingColumns(instance, sortingColumn) {
    Object.keys(instance.sortingColumns.keys).forEach(key => {
        if (key !== sortingColumn) {
            instance.sortingColumns.set(key, null);
        }
    });
}

Template.worklistResult.events({
    'keydown input'(event) {
        if (event.which === 13) { //  Enter
            search();
        }
    },

    'onsearch input'() {
        search();
    },

    'change #studyDate'(event) {
        let dateRange = $(event.currentTarget).val();
        
        // Remove all space chars
        dateRange = dateRange.replace(/ /g, '');

        // Split dateRange into subdates
        const dates = dateRange.split('-');
        studyDateFrom = dates[0];
        studyDateTo = dates[1];

        if (dateRange !== '') {
            search();
        }
    },

    'click div.sortingCell'(event, instance) {
        const elementId = event.currentTarget.id;

        // Remove _ from id
        const columnName = elementId.replace('_', '');

        let sortOption = {};
        resetSortingColumns(instance, columnName);

        const columnObject = instance.sortingColumns.get(columnName);
        if (columnObject) {
            instance.sortingColumns.set(columnName, columnObject * -1);
            sortOption[columnName] = columnObject * -1;
        } else {
            instance.sortingColumns.set(columnName, 1);
            sortOption[columnName] = 1;
        }

        instance.sortOption.set(sortOption);
        Session.set('sortOption', sortOption);
    }
});

