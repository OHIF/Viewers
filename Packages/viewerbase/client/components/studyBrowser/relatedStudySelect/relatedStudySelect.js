Template.relatedStudySelect.helpers({
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

        // Find all studies in the Worklist which have the same patientId as the currently selected study
        var relatedStudies = WorklistStudies.find({
            patientId: currentStudyInBrowser.patientId
        }, {
            sort: {
                studyDate: -1
            }
        }).fetch();

        // If no Study / Timepoint associated studies exist, just
        // return the list of loaded studies
        if (!relatedStudies.length) {
            return ViewerStudies.find();
        }

        // Modify the array of related studies so the default option is the currently selected study
        relatedStudies.forEach(function(study, index) {
            // If the studyInstanceUid matches that of the current study in the browser,
            // Set this to 'selected', so that it becomes the default option
            if (study.studyInstanceUid === currentStudyInBrowser.studyInstanceUid) {
                relatedStudies[index].selected = true;
            }
        });

        // Use this array to populate the combo box
        return relatedStudies;
    }
});

Template.relatedStudySelect.events({
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
