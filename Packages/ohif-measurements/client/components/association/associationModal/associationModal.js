import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { Random } from 'meteor/random';
import { moment } from 'meteor/momentjs:moment';
import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

Template.dialogStudyAssociation.onCreated(() => {
    const instance = Template.instance();

    instance.data.confirmCallback = formData => {
        OHIF.log.info('Saving associations');
        const Timepoints = OHIF.studylist.timepointApi.timepoints;

        // Find the rows of the study association table
        const $tableRows = instance.$('#studyAssociationTable table tbody tr');

        // Create an empty object to group studies into
        const studies = {};

        // Loop through each row to parse the data
        $tableRows.each(function() {
            // Get a selector for this row
            const $row = $(this);

            // Check the includeStudy checkbox to see if we should parse this row
            const includeStudy = $row.find('input.includeStudy[type="checkbox"]').eq(0).prop('checked');
            if (!includeStudy) {
                return;
            }

            // Find the selected timepoint option for this study
            const $timepointInput = $row.find('input.timepointOption[type="radio"]:checked');

            // Find the related label and trim it down to actual label (TODO: do this another way)
            const timepointType = $timepointInput.val();

            // Get the study metaData by checking the row with the template engine Blaze
            const data = Blaze.getData(this);

            // Concatenate the study data to an array, depending on whether is was marked as baseline
            // or follow-up
            if (!studies.hasOwnProperty(timepointType)) {
                studies[timepointType] = [];
            }

            studies[timepointType].push(data);
        });

        const studiesKeys = Object.keys(studies);

        // TODO: REMOVE - Temporary for RSNA
        const hasBaseline = _.contains(studiesKeys, 'baseline');
        if (hasBaseline) {
            const patientId = studies[studiesKeys[0]][0].patientId;
            Timepoints.remove({ patientId });
        }

        studiesKeys.forEach(timepointType => {
            // Get the studies associated with this timepoint
            const relatedStudies = studies[timepointType];

            // Create an array of all the studyInstanceUids for storage in the Timepoint
            const studyInstanceUids = relatedStudies.map(function(study) {
                return study.studyInstanceUid;
            });

            // Create an array of all the studyDates for storage in the Timepoint
            let studyDates = relatedStudies.map(study => moment(study.studyDate).toDate());

            // Sort the study dates, so we can get a range for these values
            studyDates = studyDates.sort();

            // HipaaEventType to log changes in collections
            let hipaaEventType;
            let hipaaEvent;

            // Check if these studies are already associated with an existing Timepoint
            let existingTimepoint;
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

            let timepointId;
            if (existingTimepoint) {
                // If these studies are already associated with an existing Timepoint,
                // and the desired timepoint type is the same (e.g. Follow-up), update
                // this Timepoint instead of creating a new one
                Timepoints.update(existingTimepoint._id, {
                    $set: {
                        studyInstanceUids
                    }
                });
                timepointId = existingTimepoint.timepointId;
                hipaaEventType = 'modify';
            } else {
                // Create a new timepoint to represent the (baseline or follow-up) studies
                let timepoint = {
                    timepointType: timepointType,
                    timepointId: Random.id(),
                    studyInstanceUids: studyInstanceUids,
                    patientId: relatedStudies[0].patientId,
                    earliestDate: studyDates[0],
                    latestDate: studyDates[studyDates.length - 1],
                    isLocked: false
                };

                // Insert this timepoint into the Timepoints Collection
                Timepoints.insert(timepoint);
                timepointId = timepoint.timepointId;
                hipaaEventType = 'create';
            }

            // Log
            hipaaEvent = {
                eventType: hipaaEventType,
                userId: OHIF.user.getUserId(),
                userName: OHIF.user.getName(),
                collectionName: 'Timepoints',
                recordId: timepointId,
                patientId: relatedStudies[0].patientId,
                patientName: relatedStudies[0].patientName
            };
        });

        OHIF.studylist.timepointApi.storeTimepoints();

        return formData;
    };
});
