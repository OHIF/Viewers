/**
 * Returns timepoint object given a specified imageId
 *
 * @param imageId
 * @returns {*|{}} Timepoint object
 */
getTimepointObject = function(imageId) {
    var study = cornerstoneTools.metaData.get('study', imageId);
    if (!study) {
        return;
    }

    return Timepoints.findOne({
        studyInstanceUids: {
            $in: [study.studyInstanceUid]
        }
    });
};
