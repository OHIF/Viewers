import { Template } from 'meteor/templating';
import { moment } from 'meteor/momentjs:moment';
import { OHIF } from 'meteor/ohif:core';

/**
 * Finds related studies within defined time window of =/- 14 days of selected studies
 * @param selectedStudies
 * @param range Object
 */
function getDateRange(selectedStudies, range) {
    if (range === undefined) {
        range = {
            days: 14
        };
    }

    if (!selectedStudies.length) {
        return;
    }

    const earliestStudy = selectedStudies[0];
    const latestStudy = selectedStudies[selectedStudies.length - 1];

    const earliestDate = moment(earliestStudy.studyDate, 'YYYYMMDD');
    earliestDate.subtract(range);

    const latestDate = moment(latestStudy.studyDate, 'YYYYMMDD');
    latestDate.add(range);

    return {
        earliestDate: earliestDate,
        latestDate: latestDate
    };
}

/**
 * Selects all studies related to the currently input studies,
 * based on various criteria. Returns the entire array of related studies.
 *
 * (at the moment, this is only the date range +/- 14 days, with a matching patientId)
 *
 * @param selectedStudies A user-selected list of studies
 * @returns {*} The entire array of related studies
 */
function autoSelectStudies(selectedStudies) {
    if (!selectedStudies.length) {
        return;
    }

    const range = getDateRange(selectedStudies);

    // Fetch autoselected studies based on the date range
    // Note that we used MongoDB's fetch here so we have a mutable array,
    // rather than a Cursor
    const autoselected = OHIF.studylist.collections.Studies.find({
        studyDate: {
            $gte: range.earliestDate.format('YYYYMMDD'),
            $lte: range.latestDate.format('YYYYMMDD')
        }
    }, {
        sort: {
            studyDate: 1
        }
    }).fetch();

    // Make an array of studyInstanceUids in selectedStudies
    const studyInstanceUids = selectedStudies.map(selectedStudy => selectedStudy.studyInstanceUid);

    autoselected.forEach(study => {
        const exists = studyInstanceUids.indexOf(study.studyInstanceUid);
        if (exists > -1) {
            study.autoselected = false;
            return;
        }

        study.autoselected = true;
    });

    return autoselected;
}

Template.studyAssociationTable.helpers({
    /**
     * This helpers includes the user-selected and autoselected studies
     * to be associated.
     *
     * @returns {Array.<T>}
     */
    relevantStudies() {
        const selectedStudies = OHIF.studylist.getSelectedStudies();

        return autoSelectStudies(selectedStudies);
    },
    /**
     * This helper returns the list of Timepoint types the user can set for this study
     *
     * @returns {Array.<T>}
     */
    timepointOptions() {
        return [{
                value: 'baseline',
                name: 'Baseline',
                checked: true
            }, {
                value: 'followup',
                name: 'Follow-up',
                checked: false
            }];
    },
    earliestDate() {
        const selectedStudies = OHIF.studylist.getSelectedStudies();

        const range = getDateRange(selectedStudies);
        if (range) {
            return range.earliestDate;
        }
    },
    latestDate() {
        const selectedStudies = OHIF.studylist.getSelectedStudies();

        const range = getDateRange(selectedStudies);
        if (range) {
            return range.latestDate;
        }
    }
});

Template.studyAssociationTable.events({
    'change input.includeStudy'(event, instance) {
        const checkbox = event.currentTarget;
        const studyRow = $(checkbox).closest('tr');
        const studyDataCells = studyRow.find('td.studyDataCell');

        if (checkbox.checked === true) {
            studyRow.removeClass('disabled');
            studyDataCells.find('input').attr('disabled', false);
        } else {
            studyRow.addClass('disabled');
            studyDataCells.find('input').attr('disabled', true);
        }
    }
});
