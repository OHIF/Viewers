import { OHIF } from 'meteor/ohif:core';

/**
 * Returns timepoint object given a specified imageId
 *
 * @param imageId
 * @returns {*|{}} Timepoint object
 */
OHIF.measurements.getTimepointObject = imageId => {
    const study = cornerstoneTools.metaData.get('study', imageId);
    if (!study) {
        return;
    }

    return Timepoints.findOne({
        studyInstanceUids: {
            $in: [study.studyInstanceUid]
        }
    });
};
