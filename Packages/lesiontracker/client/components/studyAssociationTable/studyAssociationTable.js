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
 *
 * @returns {Array}
 */
function autoSelectStudies(selectedStudies) {
    if (!selectedStudies.length) {
        return;
    }

    var range = getDateRange(selectedStudies);

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
        var autoselected = autoSelectStudies(selectedStudies);
        return autoselected;
    },
    /**
     * This helper returns the list of Timepoint types the user can set for this study
     *
     * @returns {Array.<T>}
     */
    timepointOptions: function() {
        return [
            {
                value: 'baseline',
                name: 'Baseline'
            },
            {
                value: 'followup',
                name: 'Follow-up'
            }
        ];
    },
    earliestDate: function() {
        var selectedStudies = WorklistSelectedStudies.find({}, {
            sort: {
                studyDate: 1
            }
        }).fetch();
        var range = getDateRange(selectedStudies);
        if (!range) {
            return;
        }

        return range.earliestDate;
    },
    latestDate: function() {
        var selectedStudies = WorklistSelectedStudies.find({}, {
            sort: {
                studyDate: 1
            }
        }).fetch();
        var range = getDateRange(selectedStudies);
        if (!range) {
            return;
        }

        return range.latestDate;
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

//trial criteria!
/*There shall be Associate option in right-click dialog
If associated, double-click shall go to image view.
    If not associated, user shall be directed to Associate Time Points Dialog
Use shall also be allowed to select multiple studies from study list to associate
Associate Time Point dialog shall present selected studies and studies within defined time window of =/- 14 days of selected studies
User should only be able to associate one time point at a time (user should not be able to select both BL and F/U for different studies in associate dialog)
   */