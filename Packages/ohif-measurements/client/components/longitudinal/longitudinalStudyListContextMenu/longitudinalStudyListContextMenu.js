// Use Aldeed's meteor-template-extension package to replace the
// default StudyListStudy template.
// See https://github.com/aldeed/meteor-template-extension
const defaultTemplate = 'studyContextMenu';
Template.longitudinalStudyListContextMenu.replaces(defaultTemplate);

StudyList.functions['removeTimepointAssociations'] = removeTimepointAssociations;
StudyList.functions['exportSelectedStudies'] = exportSelectedStudies;
StudyList.functions['viewStudies'] = viewStudies;

/**
 * Removes all present study / timepoint associations from the Clinical Trial
 */
function removeTimepointAssociations() {
    // Get a Cursor pointing to the selected Studies from the StudyList
    const selectedStudies = StudyListSelectedStudies.find({}, {
        sort: {
            studyDate: 1
        }
    });

    // Loop through the Cursor of Selected Studies
    selectedStudies.forEach(function(selectedStudy) {
        // Find the Timepoint that was previously referenced
        const timepointApi = Template.instance().timepointApi;
        if (!timepointApi) {
            return;
        }

        let timepoint = timepointApi.study(data.study.studyInstanceUid)[0];
        if (!timepoint) {
            return;
        }

        // Find the index of the current studyInstanceUid in the array
        // of reference studyInstanceUids
        var index = timepoint.studyInstanceUids.indexOf(study.studyInstanceUid);
        if (index < 0) {
            return;
        }

        // Remove the specified studyInstanceUid from the array of associated studyInstanceUids
        timepoint.studyInstanceUids.splice(index, 1);

        // Check if there are still one or more Studies associated with this Timepoint
        if (timepoint.studyInstanceUids.length) {
            // Update the Timepoints Collection with this modified array for the
            // studyInstanceUids attribute
            Timepoints.update(timepoint._id, {
                $set: {
                    studyInstanceUids: timepoint.studyInstanceUids
                }
            });

            // Log
            var hipaaEvent = {
                eventType: 'modify',
                userId: Meteor.userId(),
                userName: Meteor.user().profile.fullName,
                collectionName: "Timepoints",
                recordId: study.timepointId,
                patientId: study.patientId,
                patientName: study.patientName
            };
            HipaaLogger.logEvent(hipaaEvent);
        } else {
            // If no more Studies are associated with this Timepoint, we should remove it
            // from the Timepoints Collection via a server call
            Meteor.call('removeTimepoint', timepoint._id, function(error) {
                if (error) {
                    log.warn(error);
                    return;
                }

                // Log
                var hipaaEvent = {
                    eventType: 'delete',
                    userId: Meteor.userId(),
                    userName: Meteor.user().profile.fullName,
                    collectionName: "Timepoints",
                    recordId: study.timepointId,
                    patientId: study.patientId,
                    patientName: study.patientName
                };
                HipaaLogger.logEvent(hipaaEvent);
            });
        }
    });
}

// ---------- TODO: Remove these duplicated functions below -------------


/**
 * Exports all selected studies on the studylist
 */
function exportSelectedStudies() {
    const selectedStudies = StudyListSelectedStudies.find({}, {
        sort: {
            studyDate: 1
        }
    }).fetch();

    if (!selectedStudies || !selectedStudies.length) {
        return;
    }

    exportStudies(selectedStudies);
}

/**
 * Loads multiple unassociated studies in the Viewer
 */
function viewStudies() {
    console.log('viewStudies');
    const selectedStudies = StudyListSelectedStudies.find({}, {
        sort: {
            studyDate: 1
        }
    }).fetch();

    if (!selectedStudies || !selectedStudies.length) {
        return;
    }

    var title = selectedStudies[0].patientName;
    var studyInstanceUids = selectedStudies.map(function(study) {
        return study.studyInstanceUid;
    });

    // Generate a unique ID to represent this tab
    // We can't just use the Mongo entry ID because
    // then it will change after hot-reloading.
    const contentid = Random.id();

    // Update the ViewerData global object
    ViewerData[contentid] = {
        title: title,
        contentid: contentid,
        studyInstanceUids: studyInstanceUids
    };

    // Switch to the new tab
    switchToTab(contentid);
}
