Template.lesionTableView.helpers({
    targets: function () {
        // All Targets shall be listed first followed by Non-Targets
        return Measurements.find({
            isTarget: true
        }, {
            sort: {
                lesionNumberAbsolute: 1
            }
        });
    },
    nonTargets: function () {
        // All Targets shall be listed first followed by Non-Targets
        return Measurements.find({
            isTarget: false
        }, {
            sort: {
                lesionNumberAbsolute: 1
            }
        });
    },
    newLesions: function () {
        // All Targets shall be listed first followed by Non-Targets
        return Measurements.find({
            saved: false
        }, {
            sort: {
                lesionNumberAbsolute: 1
            }
        });
    }
});