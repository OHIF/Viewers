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

    var earliestStudy = selectedStudies[0];
    var latestStudy = selectedStudies[selectedStudies.length - 1];

    var earliestDate = moment(earliestStudy.studyDate, 'YYYYMMDD');
    earliestDate.subtract(range);

    var latestDate = moment(latestStudy.studyDate, 'YYYYMMDD');
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

    var range = getDateRange(selectedStudies);

    // Fetch autoselected studies based on the date range
    // Note that we used MongoDB's fetch here so we have a mutable array,
    // rather than a Cursor
    var autoselected = WorklistStudies.find({
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
    var studyInstanceUids = selectedStudies.map(function(selectedStudy) {
        return selectedStudy.studyInstanceUid;
    });

    autoselected.forEach(function(study) {
        var exists = studyInstanceUids.indexOf(study.studyInstanceUid);
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
    relevantStudies: function() {
        var selectedStudies = WorklistSelectedStudies.find({}, {
                sort: {
                    studyDate: 1
                }
            }).fetch() || [];

        return autoSelectStudies(selectedStudies);
    },
    /**
     * This helper returns the list of Timepoint types the user can set for this study
     *
     * @returns {Array.<T>}
     */
    timepointOptions: function() {
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
    earliestDate: function() {
        var selectedStudies = WorklistSelectedStudies.find({}, {
            sort: {
                studyDate: 1
            }
        }).fetch();

        var range = getDateRange(selectedStudies);
        if (range) {
            return range.earliestDate;
        }
    },
    latestDate: function() {
        var selectedStudies = WorklistSelectedStudies.find({}, {
            sort: {
                studyDate: 1
            }
        }).fetch();

        var range = getDateRange(selectedStudies);
        if (range) {
            return range.latestDate;
        }
    }
});

Template.studyAssociationTable.events({
    'change input.includeStudy': function(e) {
        var checkbox = e.currentTarget;
        var studyDataCells = $(checkbox).parents('tr').find('td.studyDataCell');
        if (checkbox.checked === true) {
            studyDataCells.removeClass('disabled');
            studyDataCells.find('input').attr('disabled', false);
        } else {
            studyDataCells.addClass('disabled');
            studyDataCells.find('input').attr('disabled', true);
        }
    }
});
