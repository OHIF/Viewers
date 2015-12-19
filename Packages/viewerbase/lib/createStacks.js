/**
 * Creates a set of series to be placed in the Study Browser
 * The series that appear in the Study Browser must represent
 * imaging modalities.
 *
 * Furthermore, for drag/drop functionality,
 * it is easiest if the stack objects also contain information about
 * which study they are linked to.
 *
 * @param study The study instance to be used
 * @returns {Array} An array of series to be placed in the Study Browser
 */
createStacks = function(study) {
    // Define an empty array of stacks
    var stacks = [];

    // TODO: Split by multi-frame, modality, image size, etc
    study.seriesList.forEach(function(series) {
        // If the series has no instances, skip it
        if (!series.instances) {
            return;
        }

        // Don't display thumbnails for non-image modalities
        // All imaging modalities must have a valid value for rows (or columns)
        var anInstance = series.instances[0];
        if (!anInstance || !anInstance.rows) {
            return;
        }

        // Include the study instance Uid for drag/drop purposes
        series.studyInstanceUid = study.studyInstanceUid;

        // Add this series to the list of stacks
        stacks.push(series);
    });
    return stacks;
};