Template.associationModal.events({
    'click #saveAssociations': function(e) {
        log.info('Saving associations');

        // Close the modal
        var saveButton = $(e.currentTarget);
        saveButton.attr('disabled', true);
        saveButton.addClass('btn-success').removeClass('btn-primary');

        // Find the rows of the study association table
        var tableRows = $('#studyAssociationTable table tbody tr');

        // Create an empty object to group studies into
        var studies = {};

        // Loop through each row to parse the data
        tableRows.each(function() {
            // Get a selector for this row
            var row = $(this);

            // Check the includeStudy checkbox to see if we should parse this row
            var includeStudy = row.find('input.includeStudy[type="checkbox"]').eq(0).prop('checked');
            if (!includeStudy) {
                return;
            }

            // Find the selected timepoint option for this study
            var timepointInput = row.find('input.timepointOption[type="radio"]:checked');

            // Find the related label and trim it down to actual label (TODO: do this another way)
            var timepointType = timepointInput.val();

            // Get the study metaData by checking the row with the template engine Blaze
            var data = Blaze.getData(this);

            // Concatenate the study data to an array, depending on whether is was marked as baseline
            // or follow-up
            if (!studies.hasOwnProperty(timepointType)) {
                studies[timepointType] = [];
            }

            studies[timepointType].push(data);
        });

        Object.keys(studies).forEach(function(timepointType) {
            // Get the studies associated with this timepoint
            var relatedStudies = studies[timepointType];

            // Create an array of all the studyInstanceUids for storage in the Timepoint
            var studyInstanceUids = relatedStudies.map(function(study) {
                return study.studyInstanceUid;
            });

            // Create an array of all the studyDates for storage in the Timepoint
            var studyDates = relatedStudies.map(function(study) {
                return moment(study.studyDate, 'YYYYMMDD');
            });

            // Sort the study dates, so we can get a range for these values
            studyDates = studyDates.sort();

            // HipaaEventType to log changes in collections
            var hipaaEventType;
            var hipaaEvent;

            // Check if these studies are already associated with an existing Timepoint
            var existingTimepoint;
            if (timepointType === 'baseline') {
                // If we're trying to associate them to the Baseline, we don't need to
                // check if the studyInstanceUids are already associated with anything else
                existingTimepoint = Timepoints.findOne({
                    patientId: relatedStudies[0].patientId,
                    timepointType: 'baseline'
                });
            } else {
                // If we're trying to associate them to a Follow-up, we should check if any
                // of them are already part of a Follow-up (e.g. Follow-up 1), so that
                // the rest will also be associated with Follow-up 1.
                existingTimepoint = Timepoints.findOne({
                    patientId: relatedStudies[0].patientId,
                    studyInstanceUids: {
                        $in: studyInstanceUids
                    }
                });
            }

            var timepointId;
            if (existingTimepoint) {
                // If these studies are already associated with an existing Timepoint,
                // and the desired timepoint type is the same (e.g. Follow-up), update
                // this Timepoint instead of creating a new one
                Timepoints.update(existingTimepoint._id, {
                    $set: {
                        studyInstanceUids: studyInstanceUids
                    }
                });
                timepointId = existingTimepoint.timepointId;
                hipaaEventType = 'modify';
            } else {
                // Create a new timepoint to represent the (baseline or follow-up) studies
                var timepoint = {
                    timepointType: timepointType,
                    timepointId: uuid.new(),
                    studyInstanceUids: studyInstanceUids,
                    patientId: relatedStudies[0].patientId,
                    earliestDate: studyDates[0].format('YYYYMMDD'),
                    latestDate: studyDates[studyDates.length - 1].format('YYYYMMDD')
                };

                // Insert this timepoint into the Timepoints Collection
                Timepoints.insert(timepoint);
                timepointId = timepoint.timepointId;
                hipaaEventType = 'create';
            }

            // Log
            hipaaEvent = {
                eventType: hipaaEventType,
                userId: Meteor.userId(),
                userName: Meteor.user().profile.fullName,
                collectionName: "Timepoints",
                recordId: timepointId,
                patientId: relatedStudies[0].patientId,
                patientName: relatedStudies[0].patientName
            };

            // Loop through these studies to associate them with the newly created timepoint
            relatedStudies.forEach(function(study) {
                // Check if a study already exists in the Studies collection
                var existingStudy = Studies.findOne({
                    studyInstanceUid: study.studyInstanceUid
                });

                if (existingStudy) {
                    // If a study already exists, update the entry with the new timepointId
                    Studies.update(existingStudy._id, {
                        $set: {
                            timepointId: timepointId
                        }
                    });
                    // Log modify
                    hipaaEventType = 'modify';
                } else {
                    // If no such study exists, update the entry with the new timepointId

                    // Clear the ID from the document
                    delete study._id;

                    // Attach the timepointId and insert it into the Studies Collection
                    study.timepointId = timepointId;
                    Studies.insert(study);

                    // Log create
                    hipaaEventType = 'create';
                }

                // Log
                hipaaEvent = {
                    eventType: hipaaEventType,
                    userId: Meteor.userId(),
                    userName: Meteor.user().profile.fullName,
                    collectionName: "Studies",
                    recordId: study.studyInstanceUid,
                    patientId: study.patientId,
                    patientName: study.patientName
                };
                HipaaLogger.logEvent(hipaaEvent);
            });
        });

        // Hide the modal
        $('#associationModal').modal('hide');

        // Reset the save button to its normal state
        saveButton.removeClass('btn-success').addClass('btn-primary');
        saveButton.attr('disabled', false);
    },
    'click #cancelAssociation': function() {
        // When the modal is closed, we should reset
        // the save button to its normal state
        var saveButton = $('#saveAssociations');
        saveButton.removeClass('btn-success').addClass('btn-primary');
        saveButton.attr('disabled', false);
    }
});
