Template.studyDateList.helpers({
    /**
     * Returns an array of studies that are related to the current study by patient ID.
     * The value for 'selected' for the currently loaded study is set to true, so that
     * this becomes the current option in the combo box.
     *
     * @returns {*} Array of studies that are related to the current study by patient ID
     */
    relatedStudies: function() {
        // Check which study is currently loaded into the study browser
        var currentStudyInBrowser = ViewerStudies.findOne({
            selected: true
        });

        // Find all Timepoint-associated studies which have the same patientId as the currently selected study
        var relatedStudies = Studies.find({
            patientId: currentStudyInBrowser.patientId
        }, {
            sort: {
                studyDate: -1
            }
        });

        // Modify the array of related studies so the default option is the currently selected study
        relatedStudies.forEach(function(study) {
            // If the studyInstanceUid matches that of the current study in the browser,
            // Set this to 'selected', so that it becomes the default option
            if (study.studyInstanceUid === currentStudyInBrowser.studyInstanceUid) {
                study.selected = true;
            }
        });

        // Use this array to populate the combo box
        return relatedStudies;
    },
    timepointName: function() {
        var data = this;
        var study = Studies.findOne({
            studyInstanceUid: data.studyInstanceUid
        });

        if (!study) {
            return;
        }

        var timepoint = Timepoints.findOne({
            timepointId: study.timepointId
        });

        if (!timepoint) {
            return;
        }

        return getTimepointName(timepoint);
    }
});

Template.studyDateList.events({
    /**
     * When the study date selector combo box is changed, we will
     * hide the select box, temporarily display a loading sign, and grab
     * the selected study. Once the study has been retrieved it is added
     * into the ViewerStudies collection and set as selected. This reactively
     * populated the thumbnail browser.
     *
     * @param e The select box change event
     */
    'change select#selectStudyDate': function(e) {
        var selectBox = $(e.currentTarget);
        var studyInstanceUid = selectBox.val();

        // Hide the select box
        selectBox.css('display', 'none');

        // Show the loading indicator
        var loadingIndicator = selectBox.siblings('.loading');
        loadingIndicator.css('display', 'block');

        getStudyMetadata(studyInstanceUid, function(study) {
            sortStudy(study);

            // Hide the loading indicator
            loadingIndicator.css('display', 'none');

            // Show the select box again
            selectBox.css('display', 'block');

            // Set "Selected" to false for the entire collection
            ViewerStudies.update({}, {
                $set: {
                    selected: false
                }
            }, {
                multi: true
            });

            // Check if this study already exists in the ViewerStudies collection
            // of loaded studies. If it does, set it's 'selected' value to true.
            var existingStudy = ViewerStudies.findOne({
                studyInstanceUid: studyInstanceUid
            });

            if (existingStudy) {
                // Set the current finding in the collection to true
                ViewerStudies.update(existingStudy._id, {
                    $set: {
                        selected: true
                    }
                });
                return;
            }

            // If the study does not exist, add the 'selected' key to the object
            // with the value True, and insert it into the ViewerStudies Collection
            study.selected = true;
            ViewerStudies.insert(study);
        });
    }
});
