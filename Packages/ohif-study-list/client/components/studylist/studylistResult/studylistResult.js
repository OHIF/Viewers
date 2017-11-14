import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { moment } from 'meteor/momentjs:moment';
import { OHIF } from 'meteor/ohif:core';

Session.setDefault('showLoadingText', true);
Session.setDefault('serverError', false);

Template.studylistResult.helpers({
    /**
     * Returns a ascending sorted instance of the Studies Collection by Patient name and Study Date
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
        const rowsPerPage = instance.paginationData.rowsPerPage.get();
        const currentPage = instance.paginationData.currentPage.get();
        const offset = rowsPerPage * currentPage;
        const limit = offset + rowsPerPage;

        studies = OHIF.studylist.collections.Studies.find({}, {
            sort: sortOption
        }).fetch();

        if (!studies) {
            return;
        }

        // Update record count
        instance.paginationData.recordCount.set(studies.length);

        // Limit studies
        return studies.slice(offset, limit);
    },

    numberOfStudies() {
        return OHIF.studylist.collections.Studies.find().count();
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

let studyDateFrom;
let studyDateTo;
let filter;

/**
 * Transforms an input string into a search filter for
 * the StudyList Search call
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
 * Runs a search for studies matching the studylist query parameters
 * Inserts the identified studies into the Studies Collection
 */
function search() {
    OHIF.log.info('search()');

    // Show loading message
    Session.set('showLoadingText', true);

    // Hiding error message
    Session.set('serverError', false);

    // Create the filters to be used for the StudyList Search
    filter = {
        patientName: getFilter($('input#patientName').val()),
        patientId: getFilter($('input#patientId').val()),
        accessionNumber: getFilter($('input#accessionNumber').val()),
        studyDescription: getFilter($('input#studyDescription').val()),
        studyDateFrom,
        studyDateTo,
        modalitiesInStudy: $('input#modality').val() ? $('input#modality').val() : ''
    };

    // Make sure that modality has a reasonable value, since it is occasionally
    // returned as 'undefined'
    const modality = replaceUndefinedColumnValue($('input#modality').val());

    // Clear all current studies
    OHIF.studylist.collections.Studies.remove({});

    Meteor.call('StudyListSearch', filter, (error, studies) => {
        OHIF.log.info('StudyListSearch');
        // Hide loading text

        Session.set('showLoadingText', false);

        if (error) {
            Session.set('serverError', true);

            const errorType = error.error;

            if (errorType === 'server-connection-error') {
                OHIF.log.error('There was an error connecting to the DICOM server, please verify if it is up and running.');
            } else if (errorType === 'server-internal-error') {
                OHIF.log.error('There was an internal error with the DICOM server');
            } else {
                OHIF.log.error('For some reason we could not list the studies.')
            }

            OHIF.log.error(error.stack);
            return;
        }

        if (!studies) {
            OHIF.log.warn('No studies found');
            return;
        }

        // Loop through all identified studies
        studies.forEach(study => {
            // Search the rest of the parameters that aren't done via the server call
            if (isIndexOf(study.modalities, modality) &&
                (new Date(studyDateFrom).setHours(0, 0, 0, 0) <= convertStringToStudyDate(study.studyDate) || !studyDateFrom || studyDateFrom === '') &&
                (convertStringToStudyDate(study.studyDate) <= new Date(studyDateTo).setHours(0, 0, 0, 0) || !studyDateTo || studyDateTo === '')) {

                // Convert numberOfStudyRelatedInstance string into integer
                study.numberOfStudyRelatedInstances = !isNaN(study.numberOfStudyRelatedInstances) ? parseInt(study.numberOfStudyRelatedInstances) : undefined;

                // Insert any matching studies into the Studies Collection
                OHIF.studylist.collections.Studies.insert(study);
            }
        });
    });
}

const getRowsPerPage = () => sessionStorage.getItem('rowsPerPage');

// Wraps ReactiveVar equalsFunc function. Whenever ReactiveVar is
// set to a new value, it will save it in the Session Storage.
// The return is the default ReactiveVar equalsFunc if available
// or values are === compared
const setRowsPerPage = (oldValue, newValue) => {
    sessionStorage.setItem('rowsPerPage', newValue);
    return typeof ReactiveVar._isEqual === 'function' ? ReactiveVar._isEqual(oldValue, newValue) : oldValue === newValue;
};

Template.studylistResult.onCreated(() => {
    const instance = Template.instance();
    instance.sortOption = new ReactiveVar();
    instance.sortingColumns = new ReactiveDict();

    // Pagination parameters

    // Rows per page
    // Check session storage or set 25 as default
    const cachedRowsPerPage = getRowsPerPage();
    if (!cachedRowsPerPage) {
        setRowsPerPage(0, 25);
    }

    const rowsPerPage = getRowsPerPage();
    instance.paginationData = {
        class: 'studylist-pagination',
        currentPage: new ReactiveVar(0),
        rowsPerPage: new ReactiveVar(parseInt(rowsPerPage, 10), setRowsPerPage),
        recordCount: new ReactiveVar(0)
    };

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
            modality: 0
        });
    }
});

Template.studylistResult.onRendered(() => {
    const instance = Template.instance();

    // Initialize daterangepicker
    const today = moment();
    const lastWeek = moment().subtract(6, 'days');
    const lastMonth = moment().subtract(29, 'days');
    const $studyDate = instance.$('#studyDate');
    const dateFilterNumDays = OHIF.uiSettings.studyListDateFilterNumDays;
    let startDate, endDate;

    if (dateFilterNumDays) {
        startDate = moment().subtract(dateFilterNumDays - 1, 'days');
        endDate = today;
    }

    instance.datePicker = $studyDate.daterangepicker({
        maxDate: today,
        autoUpdateInput: true,
        startDate: startDate,
        endDate: endDate,
        ranges: {
            Today: [today, today],
            'Last 7 Days': [lastWeek, today],
            'Last 30 Days': [lastMonth, today]
        }
    }).data('daterangepicker');

    if (startDate && endDate) {
        instance.datePicker.updateInputText();
    } else {
        // Retrieve all studies
        search();
    }
});

Template.studylistResult.onDestroyed(() => {
    const instance = Template.instance();

    // Destroy the daterangepicker to prevent residual elements on DOM
    instance.datePicker.remove();
});

function resetSortingColumns(instance, sortingColumn) {
    Object.keys(instance.sortingColumns.keys).forEach(key => {
        if (key !== sortingColumn) {
            instance.sortingColumns.set(key, null);
        }
    });
}

Template.studylistResult.events({
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
