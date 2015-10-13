createStacks = function(study) {
    var stacks = [];
    // TODO: Split by multi-frame, modality, image size, etc
    study.seriesList.forEach(function(series) {
        if (!series.instances) {
            return;
        }

        // Don't display thumbnails for non-image modalities
        // All imaging modalities must have a valid value for rows (or columns)
        var anInstance = series.instances[0];
        if (!anInstance || !anInstance.rows) {
            return;
        }
        stacks.push(series);
    });
    return stacks;
};