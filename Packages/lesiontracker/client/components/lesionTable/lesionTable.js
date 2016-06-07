Template.lesionTable.helpers({
    targets: function() {
        // All Targets shall be listed first followed by Non-Targets
        return Measurements.find({
            isTarget: true
        }, {
            sort: {
                lesionNumberAbsolute: 1
            }
        });
    },
    nonTargets: function() {
        // All Targets shall be listed first followed by Non-Targets
        return Measurements.find({
            isTarget: false
        }, {
            sort: {
                lesionNumberAbsolute: 1
            }
        });
    },
    newLesions: function() {
        // All Targets shall be listed first followed by Non-Targets
        return Measurements.find({
            saved: false
        }, {
            sort: {
                lesionNumberAbsolute: 1
            }
        });
    },
    timepoints: function() {
        return Timepoints.find({}, {
            sort: {
                latestDate: 1
            }
        });
    },

    buttonGroupData() {
        const instance = Template.instance();
        return {
            value: instance.lesionTableLayout,
            options: [{
                key: 'comparison',
                text: 'Comparison'
            }, {
                key: 'key',
                text: 'Key Timepoints'
            }]
        };
    }
});

Template.lesionTable.events({
    /**
     * Retrieve the lesion id from the DOM data for this row
     */
    /*'click table#tblLesion tbody tr': function(e, template) {
          var measurementId = $(e.currentTarget).data('measurementid');
          activateLesion(measurementId, template.data);
    },*/
});

// Temporary until we have a real window manager with events for series/study changed
Session.setDefault('NewSeriesLoaded', false);

Template.lesionTable.onCreated(function() {
    var instance = this;

    instance.lesionTableLayout = new ReactiveVar();
    instance.lesionTableLayout.set('comparisonTimepoints');
});

Template.lesionTable.onRendered(function() {
    // Find the first measurement by Lesion Number
    var firstLesion = Measurements.findOne({}, {
        sort: {
            lesionNumber: 1
        }
    });

    // Create an object to store the ContentId inside
    var templateData = {
        contentId: Session.get('activeContentId')
    };

    // Activate the first lesion
    if (firstLesion) {
        activateLesion(firstLesion._id, templateData);
    }
});
