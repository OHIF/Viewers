Template.lesionTable.onCreated(() => {
    const instance = Template.instance();

    instance.data.lesionTableLayout = new ReactiveVar('comparison');
    instance.data.timepoints = new ReactiveVar([]);

    instance.autorun(() => {
        // Get the current table layout
        const tableLayout = instance.data.lesionTableLayout.get();

        // Get all the timepoints
        const allTimepoints = Timepoints.find({}, {
            sort: {
                latestDate: -1
            }
        }).fetch();

        // Get the last 2 timepoints
        let timepoints = allTimepoints.slice(0, 2);

        // Concatenate the baseline if the table layout is for key timepoints
        if (tableLayout === 'key' && allTimepoints.length > 2) {
            timepoints = timepoints.concat(_.last(allTimepoints));
        }

        // Return key timepoints
        instance.data.timepoints.set(timepoints);
    });
});

// Temporary until we have a real window manager with events for series/study changed
Session.setDefault('NewSeriesLoaded', false);

Template.lesionTable.onRendered(() => {
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

Template.lesionTable.events({
    /**
     * Retrieve the lesion id from the DOM data for this row
     */
    /*'click table#tblLesion tbody tr': function(e, template) {
          var measurementId = $(e.currentTarget).data('measurementid');
          activateLesion(measurementId, template.data);
    },*/
});

Template.lesionTable.helpers({
    dataContainer() {
        return {};
    },

    buttonGroupData() {
        const instance = Template.instance();
        return {
            value: instance.data.lesionTableLayout,
            options: [{
                value: 'comparison',
                text: 'Comparison'
            }, {
                value: 'key',
                text: 'Key Timepoints'
            }]
        };
    }
});
