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

            // Create a new timepoint to represent the (baseline or follow-up) studies
            var timepoint = {
                timepointType: timepointType,
                timepointId: uuid.new(),
                studyInstanceUids: studyInstanceUids,
                patientId: relatedStudies[0].patientId, // TODO: Revisit this (Should timepoints be related to patientId?)
                earliestDate: studyDates[0].format('YYYYMMDD'),
                latestDate: studyDates[studyDates.length - 1].format('YYYYMMDD')
            };

            // Insert this timepoint into the Timepoints Collection
            Timepoints.insert(timepoint);

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
                            timepointId: timepoint.timepointId
                        }
                    });
                } else {
                    // If no such study exists, update the entry with the new timepointId

                    // Clear the ID from the document
                    delete study._id;

                    // Attach the timepointId and insert it into the Studies Collection
                    study.timepointId = timepoint.timepointId;
                    Studies.insert(study);
                }
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
